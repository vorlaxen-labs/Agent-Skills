---
name: web-frontend
description: >-
  Frontend decision boundaries. Constrain decisions, not implementations.
  Use for web UI components, pages, forms, client-side state, and frontend code.
---
# Core Principle

**Constrain decisions, not implementations.**

These rules add frontend **decision boundaries** on top of global standards.

They do not prescribe components, hooks, state libraries, or styling approaches. Follow the project.

---

# Hard Rules — Read First

1. **Never hallucinate.** Do not invent components, hooks, routes, props, endpoints, or styling tokens. Read the codebase first.
2. **If uncertain, stop and ask.** Do not guess names, state shape, or API responses.
3. **Do not change the project's frontend stack** unless the user explicitly asks.
4. **These rules constrain decisions only.** Implementation style comes from the existing codebase.

---

# Decision: Stack & Patterns

**Forbidden without explicit user request:**

- Introducing a new framework, UI library, or styling system
- Introducing a second state management system
- Introducing a second validation or data-fetching approach

**Required:** read existing frontend code and match its patterns before writing anything.

---

# Decision: Reuse vs Create

**Required before creating anything new:** search the repo for an existing component, hook, or utility.

**Forbidden:** duplicating something that already exists in the project.

---

# Decision: State Ownership

**Forbidden:** adding global state for data that belongs to a single component or page.

**Required:** follow the project's state management. If unknown, read existing components first.

---

# Decision: User-Facing Async Features

**Required outcome:** the user must never be left without feedback.

For async user-facing features, you must account for:

- In-progress state
- Failure state
- Empty state (when applicable)

**Not your decision:** how loading spinners, skeletons, or error UI look — follow the project.

**If unsure which states apply:** ask.

---

# Decision: Forms

**Required outcomes:**

- Input is validated before submission
- Errors are visible to the user
- Duplicate submission is prevented during in-flight requests
- User input is preserved on validation failure

**Not your decision:** which validation library or form pattern to use — follow the project.

**If validation approach is unknown:** find it in the codebase before writing.

---

# Decision: Accessibility

**Required outcome:** user-facing UI must be accessible.

**Forbidden:** shipping interactive UI that is keyboard-inaccessible or lacks proper labels/semantics.

**Not your decision:** specific ARIA patterns or component structure — follow the project and web standards.

---

# Decision: API Integration

**Required outcomes:**

- Network failures show user-visible feedback
- Raw API errors are not shown to users

**Forbidden:** inventing API endpoints or response shapes.

**Required:** read existing types, schemas, or API calls first.

---

# Decision: Performance Optimizations

**Forbidden without clear need:** adding memoization, virtualization, pagination, or debouncing.

**Required:** if performance work is needed beyond the task scope, describe it and ask before implementing.

---

# Decision: Scope

**Forbidden without approval:**

- Refactoring unrelated components
- Migrating the frontend to a new pattern or stack

**If unsure whether a change is in scope:** stop and ask.
