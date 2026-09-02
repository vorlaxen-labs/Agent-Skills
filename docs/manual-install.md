# Manual install

You can copy files directly without the CLI.

## AGENTS.md (most tools)

```bash
git clone https://github.com/vorlaxen-labs/agent-skills.git
cp agent-skills/AGENTS.md /path/to/your-project/
```

[`AGENTS.md`](../AGENTS.md) follows the [open AGENTS.md standard](https://agents.md/) — Claude Code, Cursor, Copilot, and others pick it up from the project root.

## Cursor

For always-on rules and on-demand skills:

```bash
cp agent-skills/rules/global.mdc ~/.cursor/rules/
cp -r agent-skills/skills/global ~/.cursor/skills/
# optional: cp -r agent-skills/skills/web/* ~/.cursor/skills/
# optional: cp -r agent-skills/skills/libraries/* ~/.cursor/skills/
```

## Claude Code

```bash
cp AGENTS.md ~/.claude/CLAUDE.md
# or into your project as CLAUDE.md
```

## Other tools

Paste `AGENTS.md` into custom instructions. Append a skill's body (skip YAML frontmatter) when you need web or library modules.

---

Manual install does not create `.agent-skills/manifest.json`. Lifecycle commands (`doctor`, `update`, `diff`, etc.) require a CLI installation. See [Quick start](quick-start.md).
