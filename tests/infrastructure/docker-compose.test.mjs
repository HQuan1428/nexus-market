import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDirectory, '..', '..');
const composePath = path.join(repoRoot, 'docker-compose.yml');

function requireComposeFile() {
  assert.ok(
    fs.existsSync(composePath),
    'Expected docker-compose.yml to exist at the repository root.',
  );
}

function loadComposeModel() {
  requireComposeFile();

  const command = spawnSync(
    'docker',
    ['compose', '-f', composePath, 'config', '--format', 'json'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
    },
  );

  assert.equal(command.status, 0, command.stderr || command.stdout);

  return JSON.parse(command.stdout);
}

function serviceByName(model, name) {
  assert.ok(model.services?.[name], `Expected Compose service "${name}" to exist.`);
  return model.services[name];
}

test('Compose defines exactly the required five services on the explicit nexus_network bridge', () => {
  const model = loadComposeModel();
  const serviceNames = Object.keys(model.services ?? {}).sort();

  assert.deepEqual(serviceNames, ['adminer', 'app', 'minio', 'postgres', 'redis']);
  assert.deepEqual(Object.keys(model.networks ?? {}), ['nexus_network']);
  assert.equal(model.networks.nexus_network.driver, 'bridge');
});

test('Compose uses the mandated images, persistence, and health-aware dependencies', () => {
  const model = loadComposeModel();
  const app = serviceByName(model, 'app');
  const postgres = serviceByName(model, 'postgres');
  const redis = serviceByName(model, 'redis');
  const minio = serviceByName(model, 'minio');
  const adminer = serviceByName(model, 'adminer');

  assert.equal(postgres.image, 'pgvector/pgvector:pg16');
  assert.equal(redis.image, 'redis:alpine');
  assert.equal(minio.image, 'minio/minio');
  assert.equal(adminer.image, 'adminer');

  assert.ok(app.build, 'Expected app service to build from the local Dockerfile.');
  assert.deepEqual(
    Object.keys(model.volumes ?? {}).sort(),
    ['nexus_minio_data', 'nexus_postgres_data'],
  );
  assert.equal(redis.volumes, undefined);

  for (const [name, service] of Object.entries({ app, postgres, redis, minio, adminer })) {
    assert.ok(service.healthcheck, `Expected ${name} to define a healthcheck.`);
  }

  assert.equal(app.depends_on?.postgres?.condition, 'service_healthy');
  assert.equal(app.depends_on?.redis?.condition, 'service_healthy');
  assert.equal(app.depends_on?.minio?.condition, 'service_healthy');
  assert.equal(adminer.depends_on?.postgres?.condition, 'service_healthy');
  assert.equal(Object.keys(adminer.depends_on ?? {}).length, 1);
});
