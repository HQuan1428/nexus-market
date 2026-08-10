import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDirectory, '..', '..');
const composePath = path.join(repoRoot, 'docker-compose.yml');
const expectedServiceNames = ['adminer', 'app', 'minio', 'postgres', 'redis'];
const expectedHealthcheckFields = ['test', 'interval', 'timeout', 'retries'];

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

function assertUsesOnlyNexusNetwork(service, serviceName) {
  const networkNames = Object.keys(service.networks ?? {});
  assert.deepEqual(
    networkNames,
    ['nexus_network'],
    `Expected ${serviceName} to attach only to nexus_network.`,
  );
}

function assertNoVolumes(service, serviceName) {
  const volumes = service.volumes ?? [];
  assert.deepEqual(volumes, [], `Expected ${serviceName} to avoid mounting volumes.`);
}

function assertNamedVolumeMount(service, serviceName, expectedVolumeName) {
  const volumes = service.volumes ?? [];
  assert.equal(volumes.length, 1, `Expected ${serviceName} to mount exactly one named volume.`);

  const [mount] = volumes;
  assert.equal(
    mount.type,
    'volume',
    `Expected ${serviceName} to persist data via a named volume mount.`,
  );
  assert.equal(
    mount.source,
    expectedVolumeName,
    `Expected ${serviceName} to use the ${expectedVolumeName} runtime volume name.`,
  );
}

function assertFiniteHealthcheck(service, serviceName, { allowStartPeriod = false } = {}) {
  assert.ok(service.healthcheck, `Expected ${serviceName} to define a healthcheck.`);

  for (const fieldName of expectedHealthcheckFields) {
    assert.ok(
      service.healthcheck[fieldName] !== undefined,
      `Expected ${serviceName} healthcheck to define ${fieldName}.`,
    );
  }

  assert.match(
    String(service.healthcheck.interval),
    /^\d+(ms|s|m|h)$/,
    `Expected ${serviceName} healthcheck interval to be finite.`,
  );
  assert.match(
    String(service.healthcheck.timeout),
    /^\d+(ms|s|m|h)$/,
    `Expected ${serviceName} healthcheck timeout to be finite.`,
  );
  assert.ok(
    Number.isInteger(service.healthcheck.retries) && service.healthcheck.retries > 0,
    `Expected ${serviceName} healthcheck retries to be a positive integer.`,
  );

  if (allowStartPeriod || service.healthcheck.start_period !== undefined) {
    assert.ok(
      service.healthcheck.start_period !== undefined,
      `Expected ${serviceName} healthcheck start_period to be defined when used.`,
    );
    assert.match(
      String(service.healthcheck.start_period),
      /^\d+(ms|s|m|h)$/,
      `Expected ${serviceName} healthcheck start_period to be finite.`,
    );
  }
}

test('Compose defines exactly the required five services on the explicit nexus_network bridge', () => {
  const model = loadComposeModel();
  const serviceNames = Object.keys(model.services ?? {}).sort();

  assert.deepEqual(serviceNames, expectedServiceNames);
  assert.deepEqual(Object.keys(model.networks ?? {}), ['nexus_network']);
  assert.equal(model.networks.nexus_network.driver, 'bridge');

  for (const serviceName of expectedServiceNames) {
    assertUsesOnlyNexusNetwork(serviceByName(model, serviceName), serviceName);
  }
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
  assertNamedVolumeMount(postgres, 'postgres', 'nexus_postgres_data');
  assertNamedVolumeMount(minio, 'minio', 'nexus_minio_data');
  assertNoVolumes(app, 'app');
  assertNoVolumes(adminer, 'adminer');
  assertNoVolumes(redis, 'redis');

  assertFiniteHealthcheck(app, 'app', { allowStartPeriod: true });
  assertFiniteHealthcheck(postgres, 'postgres', { allowStartPeriod: true });
  assertFiniteHealthcheck(redis, 'redis');
  assertFiniteHealthcheck(minio, 'minio', { allowStartPeriod: true });
  assertFiniteHealthcheck(adminer, 'adminer');

  assert.equal(app.depends_on?.postgres?.condition, 'service_healthy');
  assert.equal(app.depends_on?.redis?.condition, 'service_healthy');
  assert.equal(app.depends_on?.minio?.condition, 'service_healthy');
  assert.deepEqual(Object.keys(app.depends_on ?? {}).sort(), ['minio', 'postgres', 'redis']);
  assert.equal(adminer.depends_on?.postgres?.condition, 'service_healthy');
  assert.equal(Object.keys(adminer.depends_on ?? {}).length, 1);
  assert.equal(postgres.depends_on, undefined);
  assert.equal(redis.depends_on, undefined);
  assert.equal(minio.depends_on, undefined);
});
