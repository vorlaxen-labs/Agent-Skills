# Telemetry

The CLI sends anonymous usage events by default when a command completes.

## What is collected

- Command name, duration, exit code
- For install commands: platform, skill count, remote/dry-run flags
- CLI name and version
- Node major version, OS, architecture, Linux distribution (when detectable)
- Anonymous session id (random UUID per process — not persisted to disk)

## What is not collected

- File paths
- Usernames
- Project names or identifiers
- File contents

## Opt out

Disable for a single run:

```bash
agent-skills --no-telemetry init
VORLAXEN_TELEMETRY=0 agent-skills init
```

Accepted env values: `0`, `false`, `no`.

Nothing is stored on disk — opt-out applies only to that invocation. There is no persistent opt-in/opt-out file.
