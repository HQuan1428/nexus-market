# Research: Local Docker Stack

## Application image and pnpm

**Decision**: Build from `node:22-bookworm-slim` with dependency, builder, and
runner stages. Enable Corepack, honor `packageManager: pnpm@11.18.0`, install with
`--frozen-lockfile`, execute `pnpm build`, and keep the approved `pnpm start`
runtime contract.

**Rationale**: The official Node image publishes the selected tag; Corepack uses
the package manifest to select pnpm; the official Next.js Docker example uses a
multi-stage non-root runtime. Debian slim avoids Alpine/musl compatibility risk
for unknown future native dependencies.

**Alternatives considered**:

- Next.js standalone output plus `node server.js` produces a smaller image but
  changes `next.config.ts` and the explicitly approved start command.
- Node Alpine is smaller but carries unnecessary native dependency risk.

**Sources**:

- [Official Node image tags](https://hub.docker.com/_/node/tags?name=22-bookworm)
- [Node Corepack documentation](https://nodejs.org/download/release/latest-v20.x/docs/api/corepack.html)
- [Official Next.js Docker example](https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile)
- [Next.js standalone output](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output)

## PostgreSQL and pgvector

**Decision**: Use `pgvector/pgvector:pg16`, persist its standard data directory,
and probe it with `pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}`.

**Rationale**: The pgvector project publishes and documents the `pg16` tag. The
PostgreSQL utility checks whether the server accepts connections, and Docker's
startup-order guidance uses it with `service_healthy`.

**Alternatives considered**:

- A fully versioned pgvector tag improves reproducibility but the user requested
  the moving PG16 tag for this local environment.
- Plain PostgreSQL would omit an explicitly approved project dependency.

**Sources**:

- [pgvector Docker images](https://github.com/pgvector/pgvector)
- [PostgreSQL `pg_isready`](https://www.postgresql.org/docs/16/app-pg-isready.html)
- [Docker Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/)

## Redis

**Decision**: Use `redis:alpine`, keep it ephemeral, and probe with
`redis-cli ping`.

**Rationale**: Docker's Compose quickstart documents this image and check; a
successful `PONG` verifies readiness. Omitting a volume follows Nexus Market's
rule that Redis cannot be the durable source of marketplace truth.

**Alternatives considered**:

- A pinned Redis major version reduces drift but is outside the requested image
  contract.
- Append-only persistence conflicts with the deliberately ephemeral role.

**Source**: [Docker Compose quickstart](https://docs.docker.com/compose/gettingstarted/)

## MinIO

**Decision**: Use `minio/minio`, run
`server /data --console-address ":9001"`, persist `/data`, publish 9000/9001,
and probe with `mc ready local`.

**Rationale**: MinIO's container guide documents the data path and console
command. Its maintained Compose example uses `mc ready local`, avoiding curl,
which is absent from recent minimal server images.

**Alternatives considered**:

- A pinned release tag reduces drift but was not requested.
- Curl against the live endpoint is rejected because the selected image does not
  guarantee curl.

**Sources**:

- [MinIO container guide](https://min.io/docs/minio/container/index.html)
- [MinIO Compose example](https://github.com/minio/minio/blob/master/docs/orchestration/docker-compose/docker-compose.yaml)

## Compose configuration semantics

**Decision**: Use `${VAR:?message}` for required credentials, long-form
`depends_on` with `service_healthy`, an explicit top-level network with runtime
name `nexus_network`, and top-level named volumes for PostgreSQL and MinIO.

**Rationale**: These are first-class Compose Specification behaviors. Required
interpolation fails before container creation, health conditions enforce startup
readiness, and explicit networks/volumes make topology and persistence auditable.

**Alternatives considered**:

- An implicit default network would not meet the named-network requirement.
- Short-form `depends_on` only orders startup and does not wait for health.
- Committed fallback credentials violate project security rules.

**Sources**:

- [Compose variable interpolation](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)
- [Compose services reference](https://docs.docker.com/reference/compose-file/services/)
- [Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/)
