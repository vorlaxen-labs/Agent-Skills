# Contributing

Thank you for improving Vorlaxen Agent Skills.

## Source of Truth

Content lives in multiple formats for different AI tools. When editing global standards, update **all** of these:


| File                     | Purpose                          |
| ------------------------ | -------------------------------- |
| `prompts/global.md`      | Universal plain markdown         |
| `AGENTS.md`              | Cross-tool project instructions |
| `skills/global/SKILL.md` | Cursor skill                     |
| `rules/global.mdc`       | Cursor always-on rule            |


Domain-specific content (`web-frontend`, `web-backend`):


| File                     | Purpose                       |
| ------------------------ | ----------------------------- |
| `prompts/web-*.md`       | Universal plain markdown      |
| `skills/web/*/SKILL.md`  | Cursor skills                 |
| `.claude/rules/web-*.md` | Claude Code path-scoped rules |




## Adding a New Module

1. Create `prompts/your-module.md` with plain markdown content.
2. Add Cursor skill at `skills/your-module/SKILL.md` with frontmatter:

```yaml
---
name: your-module
description: >-
  What it does and when the agent should use it. Third person. Include trigger terms.
---
```

1. If path-scoped, add `.claude/rules/your-module.md` with `paths:` frontmatter.
2. Update the modules table in `README.md`.
3. Open a pull request against `main`.



## Content Guidelines

- **Core principle:** Constrain decisions, not implementations.
- Every module starts with **Core Principle** and **Hard Rules**.
- Write **Decision:** sections for boundaries, **Required outcome:** for goals, **Not your decision:** for what the project owns.
- Use MUST / MUST NOT / STOP / ASK — not vague "consider" or "prefer guard clauses".
- Do not prescribe implementation patterns (specific hooks, syntax, libraries, folder layouts).
- Do not mandate specific libraries — the project decides how.
- Keep modules focused and composable.



## Platform Compatibility

This repo targets multiple AI tools. Prefer portable markdown over tool-specific features.


| Tool-specific                        | Portable                    |
| ------------------------------------ | --------------------------- |
| `alwaysApply`, `paths`, skill `name` | Plain markdown body         |
| Cursor `.mdc` frontmatter            | `AGENTS.md`, `prompts/*.md` |


Tool-specific frontmatter belongs only in adapter files (`rules/`, `skills/`, `.claude/rules/`). Core content should read the same everywhere.

## Questions

Open an [issue](https://github.com/vorlaxen-labs/agent-skills/issues) before large structural changes.