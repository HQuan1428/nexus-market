import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDirectory, '..', '..');
const dockerfilePath = path.join(repoRoot, 'Dockerfile');

function readDockerfile() {
  assert.ok(
    fs.existsSync(dockerfilePath),
    'Expected Dockerfile to exist at the repository root.',
  );

  return fs.readFileSync(dockerfilePath, 'utf8');
}

test('Dockerfile uses the required Node 22 build and runtime base image', () => {
  const dockerfile = readDockerfile();

  assert.match(dockerfile, /^FROM\s+node:22-bookworm-slim\b/gm);
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
