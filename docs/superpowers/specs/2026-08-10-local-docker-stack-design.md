# Local Docker Stack Design

**Date:** 2026-08-10  
**Status:** Approved in conversation; awaiting written-spec review  
**Workflow level:** Level 2 — small feature

## Purpose

Provide a production-like local Docker environment for the future Nexus Market
Next.js application. The stack must start the application and its approved local
infrastructure dependencies with persistent durable storage, explicit readiness
checks, and no committed credentials.

## Scope

The implementation will add:

- A multi-stage local `Dockerfile` that installs dependencies with pnpm, runs
  `pnpm build`, and starts the application with `pnpm start`.
- A root `docker-compose.yml` with exactly five services: `app`, `postgres`,
  `redis`, `minio`, and `adminer`.
- A shared bridge network named `nexus_network`.
- Named volumes for PostgreSQL and MinIO only.
- A `.dockerignore`, a safe `.env.example`, and a root `.gitignore` rule that
  prevents `.env` from being committed.

Creating the Next.js source tree, package manifest, lockfile, database schema,
MinIO buckets, or application health endpoint is outside this feature. Until the
application source and pnpm lockfile exist, Compose configuration can be
validated but the application image cannot be built successfully.

## Container Architecture

### Application

The application image will use `node:22-bookworm-slim` instead of Alpine to
reduce compatibility risk with native Node dependencies. The build will have
separate dependency, build, and runtime stages. pnpm will be provided through
Corepack, and dependency installation will require the lockfile to remain
unchanged. The runtime will execute as the non-root `node` user, expose port
3000, and run `pnpm start`.

The Compose `app` service will build from the repository-root Dockerfile, publish
port 3000, join `nexus_network`, and wait for PostgreSQL, Redis, and MinIO to be
healthy. Its healthcheck will use Node's HTTP client so the runtime image does
not need curl.

### PostgreSQL with pgvector

The `postgres` service will use the corrected official image reference
`pgvector/pgvector:pg16`. It will require database name, user, and password from
`.env`, persist data in `postgres_data`, and use `pg_isready` for health checks.
The feature supplies the pgvector binaries but does not create the `vector`
extension in a database; that belongs to a future Prisma migration or approved
database initialization task.

### Redis

The `redis` service will use `redis:alpine` and verify readiness with
`redis-cli ping`. It will not receive a durable volume because Nexus Market uses
Redis only for ephemeral caching and coordination data.

### MinIO

The `minio` service will use `minio/minio`, persist objects in
`minio_data:/data`, publish API port 9000 and console port 9001, and run
`server /data --console-address ":9001"`. Root credentials are mandatory
environment substitutions. The healthcheck will follow MinIO's maintained
Compose example and run `mc ready local`, which is available in the selected
server image and avoids relying on curl (removed from recent MinIO images).

### Adminer

The `adminer` service will publish port 8080, join the shared network, set its
default database server to `postgres`, and wait until PostgreSQL is healthy.
Adminer is a local operations aid and is not an application dependency.

## Configuration and Secret Handling

Compose will use `${VARIABLE:?message}` substitutions for all PostgreSQL and
MinIO credentials so startup fails before container creation when required
values are missing. `.env.example` will document variable names with obvious
non-secret placeholders. `.env` will be ignored by Git.

The application will receive internal service URLs/hostnames through environment
variables where a stable local value can be expressed without embedding a
secret. Secret-bearing connection strings will be assembled from mandatory
environment variables rather than committed literal credentials.

## Failure Handling and Startup Order

- Missing credentials cause `docker compose config` and startup to fail with an
  actionable variable-specific message.
- Unhealthy infrastructure prevents the application from starting through
  `depends_on` conditions.
- Healthchecks use bounded intervals, timeouts, retries, and startup periods.
- Container restart policies cover unexpected process exits without using
  unbounded application-level retries.
- Persistent PostgreSQL and MinIO data survives container recreation through
  named volumes.

## Verification Strategy

Because this feature consists of configuration files, automated checks will
assert the Compose contract before implementation where the local tooling makes
that practical. Verification will include:

1. A RED check proving the root Compose file is absent or does not satisfy the
   required contract before implementation.
2. Static validation of YAML structure, exact service names, healthchecks,
   network membership, mandatory environment substitutions, and volume mounts.
3. `docker compose config` with temporary non-secret test values.
4. Dockerfile parse/build validation to the maximum possible extent. A complete
   app image build is expected to remain blocked until `package.json` and
   `pnpm-lock.yaml` are added by a separate feature.
5. Diff inspection to ensure no credential or unrelated user file is included.

## Alternatives Considered

- **Node Alpine:** smaller, but rejected because musl increases compatibility
  risk for unknown future native dependencies.
- **Next.js standalone output:** smaller runtime, but rejected because it would
  require an application configuration file and source tree that do not exist.
- **Committed local default credentials:** convenient, but rejected because it
  conflicts with the project's secret-handling rules.

## Acceptance Summary

The design is successful when a developer with a valid `.env` can validate the
five-service stack, every service has a bounded healthcheck, all services share
`nexus_network`, PostgreSQL and MinIO use durable named volumes, and no secret is
stored in version control. The known missing application source must be reported
as an explicit build limitation rather than hidden by placeholder application
code.
