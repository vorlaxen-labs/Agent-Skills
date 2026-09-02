# `status`

Quick summary of installation health, drift, CLI version, and suggested next action.

```bash
npx @vorlaxen-labs/agent-skills status
npx @vorlaxen-labs/agent-skills status --json
```

## Options

| Flag | Description |
|------|-------------|
| `-C, --cwd <dir>` | Target project directory |
| `--json` | Machine-readable output |
| `--no-cache` | Bypass GitHub response cache |

Combines doctor checks and diff summary into a single report. See also [`doctor`](doctor.md) and [`diff`](diff.md).
