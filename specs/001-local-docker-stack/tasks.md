# Tasks: Local Docker Stack

**Input**: Design documents from `specs/001-local-docker-stack/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`
**Execution rule**: Tasks are test-first and sized for focused 2–5 minute implementation cycles. `tasks.md` is the only implementation command source.

## Global Constraints

- Define exactly five Compose services named `app`, `postgres`, `redis`,
  `minio`, and `adminer`; do not add helper containers.
- Use `node:22-bookworm-slim`, Corepack/pnpm 11.18.0,
  `pnpm install --frozen-lockfile`, `pnpm build`, and `pnpm start`.
- Use images exactly `pgvector/pgvector:pg16`, `redis:alpine`,
  `minio/minio`, and `adminer`.
- Require `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`,
  `MINIO_ROOT_USER`, and `MINIO_ROOT_PASSWORD` with `${VAR:?message}` and no
  secret defaults.
- Attach all services to an explicitly named bridge network `nexus_network`.
- Persist only PostgreSQL and MinIO through named volumes with runtime names
  `nexus_postgres_data` and `nexus_minio_data`; Redis remains volume-free.
- Every service has a finite healthcheck. Application startup waits for healthy
  PostgreSQL, Redis, and MinIO; Adminer waits only for healthy PostgreSQL.
- Follow RED → GREEN → REFACTOR and record the command/output evidence for each
  task. Do not add schema, pgvector initialization, bucket provisioning, or
  unrelated application changes.

## Phase 1: Test Harness and RED Evidence

**Purpose**: Encode the approved configuration contract before production files exist.

### Task 1 — T001 Contract test harness

- [x] T001 Add `test:infra` to `package.json`; create focused Node built-in tests in `tests/infrastructure/dockerfile.test.mjs`, `tests/infrastructure/docker-compose.test.mjs`, and `tests/infrastructure/environment.test.mjs` covering every Global Constraint; run each file separately and record expected RED failures caused only by missing `Dockerfile`, `docker-compose.yml`, and `.env.example`

**Checkpoint**: Three contract test files exist and each is proven capable of failing for its missing production artifact.

---

## Phase 2: User Story 1 — Start the local marketplace stack (Priority: P1) 🎯 MVP

**Goal**: Build the production application image and define the complete healthy five-service topology.

**Independent Test**: With non-secret test environment values, the Dockerfile and normalized Compose JSON satisfy all build, service, network, health, dependency, port, and persistence assertions.

### Task 2 — T002 Application image contract

- [x] T002 [US1] Make `tests/infrastructure/dockerfile.test.mjs` GREEN by implementing the approved multi-stage non-root pnpm build in `Dockerfile` and build-context exclusions in `.dockerignore`; rerun the focused test and keep unrelated Compose tests RED

### Task 3 — T003 Compose topology contract

- [x] T003 [US1] Make `tests/infrastructure/docker-compose.test.mjs` GREEN by implementing the exact five-service topology, ports, bounded healthchecks, readiness dependencies, shared network, and PostgreSQL/MinIO named volumes in `docker-compose.yml`; rerun the focused test and keep the environment-documentation test RED only for its missing artifact

**Checkpoint**: Application image and Compose topology contracts pass independently.

---

## Phase 3: User Story 2 — Fail safely on invalid local configuration (Priority: P2)

**Goal**: Document required values, allow the example file to be committed, and prove every missing credential fails closed.

**Independent Test**: For each required variable, Compose validation with an empty env file and that variable removed exits non-zero and names it; committed files contain placeholders rather than usable credentials.

### Task 4 — T004 Fail-closed environment contract

- [x] T004 [US2] Make `tests/infrastructure/environment.test.mjs` GREEN by adding non-secret placeholders to `.env.example`, adding `!.env.example` after the existing `.env*` rule in `.gitignore`, and ensuring every required substitution in `docker-compose.yml` fails with a variable-specific message; run the focused test and then `pnpm test:infra`

**Checkpoint**: Both user stories pass the complete infrastructure contract suite.

---

## Phase 4: Verification and Documentation

**Purpose**: Prove the configuration works through the actual tools and preserve current evidence.

### Task 5 — T005 End-to-end verification

- [x] T005 Run `pnpm test:infra`, `docker compose --env-file .env.example config --quiet`, `docker compose --env-file .env.example build app`, `pnpm lint`, and `pnpm build`; if local ports are available, run `docker compose --env-file .env.example up -d --wait`, create PostgreSQL and MinIO sentinel data, force-recreate those two containers without deleting named volumes, verify both sentinels remain, clean only the sentinels, then run `docker compose down`; compare results with `specs/001-local-docker-stack/quickstart.md` and update only incorrect validation instructions

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: No dependency beyond the approved artifacts.
- **Phase 2**: Depends on T001 RED evidence; T002 precedes T003 to keep failures focused.
- **Phase 3**: Depends on T003 because required substitutions live in the final topology.
- **Phase 4**: Depends on all contract tests being GREEN.

### User Story Dependencies

- **User Story 1 (P1)**: Starts after T001 and is independently verifiable with test environment values.
- **User Story 2 (P2)**: Depends on the Compose file from User Story 1 but has an independent fail-closed configuration test.

### Parallel Opportunities

No implementation tasks should run in parallel because T002–T004 modify a
single configuration contract in dependency order. Review work may run only
after its corresponding implementation commit is complete.

## Implementation Strategy

1. T001 proves the tests fail for the intended missing artifacts.
2. T002 makes only the image-build contract green.
3. T003 makes only the service-topology contract green.
4. T004 closes the secret-handling contract and runs the full suite.
5. T005 performs fresh tool-level and runtime verification.

## Traceability

| Requirement | Tasks |
|---|---|
| FR-001–FR-007, FR-012–FR-014 | T001, T003, T005 |
| FR-008, FR-009, FR-011 | T001, T004, T005 |
| FR-010 | T001, T002, T005 |
| SC-001–SC-003, SC-005 | T001, T003, T004, T005 |
| SC-004, SC-006 | T002, T003, T005 |

## Phase 5: Convergence

### Task 6 — T006 Dockerfile runtime contract coverage

- [x] T006 Add focused Dockerfile contract coverage for the final `USER node` runtime and required `.dockerignore` exclusions per T001, T002, and FR-010 (partial)

### Task 7 — T007 Final-runner ownership

- [x] T007 Apply `node` ownership to final-runner copied runtime inputs and protect it with a regression assertion per plan: application image ownership decision (partial)

### Task 8 — T008 Bounded healthcheck timing

- [x] T008 Make every Compose healthcheck use an interval of at most 10 seconds and a finite `start_period`, then enforce both constraints in `tests/infrastructure/docker-compose.test.mjs` per plan: healthcheck decision (partial)

### Task 9 — T009 Compose runtime contract coverage

- [x] T009 Extend `tests/infrastructure/docker-compose.test.mjs` to enforce exact published ports, `unless-stopped` restart policies, and explicit runtime network/volume names per T001, T003, FR-001–FR-007, FR-013, and FR-014 (partial)

### Task 10 — T010 Environment contract coverage

- [ ] T010 Table-drive missing-variable validation one variable at a time and enforce non-secret placeholders plus `.env`/`.env.example` ignore behavior in `tests/infrastructure/environment.test.mjs` per T004, FR-009, FR-011, SC-003, and SC-005 (partial)
