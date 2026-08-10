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

test('The example environment file documents every required non-secret variable', () => {
  const envExample = readEnvExample();

  for (const variableName of requiredVariables) {
    assert.match(
      envExample,
      new RegExp(`^${variableName}=.+$`, 'm'),
      `Expected ${variableName} to be documented in .env.example.`,
    );
  }
});

test('Compose source uses fail-closed required substitutions for every secret-bearing variable', () => {
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

test('Compose fails with variable-specific messages when required environment values are absent', () => {
  if (!fs.existsSync(envExamplePath) || !fs.existsSync(composePath)) {
    test.skip('Compose validation starts once both .env.example and docker-compose.yml exist.');
    return;
  }

  const command = spawnSync(
    'docker',
    ['compose', '--env-file', envExamplePath, '-f', composePath, 'config'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      env: {
        ...process.env,
        POSTGRES_DB: '',
        POSTGRES_USER: '',
        POSTGRES_PASSWORD: '',
        MINIO_ROOT_USER: '',
        MINIO_ROOT_PASSWORD: '',
      },
    },
  );

  assert.notEqual(command.status, 0, 'Expected docker compose config to fail without required values.');
  const combinedOutput = `${command.stdout}\n${command.stderr}`;

  for (const variableName of requiredVariables) {
    assert.match(
      combinedOutput,
      new RegExp(variableName),
      `Expected Compose output to mention ${variableName}.`,
    );
  }
});
