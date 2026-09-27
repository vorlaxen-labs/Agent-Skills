# Included skills

The repo serves two purposes. Pick what you need — or use both together.

## Engineering standards (universal)

Decision boundaries for AI coding agents — what they may decide, what they must not, and when to stop and ask. Works with any stack.

| Module | Id | When to use |
|--------|----|-------------|
| Global | `global` | Every project — [`AGENTS.md`](../AGENTS.md) |
| Web frontend | `web-frontend` | UI, components, forms |
| Web backend | `web-backend` | APIs, services, auth, DB |

Global content also lives at [`skills/global/SKILL.md`](../skills/global/SKILL.md) (Cursor skill) and [`rules/global.mdc`](../rules/global.mdc) (Cursor always-on rule). Keep all three in sync when editing.

## Audit modules (optional)

Scan-and-report workflows with bundled tooling (scanner scripts, reference playbooks). Installed under `.agent-skills/<id>/` on AGENTS.md / Copilot / Claude Code, and under `.cursor/skills/<id>/` on Cursor. Audit bodies are **not** merged into `AGENTS.md` — load the skill when you run an audit.

| Module | Id | When to use |
|--------|----|-------------|
| Kill AI slop | `kill-ai-slop` | De-slop landing pages and UI (scan → report → fix) |

Registry: [`skills/audits/manifest.json`](../skills/audits/manifest.json). After install, audit ids also appear in `.agent-skills/manifest.json` under `audits`.

## Vorlaxen library skills (optional)

For [@vorlaxen-labs](https://github.com/vorlaxen-labs) npm packages — verified against source, not guessed from package names.

| Package | Skill id |
|---------|----------|
| `@vorlaxen-labs/kargomucuz-sdk` | `kargomucuz-sdk` |
| `@vorlaxen-labs/bar-js` | `bar-js` |
| `@vorlaxen-labs/huk-js` | `huk-js` |

Each has a `SKILL.md` entry point and a `reference/` folder with full API docs under [`skills/libraries/`](../skills/libraries/).

## Monorepos

Place `AGENTS.md` closer to the code it governs — agents read the nearest file in the tree.

## Authoring

See [SKILL-SPEC.md](../SKILL-SPEC.md) and [CONTRIBUTING.md](../CONTRIBUTING.md) for how to add or edit skills.
