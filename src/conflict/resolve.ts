import { select } from "@inquirer/prompts";
import { defaultPolicyOverrides } from "./path-policy.js";
import type {
  AppendOrder,
  ConflictPolicyV2,
  ConflictResolveOptions,
  ConflictStrategy,
} from "./types.js";

const DEFAULT_YES_POLICY: ConflictPolicyV2 = {
  default: "append",
  appendOrder: "vorlaxen-first",
  overrides: defaultPolicyOverrides(),
};

export async function resolvePolicy(
  conflicts: string[],
  options: ConflictResolveOptions,
): Promise<ConflictPolicyV2 | null> {
  if (conflicts.length === 0) {
    return null;
  }

  if (options.onConflict && options.onConflict !== "inherit") {
    return {
      default: options.onConflict,
      appendOrder:
        options.onConflict === "append"
          ? (options.appendOrder ?? "vorlaxen-first")
          : undefined,
      overrides:
        options.onConflict === "append"
          ? { ...defaultPolicyOverrides(), ...options.conflictOverrides }
          : { ...options.conflictOverrides },
    };
  }

  if (options.yes) {
    return {
      default: DEFAULT_YES_POLICY.default,
      appendOrder: options.appendOrder ?? DEFAULT_YES_POLICY.appendOrder,
      overrides: { ...defaultPolicyOverrides(), ...options.conflictOverrides },
    };
  }

  if (options.interactive === false) {
    return {
      ...DEFAULT_YES_POLICY,
      overrides: { ...defaultPolicyOverrides(), ...options.conflictOverrides },
    };
  }

  console.log("\nThe following files already exist:\n");
  for (const file of conflicts) {
    console.log(`  • ${file}`);
  }
  console.log("");

  const strategy = await select({
    message: "What should we do with existing agent files?",
    choices: [
      { name: "Replace with Vorlaxen content", value: "replace" as const },
      { name: "Append to existing content", value: "append" as const },
      { name: "Skip (leave unchanged)", value: "skip" as const },
    ],
  });

  if (strategy !== "append") {
    return {
      default: strategy,
      overrides: defaultPolicyOverrides(),
    };
  }

  const appendOrder = await select({
    message: "Which content should the agent prioritize?",
    choices: [
      {
        name: "Vorlaxen standards (recommended for new installs)",
        value: "vorlaxen-first" as const,
      },
      { name: "Your existing content", value: "existing-first" as const },
    ],
  });

  return {
    default: strategy,
    appendOrder,
    overrides: defaultPolicyOverrides(),
  };
}

export function policyFromManifest(
  manifestPolicy: ConflictPolicyV2 | null,
  override?: ConflictStrategy,
  appendOrder?: AppendOrder,
): ConflictPolicyV2 | null {
  if (override === "inherit") {
    return manifestPolicy;
  }
  if (override) {
    return {
      default: override,
      appendOrder: override === "append" ? appendOrder : undefined,
      overrides: defaultPolicyOverrides(),
    };
  }
  return manifestPolicy;
}
