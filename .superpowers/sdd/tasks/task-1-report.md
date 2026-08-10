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
