# Contributing

Thank you for improving Vorlaxen Agent Skills.

**Authoring spec:** [SKILL-SPEC.md](SKILL-SPEC.md) — skill types, structure, frontmatter, reference layout, review checklist.

## Source of Truth

Global standards must stay in sync across these files:

| File | Purpose |
|------|---------|
| `AGENTS.md` | Universal — all tools, project root |
| `skills/global/SKILL.md` | Cursor on-demand skill |
| `rules/global.mdc` | Cursor always-on rule |

Domain-specific modules (`web-frontend`, `web-backend`, library skills):

| File | Purpose |
|------|---------|
| `skills/web/*/SKILL.md` | Web domain Cursor skills |
| `skills/libraries/*/SKILL.md` | Library Cursor skills |
| `skills/libraries/*/reference/` | Full API documentation per package |

When editing global content, update **all three** global files. When editing a library skill, update `SKILL.md`, `skills/libraries/manifest.json`, and the relevant `reference/` files together.

CI runs `npm run check` — global sync (`AGENTS.md` ↔ `skills/global/SKILL.md` ↔ `rules/global.mdc` from `# Core Principle`) and library npm version binding.

## Adding a New Module

1. Create `skills/your-module/SKILL.md` with frontmatter:

```yaml
---
name: your-module
description: >-
  What it does and when the agent should use it. Third person. Include trigger terms.
---
```

2. Add `reference/` docs if the module needs detailed API or domain reference.
3. Update the modules table in `README.md`.
4. Open a pull request against `main`.

## Adding a Library Skill

1. Create `skills/libraries/<package-name>/SKILL.md` — concise entry point with critical rules and quick start.
2. Add verified documentation under `skills/libraries/<package-name>/reference/`.
3. Cross-check all API claims against the actual package source before merging.
4. Update `README.md` library table.
5. Pin the verified npm version in `skills/libraries/manifest.json` and `SKILL.md` frontmatter (`npmPackage`, `npmVersion`) — CI checks all three match and exist on npm.

## Content Guidelines

- **Core principle:** Constrain decisions, not implementations.
- Every module starts with **Core Principle** and **Hard Rules**.
- Write **Decision:** for boundaries, **Required outcome:** for goals, **Not your decision:** for what the project owns.
- Use MUST / MUST NOT / STOP / ASK — not vague "consider" or "prefer".
- Do not prescribe implementation patterns, specific libraries, or folder layouts.
- Keep modules focused and composable.

## Platform Compatibility

Prefer portable markdown in skill bodies. Tool-specific metadata belongs only in:

| Tool-specific | Files |
|---------------|-------|
| Cursor skill `name` / `description` | `skills/**/SKILL.md` frontmatter |
| Cursor always-on | `rules/global.mdc` frontmatter |

Core instruction content should read the same whether pasted into Claude, Copilot, or Cursor.

## Questions

Open an [issue](https://github.com/vorlaxen-labs/agent-skills/issues) before large structural changes.
