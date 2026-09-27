# kill-ai-slop

Detect and remove **AI slop** — generic machine-default UI and copy — from web
projects. Field guide: [killaislop.com](https://killaislop.com).

Ships in [Vorlaxen Agent Skills](https://github.com/vorlaxen-labs/agent-skills) as
an optional **audit** module (`kill-ai-slop`, `skills/audits/`). Scanner and references are adapted
from [yetone/kill-ai-slop](https://github.com/yetone/kill-ai-slop) (Apache-2.0).

## Install (Vorlaxen CLI)

```bash
npx @vorlaxen-labs/agent-skills add kill-ai-slop
# or during init — select "Kill AI Slop" in the skill list
```

Pair with `global` and usually `web-frontend` for stack and scope boundaries.

## Scanner (no agent required)

From the installed skill directory (where `SKILL.md` lives):

```bash
node scripts/scan.mjs path/to/your-app          # grouped report
node scripts/scan.mjs path/to/your-app --json     # machine-readable
```

Filters: `--only=01,06`, `--skip=19`, `--exclude=legacy`, `--rules=extra.mjs`.
Suppress intentional hits with `deslop-ignore` comments (see `SKILL.md`).

## Layout

| Path | Role |
|------|------|
| `SKILL.md` | Workflow, principles, guardrails |
| `references/taxonomy.md` | 35 tells — what, why, fix |
| `references/detection.md` | Patterns and false positives |
| `references/fixes.md` | Before → after remediation |
| `scripts/scan.mjs` | Dependency-free scanner |
| `scripts/rules.ru.mjs` | Example `--rules` module (Russian copy tells) |

Agent workflow: read `SKILL.md`, scan, triage, report, then fix only what the user confirms.
