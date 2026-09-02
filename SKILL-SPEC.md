# Skill Specification

How to author modules in [Vorlaxen Agent Skills](https://github.com/vorlaxen-labs/agent-skills).

This repo has **two audiences**:

| Audience | What they take | Example |
|----------|----------------|---------|
| **Community** | Engineering standards — portable decision boundaries | `AGENTS.md`, `skills/web/*` |
| **Vorlaxen ecosystem** | Library skills — verified API knowledge for npm packages | `skills/libraries/bar-js/` |

Both use the same skill format defined here.

---

## Skill types

### 1. Global standards

Decision boundaries for every coding task. Tool-agnostic.

| Artifact | Path | Role |
|----------|------|------|
| Universal file | `AGENTS.md` | Copy to any project root — Claude, Copilot, Cursor, etc. |
| Cursor skill | `skills/global/SKILL.md` | On-demand global module |
| Cursor always-on | `rules/global.mdc` | Same content, `alwaysApply: true` |

**Sync rule:** global content must be identical across all three files. Body text matches; only frontmatter differs.

### 2. Domain modules

Extra decision boundaries on top of global — e.g. web frontend, web backend.

| Path | `name` | Scope |
|------|--------|-------|
| `skills/web/frontend/SKILL.md` | `web-frontend` | UI, components, forms, client state |
| `skills/web/backend/SKILL.md` | `web-backend` | APIs, services, auth, database |

Domain modules **extend** global standards. They do not repeat the full global document — they add domain-specific boundaries only.

### 3. Library skills

Verified domain knowledge for a specific package. Prevents agents from inventing APIs.

| Path | Example `name` |
|------|----------------|
| `skills/libraries/<package>/SKILL.md` | `bar-js`, `huk-js`, `kargomucuz-sdk` |

Library skills **require** a `reference/` folder. All API claims must be cross-checked against the actual package source before merge.

---

## Directory layout

### Domain module (minimal)

```
skills/web/frontend/
└── SKILL.md
```

### Library skill (standard)

```
skills/libraries/bar-js/
├── SKILL.md                 # Entry point — rules, quick start, links
└── reference/
    ├── api-reference.md     # Required — full type/method listing
    ├── getting-started.md
    ├── recipes.md
    └── …                      # Topic files as needed
```

Optional later: `examples.md`, `scripts/` — only when they add real value.

---

## Frontmatter

Every `SKILL.md` starts with YAML frontmatter. **Only frontmatter is tool-specific.** The markdown body must work when pasted into any agent tool.

### Required fields

```yaml
---
name: your-module
description: >-
  What it does. Third person. Include trigger terms so the agent knows WHEN
  to load this skill — package names, domain keywords, task types.
---
```

| Field | Rules |
|-------|-------|
| `name` | Lowercase, hyphens, max 64 chars. Matches directory name where practical. |
| `description` | Max 1024 chars. **Third person.** Must include **what** + **when** + trigger terms. |

### Description examples

```yaml
# Domain module
description: >-
  Frontend decision boundaries. Constrain decisions, not implementations.
  Use for web UI components, pages, forms, client-side state, and frontend code.

# Library skill
description: >-
  Framework-agnostic TypeScript API response builder (@vorlaxen-labs/bar-js).
  Use when building REST API responses, res.builder patterns, or error/success envelopes.
```

### Cursor-only files

`rules/global.mdc` uses `.mdc` frontmatter — not a skill:

```yaml
---
description: Global project rules for all interactions
alwaysApply: true
---
```

Do not put skill `name` in `.mdc` files.

---

## Body structure

### Core principle (all types)

Every module opens with the shared principle:

```markdown
# Core Principle

**Constrain decisions, not implementations.**
```

Domain and library modules add one sentence on what they layer on top of global standards.

### Global & domain modules

Use this section pattern:

| Label | Purpose |
|-------|---------|
| `# Hard Rules — Read First` | Non-negotiable boundaries, numbered list |
| `# Decision: <Topic>` | What the agent may / must not decide |
| `**Required outcome:**` | Goal the agent must hit |
| `**Not your decision:**` | What the project owns |
| `**Forbidden without approval:**` | Stop-and-ask triggers |
| `**Required:**` | Mandatory behavior |

Language rules:

- Use **must / must not / stop / ask** — not "consider" or "prefer"
- Do not prescribe stack, folder layout, or implementation patterns
- Risk-tiered uncertainty: ask for contracts, schema, security; proceed when the codebase already shows the pattern

Global module also includes: `# Role`, `# Decision: When to Stop and Ask vs Proceed`, `# Before You Act`, `# Prime Directive`.

### Library modules

Library `SKILL.md` is an **entry point**, not the full docs. Target **under 200 lines**.

Required sections in order:

1. **Title + package line** — npm name, version, one-line purpose
2. **Critical Rules** — numbered list of mistakes agents actually make (not generic advice)
3. **Quick Start** — one working code block copy-pasteable as-is
4. **Key API surface** — tables or short lists for the 80% case
5. **When NOT to use** (optional but recommended)
6. **Reference Documentation** — table linking every `reference/*.md` file

Progressive disclosure rule:

- `SKILL.md` = rules + quick start + navigation
- `reference/` = full API, edge cases, types
- Link **one level deep** from `SKILL.md` → `reference/*.md` only (no `reference/a/b/c.md` chains from SKILL)

Agents must be told explicitly:

```markdown
6. **Never invent API fields** — read [reference/api-reference.md](reference/api-reference.md) for exact types.
```

### Reference files (`reference/`)

| File | Required | Content |
|------|----------|---------|
| `api-reference.md` | **Yes** | Every public export, method signature, type — verified against source |
| `getting-started.md` | Recommended | Install, init, first call |
| `recipes.md` | Recommended | Production patterns |
| Topic files | As needed | One concern per file (`errors.md`, `typescript.md`, …) |

Reference writing rules:

- Signatures and types must match the published package — not docs site guesses
- Note breaking behaviors and footguns explicitly (e.g. "`.as.ok(undefined)` wipes wrap data")
- Version-sensitive facts: state the package version the docs were verified against
- No placeholders, no `TODO`, no invented peer dependencies

---

## Platform portability

| Portable (skill body) | Tool-specific (metadata only) |
|-----------------------|-------------------------------|
| All markdown under `# Core Principle` | `SKILL.md` YAML frontmatter |
| `reference/*.md` content | `rules/global.mdc` frontmatter |
| `AGENTS.md` body | `alwaysApply`, `description` in `.mdc` |

A skill body should read the same whether the user pastes it into Claude, Copilot, or Cursor.

**Universal install:** copy `AGENTS.md` to project root.  
**Cursor install:** copy skill directory to `~/.cursor/skills/<name>/`.

When appending a skill to non-Cursor tools, **strip YAML frontmatter** — paste the markdown body only.

---

## Naming conventions

| Item | Convention | Example |
|------|------------|---------|
| Skill directory | lowercase, hyphens | `skills/libraries/bar-js/` |
| Cursor skill `name` | lowercase, hyphens | `web-frontend`, `bar-js` |
| Reference files | lowercase, hyphens | `api-reference.md`, `getting-started.md` |
| Section headers | `# Decision:` for boundaries | `# Decision: Scope` |

Avoid vague names: `helper`, `utils`, `tools`.

---

## Adding a new skill

### Domain module

1. Create `skills/<area>/<name>/SKILL.md` with frontmatter + Core Principle + Hard Rules + Decision sections
2. Extend global — do not duplicate global content verbatim
3. Add row to README modules table
4. Open PR

### Library skill

1. Create `skills/libraries/<package-name>/SKILL.md`
2. Create `skills/libraries/<package-name>/reference/api-reference.md` first
3. Add topic reference files; link all from SKILL.md
4. Verify every API claim against package source (not npm readme alone)
5. Add row to README library table
6. Open PR

---

## Review checklist

Before merging any skill change:

### All modules

- [ ] Frontmatter `name` and `description` present; description is third person with trigger terms
- [ ] Opens with **Constrain decisions, not implementations**
- [ ] No invented paths, APIs, types, or config keys
- [ ] No vague "consider / prefer / maybe"
- [ ] Body works without Cursor-specific assumptions

### Global sync (if editing global content)

- [ ] `AGENTS.md`, `skills/global/SKILL.md`, and `rules/global.mdc` bodies match

### Library skills

- [ ] `reference/api-reference.md` exists and is complete
- [ ] Critical Rules cover real agent mistakes, not boilerplate
- [ ] Quick Start compiles against current package API
- [ ] Package name and version stated in SKILL.md
- [ ] All `reference/` files linked from SKILL.md
- [ ] Claims verified against source repository

---

## Anti-patterns

| Don't | Do instead |
|-------|------------|
| Put full API docs in `SKILL.md` | Keep entry point short; use `reference/` |
| Duplicate global rules in every domain module | Reference global; add domain-only boundaries |
| Invent method signatures from memory | Read package source; document exactly |
| Prescribe React vs Vue, Express vs Fastify | Constrain decisions; let the project decide |
| Deep reference chains (`SKILL → a → b → c`) | Link directly from SKILL to each reference file |
| Time-sensitive "before August 2025" notes | State current behavior; archive old patterns separately |
| Windows paths (`scripts\foo.py`) | POSIX paths always |

---

## Related docs

- [README.md](README.md) — what this repo is, quick start
- [CONTRIBUTING.md](CONTRIBUTING.md) — PR workflow, source-of-truth table
- [AGENTS.md](AGENTS.md) — global engineering standards (reference implementation)
