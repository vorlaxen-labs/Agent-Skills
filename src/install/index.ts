import type { SkillDefinition } from "../catalog.js";
import type { RemoteFile } from "../source/index.js";
import { indexFilesByPath } from "../source/index.js";
import { projectPath, writeTextFile } from "../utils/fs.js";
import { stripFrontmatter, withWatermark } from "../utils/watermark.js";

export interface InstallContext {
  cwd: string;
  skills: SkillDefinition[];
  files: RemoteFile[];
}

export interface InstallResult {
  written: string[];
}

function getContent(index: Map<string, string>, path: string): string | undefined {
  return index.get(path.replace(/\\/g, "/"));
}

function filesUnder(index: Map<string, string>, prefix: string): [string, string][] {
  const normalized = prefix.replace(/\\/g, "/");
  const out: [string, string][] = [];
  for (const [path, content] of index) {
    if (path.startsWith(`${normalized}/`)) {
      out.push([path.slice(normalized.length + 1), content]);
    }
  }
  return out;
}

/** Library skills need reference/ — copy full tree for non-Cursor platforms. */
async function installLibraryAssets(
  ctx: InstallContext,
  index: Map<string, string>,
  written: string[],
): Promise<void> {
  for (const skill of ctx.skills) {
    if (skill.category !== "library") continue;
    const prefix = skill.paths[0];
    const destDir = projectPath(ctx.cwd, ".agent-skills", skill.cursorSkillName);

    const skillMd = getContent(index, `${prefix}/SKILL.md`);
    if (skillMd) {
      const dest = projectPath(destDir, "SKILL.md");
      await writeTextFile(dest, withWatermark(skillMd));
      written.push(dest);
    }

    for (const [rel, content] of filesUnder(index, prefix)) {
      if (rel === "SKILL.md") continue;
      const dest = projectPath(destDir, rel);
      await writeTextFile(dest, withWatermark(content));
      written.push(dest);
    }
  }
}

/** AGENTS.md at project root; domain/library bodies appended as sections. */
export async function installAgentsMd(ctx: InstallContext): Promise<InstallResult> {
  const index = indexFilesByPath(ctx.files);
  const written: string[] = [];
  const parts: string[] = [];

  const globalBody = getContent(index, "AGENTS.md");
  if (globalBody) {
    parts.push(globalBody.trim());
  }

  for (const skill of ctx.skills) {
    if (skill.id === "global") continue;
    const skillMd = getContent(index, `${skill.paths[0]}/SKILL.md`);
    if (skillMd) {
      parts.push(stripFrontmatter(skillMd).trim());
    }
  }

  const dest = projectPath(ctx.cwd, "AGENTS.md");
  await writeTextFile(dest, withWatermark(parts.join("\n\n---\n\n")));
  written.push(dest);

  await installLibraryAssets(ctx, index, written);
  return { written };
}

/** Cursor: .cursor/rules/global.mdc + .cursor/skills/<name>/ */
export async function installCursor(ctx: InstallContext): Promise<InstallResult> {
  const index = indexFilesByPath(ctx.files);
  const written: string[] = [];

  for (const skill of ctx.skills) {
    if (skill.id === "global") {
      const rule = getContent(index, "rules/global.mdc");
      if (rule) {
        const dest = projectPath(ctx.cwd, ".cursor", "rules", "global.mdc");
        await writeTextFile(dest, withWatermark(rule));
        written.push(dest);
      }

      const globalSkill = getContent(index, "skills/global/SKILL.md");
      if (globalSkill) {
        const dest = projectPath(ctx.cwd, ".cursor", "skills", "global", "SKILL.md");
        await writeTextFile(dest, withWatermark(globalSkill));
        written.push(dest);
      }
      continue;
    }

    const prefix = skill.paths[0];
    const destDir = projectPath(ctx.cwd, ".cursor", "skills", skill.cursorSkillName);

    const skillMd = getContent(index, `${prefix}/SKILL.md`);
    if (skillMd) {
      const dest = projectPath(destDir, "SKILL.md");
      await writeTextFile(dest, withWatermark(skillMd));
      written.push(dest);
    }

    for (const [rel, content] of filesUnder(index, prefix)) {
      if (rel === "SKILL.md") continue;
      const dest = projectPath(destDir, rel);
      await writeTextFile(dest, withWatermark(content));
      written.push(dest);
    }
  }

  return { written };
}

/** Claude Code: CLAUDE.md + .claude/rules/*.md */
export async function installClaudeCode(ctx: InstallContext): Promise<InstallResult> {
  const index = indexFilesByPath(ctx.files);
  const written: string[] = [];
  const claudeParts: string[] = [];

  const globalBody = getContent(index, "AGENTS.md");
  if (globalBody) {
    claudeParts.push(globalBody.trim());
  }

  for (const skill of ctx.skills) {
    if (skill.id === "global") continue;

    const skillMd = getContent(index, `${skill.paths[0]}/SKILL.md`);
    if (!skillMd) continue;

    const body = stripFrontmatter(skillMd).trim();
    const dest = projectPath(ctx.cwd, ".claude", "rules", skill.claudeRuleName);
    await writeTextFile(dest, withWatermark(body));
    written.push(dest);
  }

  if (claudeParts.length > 0) {
    const dest = projectPath(ctx.cwd, "CLAUDE.md");
    await writeTextFile(dest, withWatermark(claudeParts.join("\n\n")));
    written.push(dest);
  }

  await installLibraryAssets(ctx, index, written);
  return { written };
}

/** GitHub Copilot: .github/copilot-instructions.md */
export async function installCopilot(ctx: InstallContext): Promise<InstallResult> {
  const index = indexFilesByPath(ctx.files);
  const written: string[] = [];
  const parts: string[] = [];

  const globalBody = getContent(index, "AGENTS.md");
  if (globalBody) {
    parts.push(globalBody.trim());
  }

  for (const skill of ctx.skills) {
    if (skill.id === "global") continue;
    const skillMd = getContent(index, `${skill.paths[0]}/SKILL.md`);
    if (skillMd) {
      parts.push(stripFrontmatter(skillMd).trim());
    }
  }

  const dest = projectPath(ctx.cwd, ".github", "copilot-instructions.md");
  await writeTextFile(dest, withWatermark(parts.join("\n\n---\n\n")));
  written.push(dest);

  await installLibraryAssets(ctx, index, written);
  return { written };
}
