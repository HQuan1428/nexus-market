# T001 Report — Contract test harness RED

## Files

- `package.json`
- `tests/infrastructure/dockerfile.test.mjs`
- `tests/infrastructure/docker-compose.test.mjs`
- `tests/infrastructure/environment.test.mjs`

## RED commands and output

### 1) Dockerfile contract

Command:

```bash
rtk node --test tests/infrastructure/dockerfile.test.mjs
```

Observed RED:

```text
✖ tests/infrastructure/dockerfile.test.mjs
ℹ pass 0
ℹ fail 1
```

Failure detail verification:

```bash
rtk node -e "import('./tests/infrastructure/dockerfile.test.mjs')"
```

```text
AssertionError [ERR_ASSERTION]: Expected Dockerfile to exist at the repository root.
```

### 2) Compose contract

Command:

```bash
rtk node --test tests/infrastructure/docker-compose.test.mjs
```

Observed RED:

```text
✖ tests/infrastructure/docker-compose.test.mjs
ℹ pass 0
ℹ fail 1
```

Failure detail verification:

```bash
rtk node -e "import('./tests/infrastructure/docker-compose.test.mjs')"
```

```text
AssertionError [ERR_ASSERTION]: Expected docker-compose.yml to exist at the repository root.
```

### 3) Environment documentation contract

Command:

```bash
rtk node --test tests/infrastructure/environment.test.mjs
```

Observed RED:

```text
✖ tests/infrastructure/environment.test.mjs
ℹ pass 0
ℹ fail 1
```

Failure detail verification:

```bash
rtk node -e "import('./tests/infrastructure/environment.test.mjs')"
```

```text
✖ The example environment file documents every required non-secret variable
AssertionError [ERR_ASSERTION]: Expected .env.example to exist at the repository root.
▶ Compose fails with variable-specific messages when required environment values are absent
  ﹣ Compose validation starts once both .env.example and docker-compose.yml exist. # SKIP
```

## Self-review

- Kept scope to the allowed files only: `package.json` plus the three infrastructure tests.
- Used the Node built-in test runner exclusively; no third-party test tooling added.
- Ensured each test file fails for its intended missing artifact:
  - `dockerfile.test.mjs` → missing `Dockerfile`
  - `docker-compose.test.mjs` → missing `docker-compose.yml`
  - `environment.test.mjs` → missing `.env.example`
- Prepared future GREEN assertions for all binding global constraints, including real `docker compose config --format json` validation once `docker-compose.yml` exists.
- Avoided creating `Dockerfile`, `docker-compose.yml`, or `.env.example` during T001.

## Concerns

- Node's default `--test` reporter is terse at file scope, so I captured a second verification command per file to record the exact missing-artifact assertion message.
- The environment test intentionally skips the Compose substitution assertion until both `.env.example` and `docker-compose.yml` exist; that keeps T001 RED focused on the missing environment file while preserving a GREEN target for T004.

---

## Round 1 fix report

### Files

- `tests/infrastructure/dockerfile.test.mjs`
- `tests/infrastructure/docker-compose.test.mjs`
- `tests/infrastructure/environment.test.mjs`

### Commands and output

#### 1) Dockerfile contract stays RED on the missing artifact

Command:

```bash
rtk node --test tests/infrastructure/dockerfile.test.mjs
```

Observed RED:

```text
✖ tests/infrastructure/dockerfile.test.mjs
ℹ pass 0
ℹ fail 1
```

Failure detail verification:

```bash
rtk node -e "import('./tests/infrastructure/dockerfile.test.mjs')"
```

```text
✖ Dockerfile uses only stages derived from the required Node 22 base image, including the final runner
AssertionError [ERR_ASSERTION]: Expected Dockerfile to exist at the repository root.
```

#### 2) Compose contract stays RED on the missing artifact

Command:

```bash
rtk node --test tests/infrastructure/docker-compose.test.mjs
```

Observed RED:

```text
✖ tests/infrastructure/docker-compose.test.mjs
ℹ pass 0
ℹ fail 1
```

Failure detail verification:

```bash
rtk node -e "import('./tests/infrastructure/docker-compose.test.mjs')"
```

```text
✖ Compose defines exactly the required five services on the explicit nexus_network bridge
AssertionError [ERR_ASSERTION]: Expected docker-compose.yml to exist at the repository root.
```

#### 3) Environment contract stays RED on the missing artifact

Command:

```bash
rtk node --test tests/infrastructure/environment.test.mjs
```

Observed RED:

```text
✖ tests/infrastructure/environment.test.mjs
ℹ pass 0
ℹ fail 1
```

Failure detail verification:

```bash
rtk node -e "import('./tests/infrastructure/environment.test.mjs')"
```

```text
✖ The example environment file documents every required non-secret variable
AssertionError [ERR_ASSERTION]: Expected .env.example to exist at the repository root.
▶ Compose source uses fail-closed required substitutions for every secret-bearing variable
  ﹣ Compose source validation starts once both .env.example and docker-compose.yml exist. # SKIP
▶ Compose fails with variable-specific messages when required environment values are absent
  ﹣ Compose validation starts once both .env.example and docker-compose.yml exist. # SKIP
```

### Self-review

- Tightened Compose coverage to assert all five services attach only to `nexus_network`.
- Added exact persistence checks so only PostgreSQL and MinIO mount named volumes, with runtime names `nexus_postgres_data` and `nexus_minio_data`; app, adminer, and redis must remain volume-free.
- Added dependency-shape assertions so `app` has exactly `postgres`, `redis`, and `minio`; `adminer` depends only on `postgres`; `postgres`, `redis`, and `minio` must not define `depends_on`.
- Added bounded healthcheck assertions for every service, requiring `test`, `interval`, `timeout`, and positive integer `retries`, plus finite `start_period` when present/needed.
- Hardened Dockerfile stage validation so every `FROM` stage and the final runner must derive from `node:22-bookworm-slim`.
- Added source-level environment assertions that `docker-compose.yml` must use `${VAR:?message}` for all five required variables and must not use default-value fallbacks.
- Re-ran all three test files separately and confirmed they still fail only because `Dockerfile`, `docker-compose.yml`, and `.env.example` are still absent.
