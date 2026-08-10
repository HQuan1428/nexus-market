# AGENTS.md — Nexus Market

## 1. Purpose

This file gives AI coding agents the minimum shared context for Nexus Market.
Read it before analyzing, planning, editing, reviewing, or running repository code.
Read `workflow.md` in full before making any repository change.
`workflow.md` is authoritative for the development lifecycle and approval gates.
If this guide conflicts with `workflow.md`, follow `workflow.md`.
Do not infer that a described capability is already implemented.
Inspect the repository and current artifacts before making claims or decisions.

## 2. Product Mission

Nexus Market is an intelligent marketplace for buyers and sellers.
The initial commerce focus is furniture, home-related products, and clothing.
AI assistance should reduce effort while keeping users in control of decisions.
Expected AI-assisted capabilities include:

- Personalized product discovery and recommendations.
- Advertising-image generation for seller listings and campaigns.
- Furniture placement or appearance simulation for purchase evaluation.
- Clothing appearance or fit-oriented visualization where feasible.
- Customer-support assistance for common questions and issue triage.
- Price-negotiation assistance for buyers and sellers.

Users MUST confirm consequential actions such as publishing or accepting a price.

## 3. Delivery Priorities

Build the product incrementally and prioritize an operable MVP.
Prefer this broad delivery order unless an approved specification says otherwise:

1. User access, buyer/seller identity, profiles, and authorization boundaries.
2. Catalog, listings, product media, search, and discovery.
3. Buyer journeys, seller management, orders, and marketplace trust controls.
4. Realtime conversations, customer support, and negotiation workflows.
5. AI-assisted discovery, content creation, visualization, and automation.

Do not build speculative flexibility for unapproved future requirements.

## 4. Target Architecture

Use Next.js 16 with TypeScript for both frontend and backend concerns.
Deploy the application as a modular monolith unless an approved plan changes it.
Docker is the standard deployment and local infrastructure environment.
Organize future code around business capabilities, not only technical layers.
Each module MUST have a clear purpose, public interface, and dependency boundary.
Modules MUST NOT reach into another module's private implementation.
Keep business rules independent from UI components and transport details.
Avoid introducing separate services until measured requirements justify them.

Conceptual domains include:

- Catalog, categories, attributes, listings, pricing, and inventory.
- Search, semantic discovery, recommendations, and merchandising.
- Carts, orders, fulfillment state, and post-purchase interactions.
- Conversations, realtime presence, support, and negotiation.
- Media uploads, generated assets, ownership, and lifecycle management.
- Platform concerns such as configuration, observability, jobs, and rate limits.

These are boundaries, not proof that corresponding files already exist.

## 5. Next.js and TypeScript Conventions

Use Server Components by default for data-backed rendering.
Use Client Components only when browser state or interactivity requires them.
Keep privileged data access and secrets in server-only code.
Use Route Handlers for explicit HTTP interfaces and external integrations.
Do not expose internal domain models directly as public API contracts.
Validate request, form, event, environment, and external-service data at runtime.
Enable and preserve strict TypeScript settings.
Avoid `any`; if unavoidable, isolate it and explain the boundary.

## 6. Data and Infrastructure Responsibilities

PostgreSQL is the durable source of truth for business records.
Use Prisma ORM for relational reads, writes, schema evolution, and migrations.
Use database transactions when multiple writes must succeed or fail together.
Enforce important invariants in both application logic and database constraints.

Use pgvector for embeddings and semantic retrieval workloads.
Do not treat vector similarity as authorization or as verified product truth.

Use Redis only for ephemeral or coordination-oriented data, including:

- Caching with explicit invalidation and bounded TTLs.
- Realtime presence, pub/sub, and transient conversation coordination.
- Rate limiting, distributed locks, job coordination, and idempotency support.

Redis MUST NOT be the only store for orders, listings, messages, or payments.

Use MinIO through S3-compatible object-storage semantics.
Keep object ownership, purpose, status, and access metadata in PostgreSQL.
Validate upload size, media type, extension, and content before publication.
Use signed or authorized access for private objects.
Adminer is a development and operations aid, never an application dependency.

## 7. Realtime and Messaging

