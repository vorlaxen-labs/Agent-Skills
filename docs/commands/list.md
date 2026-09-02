# `list`

List available platforms and skills.

```bash
npx @vorlaxen-labs/agent-skills list
npx @vorlaxen-labs/agent-skills list --json
```

## Options

| Flag | Description |
|------|-------------|
| `--json` | Machine-readable output |

## Platforms

| Id | Label |
|----|-------|
| `agents-md` | AGENTS.md |
| `cursor` | Cursor |
| `claude-code` | Claude Code |
| `copilot` | Copilot |

## Skills

| Id | Category | Default on init |
|----|----------|-----------------|
| `global` | Standard | Yes |
| `web-frontend` | Domain | Yes |
| `web-backend` | Domain | Yes |
| `bar-js` | Library | No |
| `huk-js` | Library | No |
| `kargomucuz-sdk` | Library | No |

See [Included skills](../included-skills.md) for what each module contains.
