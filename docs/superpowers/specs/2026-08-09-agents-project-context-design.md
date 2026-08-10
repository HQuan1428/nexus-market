# Nexus Market AGENTS.md Design

## Objective

Create a root `AGENTS.md` that gives AI coding agents enough product, architecture,
quality, and workflow context to work safely in Nexus Market. The document must be
written in English and contain approximately 150–200 lines.

## Current Repository State

The repository currently contains `workflow.md` and no application source code.
The guide must therefore describe intended boundaries and standards without
claiming that routes, schemas, modules, package scripts, or infrastructure already
exist.

## Chosen Structure

Use an operational-handbook structure:

1. Project mission and product scope.
2. Delivery priorities and conceptual business domains.
3. Modular-monolith architecture and dependency boundaries.
4. Responsibilities of PostgreSQL, pgvector, Prisma, Redis, MinIO, and Adminer.
5. Next.js and TypeScript engineering conventions.
6. Security, privacy, AI safety, observability, and reliability rules.
7. Testing and evidence-based completion standards.
8. Mandatory routing through the process defined by `workflow.md`.
9. Practical operating rules for AI agents.

## Product and Delivery Decisions

Nexus Market is an AI-assisted marketplace for buyers and sellers, initially
focused on furniture, home-related products, and clothing. Delivery is MVP-first:
establish marketplace and buyer/seller journeys before incrementally adding
realtime chat and AI assistance. Expected AI capabilities include recommendations,
advertising-image generation, purchase visualization or simulation, customer
support, and negotiation assistance. The document will not select or discuss a
specific AI provider.

## Architecture Decisions

The target architecture is a TypeScript modular monolith built with Next.js 15,
deploying frontend and backend together. Future code should be grouped by business
capability with explicit module interfaces. Conceptual domains may be named, but
the document must not invent a directory tree.

PostgreSQL is the durable source of truth. pgvector supports semantic retrieval,
Prisma owns relational data access and migrations, Redis handles ephemeral and
realtime concerns, and MinIO provides S3-compatible object storage. Object metadata
and ownership remain in PostgreSQL. Adminer is a development and operations aid,
not an application dependency.

## Quality and Safety Decisions

The guide uses concise normative terms such as `MUST`, `SHOULD`, and `MUST NOT`.
It requires strict typing, boundary validation, server-side authorization,
structured errors and logs, safe file handling, idempotency, transactions,
accessibility, privacy, rate limiting, and environment-based configuration.

AI output is advisory and untrusted. Consequential actions require validation and
human confirmation. The guide also calls for protection against prompt injection,
data leakage, unsafe generated media, and unbounded model usage without defining a
provider implementation.

Testing is risk-based across unit, integration, and end-to-end levels. Completion
requires current evidence from repository-defined checks; agents must not invent
commands when package scripts do not yet exist.

## Workflow Decisions

Every agent must read and follow `workflow.md` before changing the repository.
That file is authoritative for task levels, Spec Kit artifacts, Superpowers
execution discipline, TDD, review gates, worktrees, and convergence. `AGENTS.md`
will summarize the operational obligations and link to the workflow rather than
duplicating it.

This documentation-only task is Level 0 under the current workflow. The requested
brainstorm design is the only preliminary artifact. No application code,
configuration, schema, or scaffold may be created.

## Acceptance Criteria

- Root `AGENTS.md` exists and is written in English.
- It contains between 150 and 200 physical lines.
- It accurately reflects the supplied product and technology context.
- It prescribes a modular monolith and MVP-first delivery.
- It does not name or select an AI provider.
- It makes `workflow.md` mandatory and authoritative.
- It distinguishes durable, ephemeral, vector, and object-storage responsibilities.
- It covers architecture, security, AI safety, testing, and agent conduct.
- It does not claim that unimplemented files, commands, or modules exist.
- No implementation artifact other than `AGENTS.md` is created.