Treat realtime delivery as an enhancement over durable application state.
Assume events can be duplicated, delayed, reordered, or temporarily unavailable.
Give retryable handlers idempotency keys or equivalent duplicate protection.
Authorize every subscription, channel, conversation, and message operation.

## 8. AI-Assisted Features

Keep AI orchestration behind explicit application interfaces.
Treat prompts, retrieved context, tool results, and generated content as untrusted.
Defend against prompt injection, data exfiltration, and cross-user context leakage.
Never include secrets, credentials, or unrelated private records in model context.
Validate structured output before using it in application logic.
Require human confirmation before an AI action changes marketplace state.
Add cost, latency, timeout, retry, cancellation, and rate-limit controls.
Provide safe fallback behavior when AI assistance is unavailable or uncertain.

## 9. Security and Privacy

Apply least privilege to users, services, database access, and object storage.
Enforce authentication and authorization on the server at every protected boundary.
Never rely on hidden UI controls as an authorization mechanism.
Validate all external input and encode output for its destination context.
Do not log secrets, credentials, raw tokens, or unnecessary personal data.
Use environment variables for secrets and validate configuration at startup.
Rate-limit abuse-sensitive operations such as auth, chat, upload, and generation.
Consider marketplace fraud, impersonation, unsafe media, and negotiation abuse.

## 10. Reliability and Error Handling

Model expected failures explicitly and return actionable, user-safe errors.
Do not leak stack traces, database details, internal paths, or sensitive context.
Set timeouts for network and infrastructure calls.
Use bounded retries with backoff only for genuinely transient failures.
Make retryable writes idempotent.
Prefer graceful degradation for recommendations, realtime updates, and AI tools.

## 11. User Experience Standards

Design responsive interfaces for mobile and desktop usage.
Meet modern accessibility expectations for keyboard, focus, semantics, and contrast.
Do not use optimistic UI where rollback would confuse or financially affect users.
Use clear language for price, availability, generated content, and negotiation state.

## 12. Testing and Verification

Use risk-based coverage across unit, integration, and end-to-end tests.
Integration-test Prisma behavior, database constraints, Redis flows, and storage.
End-to-end test critical buyer, seller, authorization, and recovery journeys.
Test unhappy paths, retries, duplicate events, concurrency, and permission denial.
Every behavior change MUST begin with a failing test under the mandated workflow.
Bug fixes MUST include a regression test that fails before the fix.
Run the repository-defined lint, type, test, and build checks before completion.
If scripts do not exist yet, report that fact instead of inventing commands.
Never claim success without current command output or equivalent direct evidence.

## 13. Mandatory Development Workflow

Follow `workflow.md` for every task without exception.
Classify work as Level 0, 1, 2, or 3 before changing files.
When uncertain between levels, ask the user; do not silently choose the lighter path.
If scope expands during work, stop, reclassify, and create the required artifacts.
Use Spec Kit for specification, clarification, plans, tasks, and consistency gates.
Use Superpowers for disciplined implementation, TDD, debugging, and review.
Do not implement Level 2 or Level 3 work without approved required artifacts.
Treat approved specifications and tasks as the source of truth for implementation.
Follow RED → GREEN → REFACTOR and preserve evidence for each completed task.
Use one feature branch and one worktree per feature.
Never merge exploratory spike code into the main branch.
When implementation reveals a specification defect, stop and repair the artifacts.

## 14. Agent Operating Rules

Inspect relevant files, documentation, and recent history before proposing changes.
Ask when a product choice would materially alter scope, behavior, or user safety.
Do not invent unresolved product decisions.
Keep changes narrowly aligned with the approved task.
Preserve unrelated user work and existing repository conventions.
Do not perform destructive operations without explicit authorization.
Avoid unrelated refactors and speculative abstractions.
Update documentation when behavior, configuration, schema, or operations change.
Before handoff, inspect the diff and verify every explicit acceptance criterion.
Report changed files, verification evidence, known limitations, and remaining risks.

## 15. Definition of Done

Work is done only when it matches approved intent and required artifacts.
Relevant tests pass and the application-level checks are current.
Security, privacy, accessibility, data, and operational impacts were considered.
No unresolved critical review issue remains.
Documentation and configuration examples reflect the final behavior.
The final report contains evidence, not merely a statement that work is complete.
