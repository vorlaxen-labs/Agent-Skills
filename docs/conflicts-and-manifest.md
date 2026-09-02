# Conflicts and manifest

When agent configuration files already exist (`AGENTS.md`, `.cursor/rules/*`, Claude rules, etc.), the CLI detects conflicts before writing.

## Interactive choices

During `init`, you can choose:

- **Replace** — overwrite with Vorlaxen content
- **Append** — merge with existing content, then choose which content is primary for the agent
- **Skip** — leave your files unchanged

## Non-interactive defaults

With `--yes`, the default is **append** with Vorlaxen content first (`vorlaxen-first`).

Override globally:

```bash
npx @vorlaxen-labs/agent-skills init --on-conflict replace --platform agents-md --skills global
npx @vorlaxen-labs/agent-skills init --on-conflict skip --platform agents-md --skills global
npx @vorlaxen-labs/agent-skills init --on-conflict append --append-order existing-first --yes
```

Per-path override (repeatable):

```bash
npx @vorlaxen-labs/agent-skills init --on-conflict append --on-conflict-for AGENTS.md=append --yes
```

## Conflict modes

| Mode | Behavior |
|------|----------|
| `replace` | Overwrite existing file with Vorlaxen content |
| `append` | Merge existing and Vorlaxen content |
| `skip` | Do not modify the existing file |
| `inherit` | Use policy stored in manifest (used by `update`) |

## Append order

When appending:

| Order | Result |
|-------|--------|
| `vorlaxen-first` | Vorlaxen content appears before existing content |
| `existing-first` | Your content appears before Vorlaxen content |

## Manifest v2

After install, the CLI writes `.agent-skills/manifest.json` with:

- Selected platform and skills
- Remote source settings (if used)
- Conflict policy and per-path overrides
- `writtenBySkill` — which skill owns each path
- `contentHashes` — checksums for drift detection
- CLI version and install timestamp

`update`, `add`, `remove`, `doctor`, `diff`, and `status` read this manifest. `update` inherits conflict policy unless you pass `--on-conflict`.
