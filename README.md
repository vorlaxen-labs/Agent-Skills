# Vorlaxen Agent Skills

**Decision boundaries for AI coding agents** — what they may decide, what they must not, and when to stop and ask.

Works with Cursor, Claude Code, Copilot, Windsurf, Codex, Gemini CLI, and any tool that reads custom instructions.

---

## What is this?

This repo serves **two purposes**. Pick what you need:

| | **Engineering standards** | **Vorlaxen library skills** |
|---|---|---|
| **For** | Any team, any stack | Teams using [@vorlaxen-labs](https://github.com/vorlaxen-labs) npm packages |
| **What** | Rules that stop agents from hallucinating, over-scoping, or asking permission for every pixel | Verified API docs so agents use `bar-js`, `huk-js`, `kargomucuz-sdk` correctly |
| **Start here** | [`AGENTS.md`](AGENTS.md) | [`skills/libraries/`](skills/libraries/) |

**Not Vorlaxen-specific?** Copy `AGENTS.md` and ignore the library folder.  
**Using Vorlaxen packages?** Add the matching library skill on top of the global standards.

Maintained by [Vorlaxen Labs](https://github.com/vorlaxen-labs) as both our internal agent config and an open community standard. Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

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

## Quick start

```bash
npx @vorlaxen-labs/agent-skills init
```

Interactive setup — pick your platform (AGENTS.md, Cursor, Claude Code, Copilot) and the skills you need. Only selected files are fetched; no full repo clone.

**Non-interactive example:**

```bash
npx @vorlaxen-labs/agent-skills init --platform cursor --skills global,web-frontend,bar-js
```

**Remote source** (optional — default uses the bundled snapshot shipped with your CLI version):

```bash
# Same version tag as the installed CLI (e.g. v1.0.0)
npx @vorlaxen-labs/agent-skills init --remote

# Bleeding-edge from main
npx @vorlaxen-labs/agent-skills init --remote=main
```

Invalid `--platform` or `--skills` values are rejected with a list of available options.

**Manual install** (alternative):

```bash
git clone https://github.com/vorlaxen-labs/agent-skills.git
cp agent-skills/AGENTS.md /path/to/your-project/
```

That's it for most tools. [`AGENTS.md`](AGENTS.md) follows the [open AGENTS.md standard](https://agents.md/) — Claude Code, Cursor, Copilot, and others pick it up from the project root.

**Cursor users** — for always-on rules and on-demand skills:

```bash
cp agent-skills/rules/global.mdc ~/.cursor/rules/
cp -r agent-skills/skills/global ~/.cursor/skills/
# optional: cp -r agent-skills/skills/web/* ~/.cursor/skills/
# optional: cp -r agent-skills/skills/libraries/* ~/.cursor/skills/
```

**Claude Code** — `cp AGENTS.md ~/.claude/CLAUDE.md` or into your project as `CLAUDE.md`.

For other tools, paste `AGENTS.md` into custom instructions. Append a skill's body (skip YAML frontmatter) when you need web or library modules.

---

## What's included

### Engineering standards (universal)

| Module | File | When to use |
|--------|------|-------------|
| Global | [`AGENTS.md`](AGENTS.md) | Every project |
| Web frontend | [`skills/web/frontend/SKILL.md`](skills/web/frontend/SKILL.md) | UI, components, forms |
| Web backend | [`skills/web/backend/SKILL.md`](skills/web/backend/SKILL.md) | APIs, services, auth, DB |

Same global content also lives at [`skills/global/SKILL.md`](skills/global/SKILL.md) (Cursor skill) and [`rules/global.mdc`](rules/global.mdc) (Cursor always-on rule). Keep all three in sync when editing.

### Vorlaxen library skills (optional)

For [@vorlaxen-labs](https://github.com/vorlaxen-labs) packages — verified against source, not guessed from npm names.

| Package | Skill |
|---------|-------|
| `@vorlaxen-labs/kargomucuz-sdk` | [`skills/libraries/kargomucuz-sdk/`](skills/libraries/kargomucuz-sdk/) |
| `@vorlaxen-labs/bar-js` | [`skills/libraries/bar-js/`](skills/libraries/bar-js/) |
| `@vorlaxen-labs/huk-js` | [`skills/libraries/huk-js/`](skills/libraries/huk-js/) |

Each has a `SKILL.md` entry point and a `reference/` folder with full API docs.

---

## Repo layout

```
agent-skills/
├── AGENTS.md              # Universal — copy anywhere
├── package.json           # CLI: npx @vorlaxen-labs/agent-skills init
├── src/                   # CLI source
├── rules/global.mdc       # Cursor always-on
├── skills/
│   ├── global/            # Cursor skill (same content as AGENTS.md)
│   ├── web/               # Frontend & backend modules
│   └── libraries/         # Vorlaxen npm package skills
├── CONTRIBUTING.md
├── SKILL-SPEC.md          # Skill authoring specification
└── LICENSE
```

Monorepos: place `AGENTS.md` closer to the code it governs — agents read the nearest file in the tree.

---

## License

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Vorlaxen Labs.
