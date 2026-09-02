import type { ConflictPolicy } from "../conflict/types.js";
import { pathExists, readTextFile, writeTextFile } from "../fs.js";
import { withWatermark } from "../markdown.js";
import { mergeContent } from "./merge.js";
import type { InstallResult, PlannedAction, PlannedWrite } from "./types.js";

export interface ExecuteOptions {
  dryRun?: boolean;
  policy?: ConflictPolicy | null;
}

export async function executePlan(
  planned: PlannedWrite[],
  options: ExecuteOptions = {},
): Promise<InstallResult> {
  const written: string[] = [];
  const skipped: string[] = [];
  const plannedActions: PlannedAction[] = [];

  for (const write of planned) {
    const exists = await pathExists(write.dest);
    const action = resolveAction(exists, options.policy);
    plannedActions.push({ dest: write.dest, action });

    if (action === "skip") {
      skipped.push(write.dest);
      continue;
    }

    if (options.dryRun) {
      if (action === "create" || action === "replace" || action === "append") {
        written.push(write.dest);
      }
      continue;
    }

    let finalContent = write.content;

    if (exists && action === "append") {
      const existing = await readTextFile(write.dest);
      const order = options.policy?.appendOrder ?? "vorlaxen-first";
      finalContent = mergeContent(existing, write.content, order);
    }

    await writeTextFile(write.dest, withWatermark(finalContent));
    written.push(write.dest);
  }

  return {
    written,
    skipped,
    planned: options.dryRun ? plannedActions : undefined,
  };
}

function resolveAction(
  exists: boolean,
  policy: ConflictPolicy | null | undefined,
): PlannedAction["action"] {
  if (!exists) {
    return "create";
  }

  const strategy = policy?.strategy ?? "replace";

  switch (strategy) {
    case "skip":
      return "skip";
    case "append":
      return "append";
    case "replace":
      return "replace";
  }
}
