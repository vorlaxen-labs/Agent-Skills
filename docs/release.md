# Release (maintainers)

Publish to npm via GitHub tag. Requires `NPM_TOKEN` repository secret.

```bash
git tag v1.3.0
git push origin v1.3.0
```

CI runs checks and tests, then `npm publish` and creates a GitHub Release.

## Repo layout

```
agent-skills/
├── AGENTS.md              # Universal — copy anywhere
├── package.json           # CLI package
├── src/                   # CLI source
│   ├── commands/          # init, list, doctor, update, diff, uninstall, add, remove, status, completion
│   ├── install/           # plan, execute, merge, run, manifest v2, skill-paths
│   ├── doctor/            # health checks, npm drift, fix
│   ├── source/            # bundled + GitHub fetch + cache
│   ├── conflict/          # detect + resolve + per-path policy
│   ├── diff/              # unified diff helper
│   └── telemetry/         # anonymous usage events
├── bundled/               # Snapshot shipped with npm package
├── rules/global.mdc       # Cursor always-on
├── skills/
│   ├── global/
│   ├── web/
│   └── libraries/
├── docs/                  # CLI documentation
├── CONTRIBUTING.md
├── SKILL-SPEC.md
└── LICENSE
```

See [CONTRIBUTING.md](../CONTRIBUTING.md) for sync checks and adding new modules.
