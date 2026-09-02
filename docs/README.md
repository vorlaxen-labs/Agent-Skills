# Documentation

CLI and usage reference for [@vorlaxen-labs/agent-skills](https://www.npmjs.com/package/@vorlaxen-labs/agent-skills).

## Getting started

- [Quick start](quick-start.md) — install skills in your project in one command

## Commands

| Command | Description |
|---------|-------------|
| [`init`](commands/init.md) | Interactive or scripted first-time setup |
| [`list`](commands/list.md) | List available platforms and skills |
| [`doctor`](commands/doctor.md) | Check installation health and repair drift |
| [`update`](commands/update.md) | Refresh installed skills from snapshot or remote |
| [`add`](commands/add.md) | Add skills to an existing installation |
| [`remove`](commands/remove.md) | Remove selected skills |
| [`status`](commands/status.md) | Summary of health, drift, and suggested actions |
| [`diff`](commands/diff.md) | Compare installed files to the latest snapshot |
| [`uninstall`](commands/uninstall.md) | Remove all installed agent skill files |
| [`completion`](commands/completion.md) | Shell tab completion (bash, zsh, fish) |

## Concepts

- [Conflicts and manifest](conflicts-and-manifest.md) — merge strategies, manifest v2, per-path overrides
- [Remote source and cache](remote-and-cache.md) — bundled snapshot vs GitHub, response cache
- [Telemetry](telemetry.md) — anonymous usage events and opt-out
- [Manual install](manual-install.md) — copy files without the CLI

## Content reference

- [Included skills](included-skills.md) — engineering standards and Vorlaxen library modules
- [Release (maintainers)](release.md) — npm publish workflow
