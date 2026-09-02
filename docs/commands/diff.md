# `diff`

Show differences between installed files and the latest snapshot (bundled or remote per manifest).

```bash
npx @vorlaxen-labs/agent-skills diff
```

## Options

| Flag | Description |
|------|-------------|
| `-C, --cwd <dir>` | Target project directory |
| `--verbose` | Verbose logging |
| `--json` | Machine-readable output |
| `--no-cache` | Bypass GitHub response cache |
| `--check` | Exit 1 if any file differs from snapshot (CI-friendly) |

## Examples

```bash
npx @vorlaxen-labs/agent-skills diff --json
npx @vorlaxen-labs/agent-skills diff --check
```

Use `--check` in CI to fail when local agent files drift from the expected snapshot.
