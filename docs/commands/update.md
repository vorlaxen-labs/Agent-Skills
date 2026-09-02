# `update`

Update installed skills using the configuration stored in `.agent-skills/manifest.json`.

```bash
npx @vorlaxen-labs/agent-skills update
```

Inherits conflict policy from the manifest unless overridden with `--on-conflict`.

## Options

| Flag | Description |
|------|-------------|
| `-r, --remote [ref]` | Override remote source (default: from manifest or bundled snapshot) |
| `-y, --yes` | Non-interactive (default: true) |
| `-C, --cwd <dir>` | Target project directory |
| `--dry-run` | Show planned writes without changing files |
| `--verbose` | Verbose logging |
| `--json` | Machine-readable output |
| `--on-conflict <mode>` | `replace`, `append`, `skip`, or `inherit` |
| `--append-order <order>` | `existing-first` or `vorlaxen-first` |
| `--on-conflict-for <glob=mode>` | Per-path conflict override (repeatable) |
| `--no-cache` | Bypass GitHub response cache |

## Examples

```bash
npx @vorlaxen-labs/agent-skills update --remote=main
npx @vorlaxen-labs/agent-skills update --on-conflict inherit
npx @vorlaxen-labs/agent-skills update --dry-run
```
