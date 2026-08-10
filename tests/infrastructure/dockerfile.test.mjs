import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDirectory, '..', '..');
const dockerfilePath = path.join(repoRoot, 'Dockerfile');
const dockerignorePath = path.join(repoRoot, '.dockerignore');

function readDockerfile() {
  assert.ok(
    fs.existsSync(dockerfilePath),
    'Expected Dockerfile to exist at the repository root.',
  );

  return fs.readFileSync(dockerfilePath, 'utf8');
}

function readDockerignore() {
  assert.ok(
    fs.existsSync(dockerignorePath),
    'Expected .dockerignore to exist at the repository root.',
  );

  return fs.readFileSync(dockerignorePath, 'utf8');
}

function parseDockerStages(dockerfile) {
  return dockerfile
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^FROM\s+/i.test(line))
    .map((line) => {
      const match = line.match(/^FROM\s+([^\s]+)(?:\s+AS\s+([^\s]+))?$/i);
      assert.ok(match, `Expected valid Docker FROM syntax: ${line}`);
      return {
        base: match[1],
        alias: match[2],
      };
    });
}

function getDockerStage(dockerfile, alias) {
  const stageStart = dockerfile.search(
    new RegExp(`^FROM\\s+[^\\s]+\\s+AS\\s+${alias}\\s*$`, 'im'),
  );

  assert.notEqual(stageStart, -1, `Expected Dockerfile to define the ${alias} stage.`);

  const stageAndFollowing = dockerfile.slice(stageStart);
  const firstLineEnd = stageAndFollowing.indexOf('\n');
  const remainingDockerfile =
    firstLineEnd === -1 ? '' : stageAndFollowing.slice(firstLineEnd + 1);
  const followingStageOffset = remainingDockerfile.search(/^FROM\s+/im);

  return followingStageOffset === -1
    ? stageAndFollowing
    : stageAndFollowing.slice(0, firstLineEnd + 1 + followingStageOffset);
}

function assertNodeDerivedStages(stages) {
  const derivationMap = new Map();

  for (const stage of stages) {
    const directNodeBase = stage.base === 'node:22-bookworm-slim';
    const aliasDerivedBase = derivationMap.get(stage.base) === true;
    const isDerived = directNodeBase || aliasDerivedBase;

    assert.ok(
      isDerived,
      `Expected every Docker stage to derive from node:22-bookworm-slim, but found base ${stage.base}.`,
    );

    if (stage.alias) {
      derivationMap.set(stage.alias, true);
    }
  }
}

test('Dockerfile uses only stages derived from the required Node 22 base image, including the final runner', () => {
  const dockerfile = readDockerfile();
  const stages = parseDockerStages(dockerfile);

  assert.ok(stages.length > 0, 'Expected Dockerfile to define at least one build stage.');
  assertNodeDerivedStages(stages);
  assert.ok(
    stages.some((stage) => stage.base === 'node:22-bookworm-slim'),
    'Expected Dockerfile to reference node:22-bookworm-slim directly.',
  );
});

test('Dockerfile enables Corepack and pins pnpm 11.18.0', () => {
  const dockerfile = readDockerfile();

  assert.match(dockerfile, /corepack\s+enable/i);
  assert.match(dockerfile, /corepack\s+prepare\s+pnpm@11\.18\.0\s+--activate/i);
});

test('Dockerfile installs dependencies with frozen lockfile, builds, and starts the app', () => {
  const dockerfile = readDockerfile();

  assert.match(dockerfile, /pnpm\s+install\s+--frozen-lockfile/i);
  assert.match(dockerfile, /pnpm\s+build/i);
  assert.match(dockerfile, /(CMD|ENTRYPOINT)\s+\[?"?pnpm"?/i);
  assert.match(dockerfile, /(CMD|ENTRYPOINT)[^\n]*"?start"?/i);
});

test('Dockerfile prevents pnpm from mutating dependencies when the non-root runner starts', () => {
  const dockerfile = readDockerfile();
  const runnerStage = getDockerStage(dockerfile, 'runner');

  assert.match(
    runnerStage,
    /^ENV[ \t]+PNPM_CONFIG_VERIFY_DEPS_BEFORE_RUN=false[ \t]*$/m,
    'Expected the immutable runner to disable pnpm dependency auto-install before pnpm start.',
  );
});

test('Dockerfile assigns node ownership to every runtime input copied into the final runner', () => {
  const dockerfile = readDockerfile();
  const runnerStage = getDockerStage(dockerfile, 'runner');
  const runnerCopies = runnerStage
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^COPY\b/i.test(line));

  assert.deepEqual(
    runnerCopies,
    [
      'COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules',
      'COPY --chown=node:node --from=build /app/.next ./.next',
      'COPY --chown=node:node --from=build /app/public ./public',
      'COPY --chown=node:node --from=build /app/package.json ./package.json',
      'COPY --chown=node:node --from=build /app/next.config.ts ./next.config.ts',
    ],
    'Expected the runner to copy every production runtime input explicitly.',
  );
  assert.ok(runnerCopies.length > 0, 'Expected the runner to copy production runtime inputs.');
  for (const copyInstruction of runnerCopies) {
    assert.match(
      copyInstruction,
      /^COPY\s+--chown=node:node\b/i,
      `Expected runner COPY to assign node ownership: ${copyInstruction}`,
    );
  }
});

test('Dockerfile switches the effective final runner to the unprivileged node user before startup', () => {
  const dockerfile = readDockerfile();
  const stages = parseDockerStages(dockerfile);
  const runnerStage = getDockerStage(dockerfile, 'runner');

  assert.equal(
    stages.at(-1)?.alias,
    'runner',
    'Expected the runner stage to be the effective final Dockerfile stage.',
  );

  const instructions = runnerStage
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => line && !line.startsWith('#'));
  const startupInstructions = instructions.filter(({ line }) => /^(CMD|ENTRYPOINT)\b/i.test(line));
  const effectiveStartup = startupInstructions.at(-1);
  const applicableUsers = instructions.filter(
    ({ line, index }) => /^USER\b/i.test(line) && effectiveStartup && index < effectiveStartup.index,
  );
  const effectiveUser = applicableUsers.at(-1);

  assert.ok(effectiveStartup, 'Expected the runner to define a startup instruction.');
  assert.equal(
    effectiveUser?.line,
    'USER node',
    'Expected the effective user immediately before startup to be USER node.',
  );
  assert.ok(
    effectiveUser && effectiveUser.index < effectiveStartup.index,
    'Expected USER node to be applied before the application starts.',
  );
});

test('real .dockerignore excludes secrets, dependencies, build output, Git metadata, and local worktrees', () => {
  const dockerignore = readDockerignore();
  const exclusions = new Set(
    dockerignore
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#')),
  );

  for (const requiredExclusion of ['.env*', 'node_modules', '.next', '.git', '.worktrees']) {
    assert.ok(
      exclusions.has(requiredExclusion),
      `Expected .dockerignore to exclude ${requiredExclusion}.`,
    );
  }
});
