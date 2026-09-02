# `add`

Add skills to an existing installation without re-running full init.

```bash
npx @vorlaxen-labs/agent-skills add <skill-ids...>
```

Requires an existing `.agent-skills/manifest.json`. Uses the manifest's conflict policy and remote source settings.

## Options

| Flag | Description |
|------|-------------|
| `-C, --cwd <dir>` | Target project directory |
| `-y, --yes` | Skip prompts |
| `--dry-run` | Show planned writes without changing files |
| `--verbose` | Verbose logging |
| `--json` | Machine-readable output |
| `--no-cache` | Bypass GitHub response cache |

## Example

```bash
npx @vorlaxen-labs/agent-skills add web-frontend bar-js
```

See also [`remove`](remove.md).
