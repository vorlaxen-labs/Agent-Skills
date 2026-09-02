# Quick start

Install Vorlaxen Agent Skills into your project:

```bash
npx @vorlaxen-labs/agent-skills init
```

The CLI walks you through platform selection (AGENTS.md, Cursor, Claude Code, Copilot) and the skills you need. Only selected files are fetched — no full repo clone.

## Non-interactive example

```bash
npx @vorlaxen-labs/agent-skills init --platform cursor --skills global,web-frontend,bar-js
```

## Preview without writing

```bash
npx @vorlaxen-labs/agent-skills init --dry-run --platform cursor --skills global
```

## List available options

```bash
npx @vorlaxen-labs/agent-skills list
npx @vorlaxen-labs/agent-skills list --json
```

Invalid `--platform` or `--skills` values are rejected with a list of available options.

## After install

| Goal | Command |
|------|---------|
| Check health | [`doctor`](commands/doctor.md) |
| Update skills | [`update`](commands/update.md) |
| Add more skills | [`add`](commands/add.md) |
| See drift | [`diff`](commands/diff.md) or [`status`](commands/status.md) |

See [init](commands/init.md) for all flags, [conflicts and manifest](conflicts-and-manifest.md) when agent files already exist, and [remote source and cache](remote-and-cache.md) to pull from GitHub instead of the bundled snapshot.
