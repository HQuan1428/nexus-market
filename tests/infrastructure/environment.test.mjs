import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDirectory, '..', '..');
const envExamplePath = path.join(repoRoot, '.env.example');
const composePath = path.join(repoRoot, 'docker-compose.yml');
const requiredVariables = [
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'MINIO_ROOT_USER',
  'MINIO_ROOT_PASSWORD',
];

function readEnvExample() {
  assert.ok(
    fs.existsSync(envExamplePath),
    'Expected .env.example to exist at the repository root.',
  );

  return fs.readFileSync(envExamplePath, 'utf8');
}

function readComposeFile() {
  assert.ok(
    fs.existsSync(composePath),
    'Expected docker-compose.yml to exist at the repository root.',
  );

  return fs.readFileSync(composePath, 'utf8');
}

function runComposeConfigWithMissing(variableName) {
  const environment = { ...process.env };

  for (const requiredVariable of requiredVariables) {
    delete environment[requiredVariable];
  }

  environment[variableName] = '';

  return spawnSync(
    'docker',
    ['compose', '--env-file', envExamplePath, '-f', composePath, 'config'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: environment,
    },
  );
}

test('The example environment file documents every required non-secret placeholder', () => {
  const envExample = readEnvExample();

  for (const variableName of requiredVariables) {
    const match = envExample.match(new RegExp(`^${variableName}=([^\\r\\n]*)$`, 'm'));

    assert.ok(match, `Expected ${variableName} to be documented in .env.example.`);
    assert.match(
      match[1],
      /^replace_me_local_only_[A-Za-z0-9_]+$/,
      `Expected ${variableName} to use an obvious non-secret placeholder.`,
    );
  }
});

test('Compose source uses fail-closed required substitutions for every required local variable', () => {
  if (!fs.existsSync(envExamplePath) || !fs.existsSync(composePath)) {
    test.skip('Compose source validation starts once both .env.example and docker-compose.yml exist.');
    return;
  }

  const composeFile = readComposeFile();

  for (const variableName of requiredVariables) {
    assert.match(
      composeFile,
      new RegExp(`\\$\\{${variableName}:\\?[^}]+\\}`),
      `Expected docker-compose.yml to require ${variableName} with \${${variableName}:?message}.`,
    );
    assert.doesNotMatch(
      composeFile,
      new RegExp(`\\$\\{${variableName}:-`),
      `Expected docker-compose.yml to fail closed for ${variableName} without a default value.`,
    );
  }
});

test('Compose fails when each required environment variable is absent', () => {
  if (!fs.existsSync(envExamplePath) || !fs.existsSync(composePath)) {
    test.skip('Compose validation starts once both .env.example and docker-compose.yml exist.');
    return;
  }

  for (const variableName of requiredVariables) {
    const command = runComposeConfigWithMissing(variableName);
    const combinedOutput = `${command.stdout}\n${command.stderr}`;

    assert.notEqual(
      command.status,
      0,
      `Expected docker compose config to fail when ${variableName} is empty.`,
    );
    assert.match(
      combinedOutput,
      new RegExp(variableName),
      `Expected Compose output to name ${variableName}.`,
    );
  }
});

test('Git ignores .env but keeps .env.example visible to version control', () => {
  const ignoredEnv = spawnSync('git', ['check-ignore', '--no-index', '--quiet', '.env'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const visibleExample = spawnSync('git', ['check-ignore', '--no-index', '--quiet', '.env.example'], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  assert.equal(ignoredEnv.status, 0, 'Expected .env to be ignored by Git.');
  assert.equal(visibleExample.status, 1, 'Expected .env.example not to be ignored by Git.');
});
