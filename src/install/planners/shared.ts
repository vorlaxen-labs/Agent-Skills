import { projectPath } from "../../fs.js";
import { stripFrontmatter } from "../../markdown.js";
import { indexFilesByPath } from "../../source/types.js";
import type { InstallContext, PlannedWrite } from "../types.js";

export function getContent(
  index: Map<string, string>,
  path: string,
): string | undefined {
  return index.get(path.replace(/\\/g, "/"));
}

export function filesUnder(
  index: Map<string, string>,
  prefix: string,
): [string, string][] {
  const normalized = prefix.replace(/\\/g, "/");
  const out: [string, string][] = [];
  for (const [path, content] of index) {
    if (path.startsWith(`${normalized}/`)) {
      out.push([path.slice(normalized.length + 1), content]);
    }
  }
  return out;
}

export function planLibraryAssets(ctx: InstallContext): PlannedWrite[] {
  const index = indexFilesByPath(ctx.files);
  const planned: PlannedWrite[] = [];

  for (const skill of ctx.skills) {
    if (skill.category !== "library") continue;
    const prefix = skill.paths[0];
    const destDir = projectPath(ctx.cwd, ".agent-skills", skill.cursorSkillName);

    const skillMd = getContent(index, `${prefix}/SKILL.md`);
    if (skillMd) {
      planned.push({ dest: projectPath(destDir, "SKILL.md"), content: skillMd });
    }

    for (const [rel, content] of filesUnder(index, prefix)) {
      if (rel === "SKILL.md") continue;
      planned.push({ dest: projectPath(destDir, rel), content });
    }
  }

  return planned;
}

export function planSkillTree(
  ctx: InstallContext,
  prefix: string,
  destDir: string,
): PlannedWrite[] {
  const index = indexFilesByPath(ctx.files);
  const planned: PlannedWrite[] = [];

  const skillMd = getContent(index, `${prefix}/SKILL.md`);
  if (skillMd) {
    planned.push({ dest: projectPath(destDir, "SKILL.md"), content: skillMd });
  }

  for (const [rel, content] of filesUnder(index, prefix)) {
    if (rel === "SKILL.md") continue;
    planned.push({ dest: projectPath(destDir, rel), content });
  }

  return planned;
}

export { stripFrontmatter };
