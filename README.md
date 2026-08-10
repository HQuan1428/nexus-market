# Nexus Market

Nexus Market is a Next.js 16 TypeScript application. The local development
stack uses Docker Compose for the app, PostgreSQL with pgvector, Redis, MinIO,
and Adminer.

## Local Application

Run the Next.js development server with pnpm:

```bash
pnpm dev
```

Open `http://127.0.0.1:3000` in your browser. The starter page lives at
`src/app/page.tsx`.

## Local Docker Stack

Create a local environment file from the committed placeholders:

```bash
cp .env.example .env
```

Replace every `replace_me_local_only_*` value in `.env`, then validate and
start the complete stack:

```bash
pnpm test:infra
docker compose --env-file .env config --quiet
docker compose --env-file .env up -d --wait --wait-timeout 120
```

Local endpoints:

- Application: `http://127.0.0.1:3000`
- PostgreSQL: `127.0.0.1:5432`
- Redis: `127.0.0.1:6379`
- Adminer: `http://127.0.0.1:8080`
- MinIO API: `http://127.0.0.1:9000`
- MinIO Console: `http://127.0.0.1:9001`

Stop the stack without deleting PostgreSQL or MinIO data:

```bash
docker compose --env-file .env down
```
