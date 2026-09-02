import { pathExists, readTextFile } from "../fs.js";
import { stripWatermark } from "../markdown.js";
import type { PlannedWrite } from "../install/planned.js";

export async function detectConflicts(
  planned: PlannedWrite[],
): Promise<string[]> {
  const conflicts: string[] = [];
  for (const write of planned) {
    if (!(await pathExists(write.dest))) continue;

    const existing = stripWatermark(await readTextFile(write.dest));
    const incoming = stripWatermark(write.content);
    if (existing === incoming) continue;

    conflicts.push(write.dest);
  }
  return conflicts;
}
