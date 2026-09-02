import { relative } from "node:path";
import type { ConflictPolicyV2, ConflictStrategy } from "./types.js";

const AGENT_ROOT_FILES = new Set([
  "AGENTS.md",
  "CLAUDE.md",
  ".github/copilot-instructions.md",
]);

export function defaultPolicyOverrides(): Record<string, ConflictStrategy> {
  return {
    "AGENTS.md": "append",
    "CLAUDE.md": "append",
    ".github/copilot-instructions.md": "append",
    ".cursor/rules/*": "replace",
    ".claude/rules/*": "replace",
    ".cursor/skills/*": "replace",
    ".agent-skills/*": "replace",
  };
}

export function normalizePolicyV2(
  policy: ConflictPolicyV2 | { strategy: ConflictStrategy; appendOrder?: ConflictPolicyV2["appendOrder"] } | null,
): ConflictPolicyV2 | null {
  if (!policy) return null;
  if ("default" in policy) {
    return {
      default: policy.default,
      appendOrder: policy.appendOrder,
      overrides:
        policy.default === "append"
          ? { ...defaultPolicyOverrides(), ...policy.overrides }
          : { ...(policy.overrides ?? {}) },
    };
  }
  return {
    default: policy.strategy,
    appendOrder: policy.appendOrder,
    overrides: defaultPolicyOverrides(),
  };
}

function matchGlob(pattern: string, relPath: string): boolean {
  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -1);
    return relPath.startsWith(prefix);
  }
  return relPath === pattern;
}

export function resolveStrategyForPath(
  dest: string,
  cwd: string,
  policy: ConflictPolicyV2 | null | undefined,
): ConflictStrategy {
  const fallback = policy?.default ?? "replace";
  if (!policy?.overrides) return fallback;

  const rel = relative(cwd, dest).replace(/\\/g, "/");
  for (const [pattern, strategy] of Object.entries(policy.overrides)) {
    if (matchGlob(pattern, rel)) return strategy;
  }
  return fallback;
}
