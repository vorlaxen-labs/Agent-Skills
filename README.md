# Vorlaxen Agent Skills

[![CI](https://img.shields.io/github/actions/workflow/status/vorlaxen-labs/agent-skills/ci.yml?branch=main&label=CI)](https://github.com/vorlaxen-labs/agent-skills/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@vorlaxen-labs/agent-skills?label=npm)](https://www.npmjs.com/package/@vorlaxen-labs/agent-skills)

**Decision boundaries for AI coding agents** — what they may decide, what they must not, and when to stop and ask.

Works with Cursor, Claude Code, Copilot, Windsurf, Codex, Gemini CLI, and any tool that reads custom instructions.

Maintained by [Vorlaxen Labs](https://github.com/vorlaxen-labs) as both our internal agent config and an open community standard.

---

## What is this?

This repository is two things in one:

| | **Engineering standards** | **Vorlaxen library skills** |
|---|---|---|
| **For** | Any team, any stack | Teams using [@vorlaxen-labs](https://github.com/vorlaxen-labs) npm packages |
| **What** | Rules that stop agents from hallucinating, over-scoping, or asking permission for every pixel | Verified API docs so agents use `bar-js`, `huk-js`, `kargomucuz-sdk` correctly |
| **Start here** | [`AGENTS.md`](AGENTS.md) | [`skills/libraries/`](skills/libraries/) |

**Not Vorlaxen-specific?** Copy [`AGENTS.md`](AGENTS.md) and ignore the library folder.

**Using Vorlaxen packages?** Add the matching library skill on top of the global standards.

The [`@vorlaxen-labs/agent-skills`](https://www.npmjs.com/package/@vorlaxen-labs/agent-skills) CLI installs the right files into your project for your platform — interactively or in CI. Full CLI reference lives in [`docs/`](docs/README.md).

---

## Core idea

**Constrain decisions, not implementations.**

These rules tell an agent *what it may decide* — not *how to write code*. Stack, patterns, and folder structure come from your project.

Four hard boundaries:

1. **Never hallucinate** — if it's not in the codebase, it doesn't exist
2. **Match risk to action** — ask for API contracts, schema, security; proceed when the pattern is already in the code
3. **Scope control** — no silent refactors or infrastructure changes
4. **Follow the project** — your conventions beat agent preference

Full rules: [`AGENTS.md`](AGENTS.md)

---

## What's included

### Engineering standards

Universal modules for every project — global rules plus optional web frontend and backend skills. See [Included skills](docs/included-skills.md).

### Vorlaxen library skills

Optional skills for `@vorlaxen-labs/bar-js`, `@vorlaxen-labs/huk-js`, and `@vorlaxen-labs/kargomucuz-sdk`. Each ships with a `SKILL.md` entry point and a `reference/` folder with full API documentation verified against source.

---

## Get started

```bash
npx @vorlaxen-labs/agent-skills init
```

| Topic | Documentation |
|-------|---------------|
| Quick start and examples | [docs/quick-start.md](docs/quick-start.md) |
| All CLI commands | [docs/README.md](docs/README.md) |
| Conflicts and manifest | [docs/conflicts-and-manifest.md](docs/conflicts-and-manifest.md) |
| Remote source and cache | [docs/remote-and-cache.md](docs/remote-and-cache.md) |
| Telemetry | [docs/telemetry.md](docs/telemetry.md) |
| Manual install (without CLI) | [docs/manual-install.md](docs/manual-install.md) |

---

## Contributing

Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). Skill authoring spec: [SKILL-SPEC.md](SKILL-SPEC.md).

---

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Vorlaxen Labs.
