import { confirm } from "@inquirer/prompts";
import { Command } from "commander";
import { SKILLS } from "../catalog.js";
import { deleteFile, pathExists, removeEmptyDir } from "../fs.js";
import {
  getManifestPath,
  readInstallManifest,
  removeSkillsFromManifest,
  writeInstallManifest,
} from "../install/manifest.js";
import { removePaths } from "../install/remove.js";
import { rebuildAgentRootFile } from "../install/run.js";
import {
  agentRootPath,
  pathsForSkillRemoval,
} from "../install/skill-paths.js";
import { printUninstallResult, setOutputOptions } from "../output.js";
import { parseSkillIds } from "../validate.js";

export interface RemoveOptions {
  cwd?: string;
  skillIds: string[];
  yes?: boolean;
  force?: boolean;
  dryRun?: boolean;
  json?: boolean;
  verbose?: boolean;
}

export async function runRemove(options: RemoveOptions): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  setOutputOptions({
    verbose: options.verbose ?? false,
    json: options.json ?? false,
  });

  const manifest = await readInstallManifest(cwd);
  const skillIds = options.skillIds.filter((id) => manifest.skills.includes(id));

  if (skillIds.length === 0) {
    console.log("\nNone of the requested skills are installed.\n");
    return;
  }

  const paths = pathsForSkillRemoval(manifest, skillIds);
  const needsAgentRebuild =
    skillIds.some((id) => {
      const skill = SKILLS.find((s) => s.id === id);
      return skill?.category === "domain";
    }) &&
    (manifest.platform === "agents-md" ||
      manifest.platform === "claude-code" ||
      manifest.platform === "copilot");

  if (!options.yes && !options.dryRun) {
    const proceed = await confirm({
      message: `Remove ${skillIds.join(", ")} from installation?`,
      default: false,
    });
    if (!proceed) {
      console.log("\nRemove cancelled.\n");
      return;
    }
  }

  const { removed, skipped } = await removePaths(paths, {
    force: options.force,
    dryRun: options.dryRun,
  });

  if (!options.dryRun) {
    const updatedManifest = removeSkillsFromManifest(manifest, skillIds, removed);
    await writeInstallManifest(cwd, updatedManifest);

    if (needsAgentRebuild && agentRootPath(cwd, manifest.platform)) {
      const rebuildResult = await rebuildAgentRootFile(cwd, updatedManifest);
      if (rebuildResult.written.length > 0) {
        const next = {
          ...updatedManifest,
          written: [
            ...new Set([
              ...updatedManifest.written.filter(
                (p) => p !== agentRootPath(cwd, manifest.platform),
              ),
              ...rebuildResult.written,
            ]),
          ],
        };
        await writeInstallManifest(cwd, next);
      }
    }
  }

  printUninstallResult({ removed, skipped, dryRun: options.dryRun ?? false });
}

export function registerRemoveCommand(program: Command): void {
  program
    .command("remove")
    .description("Remove skills from an existing installation")
    .argument("<skill-ids...>", "Skill ids to remove")
    .option("-C, --cwd <dir>", "Target project directory", process.cwd())
    .option("-y, --yes", "Skip confirmation prompt")
    .option("--force", "Remove files even without Vorlaxen watermark")
    .option("--dry-run", "Show what would be removed")
    .option("--json", "Machine-readable output")
    .option("--verbose", "Verbose logging")
    .action(async (skillIds: string[], opts) => {
      await runRemove({
        cwd: opts.cwd,
        skillIds: parseSkillIds(skillIds),
        yes: opts.yes,
        force: opts.force,
        dryRun: opts.dryRun,
        json: opts.json,
        verbose: opts.verbose,
      });
    });
}
