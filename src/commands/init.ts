import { checkbox, select } from "@inquirer/prompts";
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
  type InstallContext,
  type InstallResult,
} from "../install/index.js";
import { resolveSource, type RemoteRef } from "../source/resolve.js";
import { getPackageVersion } from "../version.js";
import { parsePlatform, parseSkillIds } from "../validate.js";

export interface InitOptions {
  cwd?: string;
  platform?: string;
  skills?: string[];
  remote?: RemoteRef;
  yes?: boolean;
}

const __dirname = dirname(fileURLToPath(import.meta.url));

const INSTALLERS: Record<
  Platform,
  (ctx: InstallContext) => Promise<InstallResult>
> = {
  "agents-md": installAgentsMd,
  cursor: installCursor,
  "claude-code": installClaudeCode,
  copilot: installCopilot,
};

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
  const packageVersion = getPackageVersion();

  const platform: Platform = options.platform
    ? parsePlatform(options.platform)
    : options.yes
      ? "agents-md"
      : await select<Platform>({
          message: "Platform",
          choices: PLATFORMS.map((p) => ({ name: p.label, value: p.id })),
          default: "agents-md",
        });

  const defaultIds = SKILLS.filter((s) => s.defaultSelected).map((s) => s.id);
  const skillIds: string[] = options.skills
    ? parseSkillIds(options.skills)
    : options.yes
      ? defaultIds
      : await checkbox<string>({
          message: "Skills",
          choices: SKILLS.map((s) => ({
            name: s.label,
            value: s.id,
            checked: s.defaultSelected,
          })),
        });

  if (skillIds.length === 0) {
    throw new Error("No skills selected. Aborting.");
  }

  if (!skillIds.includes("global")) {
    console.warn(
      "Warning: Global skill not selected — standards may be incomplete.",
    );
  }

  const paths = collectPaths(skillIds);
  const bundledRoot = join(__dirname, "..", "..", "bundled");
  const source = resolveSource(options.remote, packageVersion, bundledRoot);

  console.log("\nFetching selected skills…");
  const files = await source.fetch(paths);
  const skills = selectedSkillDefs(skillIds);
  const ctx: InstallContext = { cwd, skills, files };

  const result = await INSTALLERS[platform](ctx);

  console.log(
    `\nInstalled ${result.written.length} file(s) for ${PLATFORMS.find((p) => p.id === platform)?.label}:\n`,
  );
  for (const file of result.written) {
    console.log(`  ✓ ${file}`);
  }
  console.log("");
}
