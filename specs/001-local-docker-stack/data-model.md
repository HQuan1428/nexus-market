# Operational Resource Model: Local Docker Stack

This feature introduces no marketplace business entity or database schema. The
following operational resources define the configuration model used for testing
and review.

## Service Definition

- **Name**: one of `app`, `postgres`, `redis`, `minio`, `adminer`
- **Image source**: local build for `app`; approved external image for all others
- **Ports**: fixed host-to-container mappings documented by the stack
- **Environment**: non-secret constants plus required local secret references
- **Healthcheck**: command, interval, timeout, retries, and optional start period
- **Dependencies**: readiness-gated edges only where startup requires another
  service
- **Network membership**: exactly `nexus_network`
- **Restart policy**: local recovery behavior without application-level retry
  semantics

Validation rules:

- Names are unique and the set contains exactly five entries.
- Every service has one bounded healthcheck and network membership.
- Only the application and Adminer have readiness dependencies.
- Adminer is never a dependency of the application.

## Named Network

- **Logical key**: `nexus_network`
- **Runtime name**: `nexus_network`
- **Driver**: bridge
- **Members**: all five service definitions

## Persistent Volume

- **Database volume**: logical `postgres_data`, runtime
  `nexus_postgres_data`, mounted at PostgreSQL's data directory
- **Object volume**: logical `minio_data`, runtime `nexus_minio_data`, mounted
  at `/data`

Validation rules:

- The two durable stores use distinct named volumes.
- Redis has no volume.
- No host bind mount stores durable database or object data.

## Required Local Setting

- **Name**: database name/user/password or object-store root user/password
- **Source**: developer-local `.env`
- **Committed representation**: non-secret placeholder in `.env.example`
- **Missing-state behavior**: Compose validation fails before container creation

## Lifecycle States

```text
unconfigured → configured → created → starting → healthy
                   │                     └──────→ unhealthy (bounded retries)
                   └──── missing value ─────────→ validation failed
```

The application remains uncreated/blocked until its three infrastructure
dependencies are healthy. Durable volume lifecycle is independent of container
lifecycle unless a developer explicitly removes volumes.
