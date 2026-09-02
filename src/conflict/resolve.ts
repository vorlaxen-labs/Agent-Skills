import { select } from "@inquirer/prompts";
import type { ConflictPolicy, ConflictResolveOptions } from "./types.js";

const DEFAULT_YES_POLICY: ConflictPolicy = {
  strategy: "append",
  appendOrder: "vorlaxen-first",
};

export async function resolvePolicy(
  conflicts: string[],
  options: ConflictResolveOptions,
): Promise<ConflictPolicy | null> {
  if (conflicts.length === 0) {
    return null;
  }

  if (options.onConflict) {
    return {
      strategy: options.onConflict,
      appendOrder:
        options.onConflict === "append"
          ? (options.appendOrder ?? "vorlaxen-first")
          : undefined,
    };
  }

  if (options.yes) {
    return {
      strategy: DEFAULT_YES_POLICY.strategy,
      appendOrder: options.appendOrder ?? DEFAULT_YES_POLICY.appendOrder,
    };
  }

  if (options.interactive === false) {
    return DEFAULT_YES_POLICY;
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
    return { strategy };
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

  return { strategy, appendOrder };
}
