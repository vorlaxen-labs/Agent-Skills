# `uninstall`

Remove all installed agent skill files and delete `.agent-skills/manifest.json`.

```bash
npx @vorlaxen-labs/agent-skills uninstall
```

## Options

| Flag | Description |
|------|-------------|
| `-C, --cwd <dir>` | Target project directory |
| `-y, --yes` | Skip confirmation prompt |
| `--force` | Remove files even without Vorlaxen watermark |
| `--dry-run` | Show what would be removed |
| `--json` | Machine-readable output |
| `--verbose` | Verbose logging |

## Examples

```bash
npx @vorlaxen-labs/agent-skills uninstall --yes
npx @vorlaxen-labs/agent-skills uninstall --force
```

To remove individual skills while keeping the installation, use [`remove`](remove.md) instead.
