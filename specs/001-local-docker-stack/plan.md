# Implementation Plan: Local Docker Stack

**Branch**: `001-local-stack` | **Date**: 2026-08-10 | **Spec**: [spec.md](./spec.md)

**Input**: Approved feature specification from `specs/001-local-docker-stack/spec.md`

## Summary

Add a production-like local container stack for the existing Next.js 16
application. A multi-stage pnpm Dockerfile will build and run the app, while one
Compose file will orchestrate PostgreSQL with pgvector, ephemeral Redis, durable
MinIO, and Adminer. Required credentials fail closed through Compose variable
interpolation, every service has a bounded healthcheck, and configuration
contract tests enforce the topology before implementation.

## Technical Context

**Language/Version**: Dockerfile 1.7 syntax, Compose Specification, Node.js 22,
TypeScript 5.9
**Primary Dependencies**: Next.js 16.3.0, pnpm 11.18.0,
`pgvector/pgvector:pg16`, `redis:alpine`, `minio/minio`, `adminer`
**Storage**: Named Docker volumes for PostgreSQL and MinIO; Redis remains
ephemeral
**Testing**: Node.js built-in test runner for configuration contracts; Docker
Compose v2 config/build/runtime checks; repository ESLint and Next.js build
**Target Platform**: Recent Docker Engine with Compose v2 on a Linux container
runtime
**Project Type**: Next.js modular-monolith web application with local
infrastructure
**Performance Goals**: Compose structural validation completes in under 30
seconds; healthchecks use intervals of at most 10 seconds and bounded retries
**Constraints**: Exactly five services; required secrets have no fallback;
application runs as non-root; ports 3000, 5432, 6379, 8080, 9000, and 9001;
single network named `nexus_network`
**Scale/Scope**: One local application instance and one instance of each of four
development infrastructure components

## Constitution Check

*GATE: Evaluated before research and re-evaluated after design.*

The machine-local `.specify/memory/constitution.md` is currently an unratified
template and is not copied into this feature worktree. `AGENTS.md` and
`workflow.md` are therefore the effective, committed governance documents for
this plan.

| Gate | Result | Evidence |
|---|---|---|
| Level selected before implementation | PASS | Classified and user-approved as Level 2; lean `specify → plan → tasks` path applies. |
| Approved artifacts before code | PASS | Design and `spec.md` approved; implementation waits for committed `plan.md` and `tasks.md`. |
| TDD and evidence | PASS | Configuration contract tests are written and observed failing before each production configuration slice. |
| Workspace isolation | PASS | Branch and worktree are both `001-local-stack`. |
| Architecture and storage duties | PASS | PostgreSQL and MinIO are durable; Redis is explicitly ephemeral; Adminer is operational only. |
| Secrets and validation | PASS | All credentials are mandatory environment substitutions; no committed fallback secrets. |
| Simplicity and scope | PASS | No schema, bucket bootstrap, distributed deployment, or application refactor is included. |

**Post-design re-check**: PASS. Research and operational-resource modeling do
not introduce a governance exception. Ratifying the repository constitution
remains separate project-maintenance work and is not silently folded into this
feature.

## Project Structure

### Documentation (this feature)

```text
specs/001-local-docker-stack/
├── checklists/
│   └── requirements.md
├── data-model.md
├── plan.md
├── quickstart.md
├── research.md
├── spec.md
└── tasks.md
```

No `contracts/` directory is required because this feature introduces internal
build and orchestration configuration rather than a public application/API
interface.

### Source Code (repository root)

```text
.
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── pnpm-lock.yaml
├── src/
└── tests/
    └── infrastructure/
        ├── docker-compose.test.mjs
        ├── dockerfile.test.mjs
        └── environment.test.mjs
```

**Structure Decision**: Keep platform configuration at the repository root,
where Docker Compose and the Docker build context are discoverable by default.
Contract tests live under `tests/infrastructure/`; no application domain module
is added for operational configuration.

## Technical Design

### Application image

- Use `node:22-bookworm-slim` in shared base, dependencies, builder, and runner
  stages.
- Enable Corepack and let the checked-in `packageManager` field select pnpm
  11.18.0.
- Install with `pnpm install --frozen-lockfile`, then execute `pnpm build`.
- Copy only production runtime inputs into the final stage with ownership for
  the existing non-root `node` user.
- Start with `pnpm start` on `0.0.0.0:3000`; probe `/` with Node's built-in
  `fetch` from the healthcheck.

### Compose topology

- Define exactly `app`, `postgres`, `redis`, `minio`, and `adminer`.
- Put every service on a bridge network whose explicit runtime name is
  `nexus_network`.
- Use named volumes `nexus_postgres_data` and `nexus_minio_data`; do not create
  a Redis volume.
- Gate application startup on healthy PostgreSQL, Redis, and MinIO; gate Adminer
  on healthy PostgreSQL.
- Use `pg_isready`, `redis-cli ping`, `mc ready local`, and a PHP TCP probe for
  Adminer so every healthcheck relies on a binary guaranteed by its image.
- Apply finite intervals, timeouts, retries, and startup periods; use
  `restart: unless-stopped` for local process recovery.

### Configuration

- Require `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`,
  `MINIO_ROOT_USER`, and `MINIO_ROOT_PASSWORD` with `${VAR:?message}`.
- Pass stable internal URLs to the app: database host `postgres`, Redis host
  `redis`, and S3-compatible endpoint `http://minio:9000`.
- Document variables in `.env.example` with unmistakable placeholders and add
  `!.env.example` after the existing `.env*` ignore rule.
- Exclude `.env*`, dependency/build outputs, Git metadata, and local worktrees
  from the Docker build context.

## Complexity Tracking

No constitution violations or additional architectural layers are introduced.
