import { checkbox, select } from "@inquirer/prompts";
import { statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PLATFORMS,
  SKILLS,
  type Platform,
  type SkillDefinition,
} from "../catalog.js";
import {
  installAgentsMd,
  installClaudeCode,
  installCopilot,
  installCursor,
} from "../install/index.js";
import {
  createBundledSource,
  createGitHubSource,
  type SkillSource,
} from "../source/index.js";

export interface InitOptions {
  cwd?: string;
  platform?: Platform;
  skills?: string[];
  remote?: boolean;
  yes?: boolean;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolveSource(remote: boolean): SkillSource {
  if (remote) {
    return createGitHubSource();
  }
  const bundledRoot = join(__dirname, "..", "..", "bundled");
  try {
    statSync(bundledRoot);
    return createBundledSource(bundledRoot);
  } catch {
    return createGitHubSource();
  }
}

function collectPaths(skillIds: string[]): string[] {
  const set = new Set<string>();
  for (const skill of SKILLS) {
    if (skillIds.includes(skill.id)) {
      for (const p of skill.paths) {
        set.add(p);
      }
    }
  }
  return [...set];
}

function selectedSkillDefs(skillIds: string[]): SkillDefinition[] {
  return SKILLS.filter((s) => skillIds.includes(s.id));
}

export async function runInit(options: InitOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();

  const platform: Platform =
    options.platform ??
    (options.yes
      ? "agents-md"
      : await select<Platform>({
          message: "Platform",
          choices: PLATFORMS.map((p) => ({ name: p.label, value: p.id })),
          default: "agents-md",
        }));

  const defaultIds = SKILLS.filter((s) => s.defaultSelected).map((s) => s.id);
  const skillIds =
    options.skills ??
    (options.yes
      ? defaultIds
      : await checkbox<string>({
          message: "Skills",
          choices: SKILLS.map((s) => ({
            name: s.label,
            value: s.id,
            checked: s.defaultSelected,
          })),
        }));

  if (skillIds.length === 0) {
    console.error("No skills selected. Aborting.");
    process.exitCode = 1;
    return;
  }

  if (!skillIds.includes("global")) {
    console.warn(
      "Warning: Global skill not selected — standards may be incomplete.",
    );
  }

  const paths = collectPaths(skillIds);
  const source = resolveSource(options.remote ?? false);

  console.log("\nFetching selected skills…");
  const files = await source.fetch(paths);
  const skills = selectedSkillDefs(skillIds);
  const ctx = { cwd, skills, files };

  let result;
  switch (platform) {
    case "agents-md":
      result = await installAgentsMd(ctx);
      break;
    case "cursor":
      result = await installCursor(ctx);
      break;
    case "claude-code":
      result = await installClaudeCode(ctx);
      break;
    case "copilot":
      result = await installCopilot(ctx);
      break;
  }

  console.log(`\nInstalled ${result.written.length} file(s) for ${PLATFORMS.find((p) => p.id === platform)?.label}:\n`);
  for (const file of result.written) {
    console.log(`  ✓ ${file}`);
  }
  console.log("");
}
