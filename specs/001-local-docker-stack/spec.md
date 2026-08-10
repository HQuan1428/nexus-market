# Feature Specification: Local Docker Stack

**Feature Branch**: `001-local-stack`

**Created**: 2026-08-10

**Status**: Approved

**Input**: User description: "Create a root Docker Compose environment with the Nexus Market application, PostgreSQL with vector support, Redis, MinIO, and Adminer; include health checks, a shared network, persistent storage where required, and a local production build using pnpm. Credentials must come from `.env`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start the local marketplace stack (Priority: P1)

As a Nexus Market developer, I can configure credentials once and start the
application with all required local infrastructure so that I can develop and
validate marketplace behavior in a repeatable environment.

**Why this priority**: Every later feature depends on a consistent application,
database, cache, object-storage, and database-administration environment.

**Independent Test**: Supply valid local credentials, validate the stack
configuration, start it, and confirm that all five components become healthy or
ready and are reachable on their documented local ports.

**Acceptance Scenarios**:

1. **Given** all required local credentials are present, **When** a developer validates and starts the stack, **Then** the application and four infrastructure components are created on one isolated network.
2. **Given** the stack is running, **When** its readiness is inspected, **Then** every component exposes a bounded health check and dependent components wait for required infrastructure readiness.
3. **Given** the database and object store contain local data, **When** their containers are recreated without deleting volumes, **Then** both retain their data.
4. **Given** Redis is recreated, **When** the stack starts again, **Then** no durable business record depends on Redis data surviving.

---

### User Story 2 - Fail safely on invalid local configuration (Priority: P2)

As a Nexus Market developer, I receive an immediate, actionable error when a
required credential is absent so that the stack never starts with embedded or
ambiguous default secrets.

**Why this priority**: Explicit configuration protects credentials and prevents
developers from diagnosing partially started containers caused by missing
values.

**Independent Test**: Remove each required credential in turn and verify that
configuration validation fails before containers are created, naming the missing
setting.

**Acceptance Scenarios**:

1. **Given** a required database or object-storage credential is missing, **When** a developer validates the stack, **Then** validation fails before container startup and identifies the missing value.
2. **Given** only the committed example configuration exists, **When** repository contents are inspected, **Then** no usable secret or private credential is present.

### Edge Cases

- An infrastructure process starts but never becomes healthy; dependent
  components remain blocked and health checking stops after bounded retries.
- A container is recreated while its named volume remains; durable database and
  object data must remain available.
- A developer validates the stack before application dependencies are installed;
  structural validation remains possible independently of starting containers.
- A required host port is already occupied; startup reports the platform error
  without silently selecting a different port.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The repository MUST provide one root command configuration that defines exactly five components: application, durable relational database, ephemeral coordination store, object store, and database administration UI.
- **FR-002**: All five components MUST participate in one explicitly named, isolated local network.
- **FR-003**: Every component MUST define a bounded health check appropriate to its runtime.
- **FR-004**: The application MUST wait for the database, coordination store, and object store to become healthy before it starts.
- **FR-005**: The database administration UI MUST wait for the database to become healthy and MUST remain an operational aid rather than an application dependency.
- **FR-006**: Database records and object-storage data MUST use separate persistent storage that survives container recreation.
- **FR-007**: The coordination store MUST remain ephemeral and MUST NOT be treated as durable storage for marketplace records.
- **FR-008**: Database and object-storage credentials MUST be supplied from developer-local environment configuration and MUST NOT have committed fallback values.
- **FR-009**: Missing required credentials MUST cause configuration validation to fail before containers are created, with an actionable message.
- **FR-010**: The application image MUST install locked dependencies, create a production build, and run the production start command as a non-root user.
- **FR-011**: The repository MUST document every required local variable with non-secret placeholder values and MUST prevent local secret files from being committed.
- **FR-012**: The database component MUST support the project's approved vector-search extension without treating similarity results as authorization or verified product truth.
- **FR-013**: The object store MUST expose both its application interface and its local administration console on documented ports.
- **FR-014**: The local stack MUST use stable internal component names so the application can address dependencies without host-specific network configuration.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can validate the complete five-component local stack with one command in under 30 seconds when required settings are present.
- **SC-002**: All five components report readiness through bounded checks, with no check waiting indefinitely.
- **SC-003**: Removing any one required credential causes validation to fail before container creation in 100% of tested cases and identifies that setting.
- **SC-004**: Database and object data remain available after one full container recreation cycle when named storage is retained.
- **SC-005**: A repository secret scan of the delivered files finds zero usable database or object-storage credentials.
- **SC-006**: A production application image build and start complete successfully from the checked-in package manifest and lockfile.

## Assumptions

- The stack targets local development and evaluation, not a production-grade
  distributed deployment.
- Developers have a recent Docker Engine with Compose v2 and ports 3000, 5432,
  6379, 8080, 9000, and 9001 available.
- The existing Next.js application and pnpm lockfile are the application source
  for the image build.
- Creating database schemas, enabling the vector extension inside an individual
  database, and creating object-storage buckets belong to later migrations or
  initialization features.
- Platform-provided container restart behavior is sufficient; application-level
  retry orchestration is outside this feature.
