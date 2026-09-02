import { InvalidArgumentError, type Command } from "commander";
import type { AppendOrder, ConflictStrategy } from "./conflict/types.js";

export function parseConflictStrategy(value: string): ConflictStrategy {
  const normalized = value.trim() as ConflictStrategy;
  if (!["replace", "append", "skip"].includes(normalized)) {
    throw new InvalidArgumentError(
      `Invalid on-conflict mode "${value}". Use: replace, append, or skip.`,
    );
  }
  return normalized;
}

export function parseAppendOrder(value: string): AppendOrder {
  const normalized = value.trim() as AppendOrder;
  if (!["existing-first", "vorlaxen-first"].includes(normalized)) {
    throw new InvalidArgumentError(
      `Invalid append-order "${value}". Use: existing-first or vorlaxen-first.`,
    );
  }
  return normalized;
}

export interface SharedCommandFlags {
  cwd?: string;
  dryRun?: boolean;
  verbose?: boolean;
  json?: boolean;
  yes?: boolean;
  onConflict?: ConflictStrategy;
  appendOrder?: AppendOrder;
  noCache?: boolean;
}

export function registerSharedInstallFlags(command: Command): void {
  command.option("-C, --cwd <dir>", "Target project directory", process.cwd());
  command.option("--dry-run", "Show planned writes without changing files");
  command.option("--verbose", "Verbose logging");
  command.option("--json", "Machine-readable output");
  command.option(
    "--on-conflict <mode>",
    "Conflict strategy: replace, append, or skip",
    parseConflictStrategy,
  );
  command.option(
    "--append-order <order>",
    "When appending: existing-first or vorlaxen-first",
    parseAppendOrder,
  );
  command.option("--no-cache", "Bypass GitHub response cache");
}
