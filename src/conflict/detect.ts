import { pathExists } from "../fs.js";
import type { PlannedWrite } from "../install/planned.js";

export async function detectConflicts(
  planned: PlannedWrite[],
): Promise<string[]> {
  const conflicts: string[] = [];
  for (const write of planned) {
    if (await pathExists(write.dest)) {
      conflicts.push(write.dest);
    }
  }
  return conflicts;
}
