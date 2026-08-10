# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Start here

This repository's real guidance lives in two files, not here. Read them before doing anything else:

- **`AGENTS.md`** — product mission, target architecture, tech-stack conventions (Next.js 15/TypeScript, Prisma/PostgreSQL, pgvector, Redis, MinIO), security/reliability/testing standards, and agent operating rules. This is the substantive reference.
- **`workflow.md`** (Vietnamese) — the mandatory development lifecycle: Spec Kit (specification layer) × Superpowers (execution discipline). Authoritative for how work is scoped, approved, and merged. If `AGENTS.md` and `workflow.md` conflict, `workflow.md` wins.

Do not treat this CLAUDE.md as a substitute for either file — it only orients you to them and notes what's specific to running as Claude Code in this repo.

## Repository state

There is no application code yet — no `package.json`, no `src/`, no build tooling. The repository currently consists of the governance/workflow scaffolding itself (`AGENTS.md`, `workflow.md`, `.specify/` Spec Kit templates, `.claude/skills/` and `.agents/skills/` Spec Kit skill definitions). `.specify/memory/constitution.md` is still the unfilled template — `/speckit.constitution` has not been run yet.

Because of this: there are no lint/typecheck/test/build commands to run. Do not invent any. Once code exists, commands should be added here — until then, follow `AGENTS.md` §12 ("If scripts do not exist yet, report that fact instead of inventing commands").

## Mandatory workflow (non-negotiable)

Every task, including the first line of app code, must go through triage before any file changes:

1. **Classify the work as Level 0–3** (`workflow.md` §2): 0 = trivial/no behavior change, 1 = bug fix with existing spec, 2 = small single-module feature, 3 = large/ambiguous/production-critical feature. When unsure between two levels, ask the user — don't guess.
2. **Spec Kit owns the specification layer** for Level 2–3 work: `/speckit.specify → /speckit.clarify → /speckit.plan → /speckit.checklist → /speckit.tasks → /speckit.analyze`, then a human approval gate, before any implementation. Never write code for Level 2/3 work without an approved `spec.md` + `plan.md` + `tasks.md`.
3. **Superpowers owns the execution layer** at every level: strict TDD (RED → GREEN → REFACTOR, test written and failing before implementation), one git worktree per feature branch (`NNN-feature-name`), and two-layer review (spec compliance, then code quality) before a task is done.
4. Never use Superpowers' `writing-plans` or `brainstorming` skills as a replacement for `/speckit.plan` or `/speckit.clarify` — they serve different roles in this workflow (see `workflow.md` §0 "Ba điều cấm tuyệt đối").
5. "Done" requires evidence (test output, review pass) — never accept or report completion based on assertion alone.

See `workflow.md` §6 for the full quick-start checklist.

## Architecture direction

`AGENTS.md` §4 defines the target architecture once code exists: a Next.js 15/TypeScript modular monolith organized around business capabilities (catalog, search/discovery, orders, conversations/negotiation, media, platform concerns), not technical layers or separate services. Treat these as boundaries to design toward, not evidence that corresponding code already exists.
