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
