---
name: web-backend
description: >-
  Backend decision boundaries. Constrain decisions, not implementations.
  Use for APIs, services, database access, auth, and server-side logic.
---
# Core Principle

**Constrain decisions, not implementations.**

These rules add backend **decision boundaries** on top of global standards.

They do not prescribe frameworks, ORMs, folder layouts, or service patterns. Follow the project.

---

# Hard Rules — Read First

1. **Never hallucinate.** Do not invent routes, handlers, services, models, tables, columns, or API contracts. Read the codebase first.
2. **If uncertain, stop and ask.** Do not guess schema, auth flow, or API shape.
3. **Do not change the project's backend stack** unless the user explicitly asks.
4. **These rules constrain decisions only.** Implementation style comes from the existing codebase.

---

# Decision: Stack & Architecture

**Forbidden without explicit user request:**

- Introducing a new framework, ORM, or validation library
- Introducing a service layer if the project does not use one
- Moving business logic out of handlers if the project keeps it there
- Imposing a different architectural pattern than the project uses

**Required:** read existing handlers, services, and models before writing anything.

---

# Decision: API Contracts

**Forbidden without explicit user request:**

- Breaking changes to existing API contracts
- Renaming or removing fields used by existing consumers
- Inventing endpoints, fields, or response shapes

**Required before any contract change:** read schemas, types, consumers, and validation.

**Required outcome:** clients never receive raw database errors, stack traces, or internal details.

---

# Decision: Input & Auth

**Required outcomes:**

- Untrusted input is validated at the API boundary
- Client-provided auth or ownership claims are verified server-side

**Forbidden:** introducing a second validation or auth system.

**Not your decision:** which validation or auth library to use — follow the project.

---

# Decision: Database

**Forbidden:**

- Guessing table names, columns, or relationships
- Inventing schema
- Schema changes beyond what the task requires

**Required:** read existing schema and models first.

**If names or relationships are unknown:** stop and read, or ask.

**Required outcomes for multi-step mutations:**

- Data remains consistent on failure
- Duplicate-sensitive operations are handled safely when the domain requires it

**Not your decision:** whether to use transactions, idempotency keys, or specific query patterns — follow the project unless the task demands a specific fix.

---

# Decision: Error Handling

**Required outcomes:**

- Errors are never silently swallowed
- Success is never returned on failure
- Client responses do not leak sensitive internals
- Useful context is preserved for logging

**Not your decision:** specific error types or response format — follow the project.

---

# Decision: Infrastructure & Background Systems

**Forbidden unless the task explicitly requires it or the user approves:**

- Adding queues, caches, distributed locks, or background jobs
- Adding Redis, BullMQ, or similar infrastructure
- Adding caching without a defined invalidation strategy

**If the task needs infrastructure beyond current scope:** stop, describe, ask, wait.

---

# Decision: Security

**Required:** consider security at external boundaries.

**Forbidden:** adding security infrastructure unrelated to the current feature.

**Not your decision:** specific security tooling — follow the project.

---

# Decision: Scope

**Forbidden without approval:**

- Refactoring unrelated services
- Migrating the backend to a new pattern or stack

**If unsure whether a change is in scope:** stop and ask.
