# Vorlaxen Agent Skills

Production-grade AI agent instructions written from a senior engineer's perspective.

**Core principle: Constrain decisions, not implementations.**

These prompts define what an agent **may decide**, **must not decide alone**, and **when to stop and ask**. They do not prescribe how to write code — the existing codebase does that.

Works with **Cursor, Claude Code, GitHub Copilot, Windsurf, OpenAI Codex, Gemini CLI**, and any tool that accepts custom instructions.

**Organization:** [vorlaxen-labs](https://github.com/vorlaxen-labs) · **Author:** [Vorlaxen](https://github.com/Vorlaxen) (Hakan K.)

All npm packages (`@vorlaxen-labs/*`) and this repository live under the [vorlaxen-labs](https://github.com/vorlaxen-labs) GitHub organization.

---

## Philosophy

### Constrain decisions, not implementations

| Constrain (these prompts) | Do not constrain (the project decides) |
|---------------------------|----------------------------------------|
| When to stop and ask | Which framework or library to use |
| What requires user approval | Folder structure and naming |
| What you may not invent | Code patterns and syntax style |
| Required outcomes (readable, production-safe) | How to achieve those outcomes |
| Scope boundaries | Implementation details |

### Hard boundaries on every module

1. **Never hallucinate** — unseen = nonexistent
2. **Stop and ask** — uncertain = do not proceed
3. **Scope control** — no silent refactors or infrastructure changes
4. **Follow the project** — conventions beat agent preference

---

## Available Instructions

| Module | File | Scope |
|--------|------|-------|
| **Global** | `AGENTS.md` / `prompts/global.md` | Every project, every language |
| **Web Frontend** | `prompts/web-frontend.md` | UI, components, forms, accessibility |
| **Web Backend** | `prompts/web-backend.md` | APIs, services, database, auth |

### Library Skills

Domain knowledge for [@vorlaxen-labs](https://github.com/vorlaxen-labs) npm packages — full API reference included.

| Library | npm Package | Skill | Scope |
|---------|-------------|-------|-------|
| **kargomucuz-sdk** | `@vorlaxen-labs/kargomucuz-sdk` | `skills/libraries/kargomucuz-sdk/` | Kargomucuz cargo API — addresses, rates, shipments, tracking |
| **bar-js** | `@vorlaxen-labs/bar-js` | `skills/libraries/bar-js/` | API response builder — envelopes, presets, tracing, pagination |
| **huk-js** | `@vorlaxen-labs/huk-js` | `skills/libraries/huk-js/` | TypeScript utilities — string, number, date, array, object, crypto |

Each skill includes a concise `SKILL.md` entry point and a `reference/` folder with the complete documentation from [docs-client](https://github.com/vorlaxen-labs/docs-client).

### Install Library Skills

```bash
cp -r skills/libraries/kargomucuz-sdk ~/.cursor/skills/kargomucuz-sdk
cp -r skills/libraries/bar-js ~/.cursor/skills/bar-js
cp -r skills/libraries/huk-js ~/.cursor/skills/huk-js
```

Agents should read `reference/api-reference.md` inside the skill folder before inventing types or method signatures.

---

## Quick Install (Universal)

Copy `AGENTS.md` to your project root. Most AI coding tools read it automatically:

```bash
git clone https://github.com/vorlaxen-labs/agent-skills.git
cp agent-skills/AGENTS.md /path/to/your-project/
```

Supported natively or via CLI by: Claude Code, Cursor, GitHub Copilot, Windsurf, Codex, Gemini CLI, Aider, Zed, and others following the [AGENTS.md](https://agents.md/) open standard.

---

## Platform Setup

### Claude Code

**Global (all projects):**

```bash
cp prompts/global.md ~/.claude/CLAUDE.md
```

**Project (team-shared):**

```bash
cp AGENTS.md /path/to/your-project/CLAUDE.md
# or
cp AGENTS.md /path/to/your-project/.claude/CLAUDE.md

# Domain-specific rules (loaded when matching files are touched)
cp -r .claude/rules /path/to/your-project/.claude/
```

Verify with `/memory` or `/context` in a Claude Code session.

### Claude.ai (Projects)

1. Create a Project in Claude.ai
2. Open **Project Settings → Custom Instructions**
3. Paste the contents of `prompts/global.md`
4. Add `prompts/web-frontend.md` or `prompts/web-backend.md` when working on web code

### Cursor

**Always-on rule:**

```bash
mkdir -p ~/.cursor/rules
cp rules/global.mdc ~/.cursor/rules/
```

**On-demand skills:**

```bash
cp -r skills/global ~/.cursor/skills/
cp -r skills/web/frontend ~/.cursor/skills/web-frontend
cp -r skills/web/backend ~/.cursor/skills/web-backend

# Library skills (Vorlaxen npm packages)
cp -r skills/libraries/kargomucuz-sdk ~/.cursor/skills/kargomucuz-sdk
cp -r skills/libraries/bar-js ~/.cursor/skills/bar-js
cp -r skills/libraries/huk-js ~/.cursor/skills/huk-js
```

Cursor also reads `AGENTS.md` at the project root as a simpler alternative.

### GitHub Copilot

**Shared team standards (recommended):**

```bash
cp AGENTS.md /path/to/your-project/
```

**Copilot-editor specific** (optional, Copilot-only):

```bash
mkdir -p /path/to/your-project/.github
cp AGENTS.md /path/to/your-project/.github/copilot-instructions.md
```

Put shared rules in `AGENTS.md`. Reserve `copilot-instructions.md` for Copilot-editor-specific behavior only.

### Windsurf

**Universal:**

```bash
cp AGENTS.md /path/to/your-project/
```

**Windsurf-specific rules** (optional):

```bash
mkdir -p /path/to/your-project/.windsurf/rules
cp prompts/global.md /path/to/your-project/.windsurf/rules/global.md
cp prompts/web-frontend.md /path/to/your-project/.windsurf/rules/web-frontend.md
cp prompts/web-backend.md /path/to/your-project/.windsurf/rules/web-backend.md
```

### OpenAI Codex / ChatGPT / Other

Copy `prompts/global.md` into:

- **Codex:** `~/.codex/AGENTS.md` (global) or project-root `AGENTS.md`
- **ChatGPT:** Custom Instructions in Settings
- **Any API integration:** System prompt field

For domain-specific work, append or separately inject `prompts/web-frontend.md` or `prompts/web-backend.md`.

---

## Monorepo / Nested Projects

Place domain instructions closer to the code they govern:

```
your-monorepo/
├── AGENTS.md                          # Global standards (from this repo)
├── packages/
│   ├── web/
│   │   ├── AGENTS.md                  # prompts/web-frontend.md content
│   │   └── ...
│   └── api/
│       ├── AGENTS.md                  # prompts/web-backend.md content
│       └── ...
```

Agents read the nearest `AGENTS.md` in the directory tree — closest file wins.

---

## Repository Structure

```
agent-skills/
├── AGENTS.md                          # Universal — copy to any project root
├── prompts/
│   ├── global.md                      # Plain markdown, tool-agnostic
│   ├── web-frontend.md
│   └── web-backend.md
├── skills/                            # Cursor skills (on-demand)
│   ├── global/SKILL.md
│   ├── libraries/                     # Vorlaxen npm package skills
│   │   ├── kargomucuz-sdk/
│   │   │   ├── SKILL.md
│   │   │   └── reference/
│   │   ├── bar-js/
│   │   │   ├── SKILL.md
│   │   │   └── reference/
│   │   └── huk-js/
│   │       ├── SKILL.md
│   │       └── reference/
│   └── web/
│       ├── frontend/SKILL.md
│       └── backend/SKILL.md
├── rules/
│   └── global.mdc                     # Cursor always-on rule
├── .claude/
│   └── rules/                         # Claude Code path-scoped rules
│       ├── web-frontend.md
│       └── web-backend.md
├── LICENSE
├── CONTRIBUTING.md
└── README.md
```

### Which file to use?

| Goal | File |
|------|------|
| One file, all tools, team-shared | `AGENTS.md` |
| Copy-paste anywhere (ChatGPT, API, etc.) | `prompts/*.md` |
| Cursor always-on | `rules/global.mdc` |
| Cursor on-demand skills | `skills/*/SKILL.md` |
| Library skills & API reference | `skills/libraries/{kargomucuz-sdk,bar-js,huk-js}/` |
| Claude Code path-scoped | `.claude/rules/*.md` |

Keep content in sync: edit `prompts/` or `skills/global/SKILL.md`, then propagate to `AGENTS.md` and `rules/global.mdc`.

---

## What Was Deliberately Excluded

These instructions synthesize senior engineering experience — not hype-driven AI prompts:

* Mandatory tech stacks — use the project's existing stack
* Forced audit blocks or meta-commentary in every response
* Silent scope expansion
* 800-line file dumps
* Infrastructure auto-generation on every task

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT License — see [LICENSE](LICENSE).

Copyright (c) 2026 Vorlaxen Labs
