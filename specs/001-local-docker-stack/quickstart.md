# Quickstart: Validate the Local Docker Stack

## Prerequisites

- Docker Engine with Compose v2
- Node.js and pnpm versions compatible with `package.json`
- Host ports 3000, 5432, 6379, 8080, 9000, and 9001 available

## Configure

1. Copy `.env.example` to `.env`.
2. Replace every placeholder with a local-only value.
3. Keep `.env` untracked; never commit usable credentials.

Required variables:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `MINIO_ROOT_USER`
- `MINIO_ROOT_PASSWORD`

## Static verification

```bash
pnpm test:infra
docker compose config --quiet
pnpm lint
pnpm build
```

Expected result: all commands exit 0. Running `docker compose config --quiet`
without any required variable must fail and identify the missing variable.

## Image verification

```bash
docker compose build app
```

Expected result: dependencies install from `pnpm-lock.yaml`, the Next.js
production build succeeds, and the final image is configured to run as a
non-root user.

## Runtime verification

```bash
docker compose up -d
docker compose ps
```

Expected result: five services are present. PostgreSQL, Redis, MinIO, Adminer,
and the application transition to healthy after their bounded startup periods.

Local endpoints:

- Application: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Adminer: `http://localhost:8080`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`

## Stop without deleting durable data

```bash
docker compose down
```

Named PostgreSQL and MinIO volumes remain. Volume deletion is intentionally not
part of this quickstart because it destroys local durable data.
