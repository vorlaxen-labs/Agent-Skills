import { Command } from "commander";
import { registerSharedInstallFlags } from "../cli-options.js";
import { readInstallManifest } from "../install/manifest.js";
import { runInstall } from "../install/run.js";
import {
  platformLabel,
  printInitResult,
  setOutputOptions,
} from "../output.js";
import { parseSkillIds } from "../validate.js";

export interface AddOptions {
  cwd?: string;
  skillIds: string[];
  yes?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  json?: boolean;
  noCache?: boolean;
}

export async function runAdd(options: AddOptions): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  setOutputOptions({
    verbose: options.verbose ?? false,
    json: options.json ?? false,
  });

  const manifest = await readInstallManifest(cwd);
  const newIds = options.skillIds.filter((id) => !manifest.skills.includes(id));

  if (newIds.length === 0) {
    console.log("\nAll requested skills are already installed.\n");
    return;
  }

  const mergedSkillIds = [...new Set([...manifest.skills, ...newIds])];

  const installResult = await runInstall({
    cwd,
    platform: manifest.platform,
    skillIds: mergedSkillIds,
    remote: manifest.remote ?? undefined,
    dryRun: options.dryRun,
    yes: options.yes ?? true,
    mergeManifest: true,
    installSkillIds: newIds,
    manifestPolicy: manifest.conflictPolicy,
    noCache: options.noCache,
    showFetchMessage: false,
  });

  printInitResult({
    platform: installResult.platform,
    platformLabel: platformLabel(installResult.platform),
    result: installResult.result,
    conflictPolicy: installResult.conflictPolicy,
    dryRun: options.dryRun ?? false,
    manifestPath: installResult.manifestPath,
  });
}

export function registerAddCommand(program: Command): void {
  program
    .command("add")
    .description("Add skills to an existing installation")
    .argument("<skill-ids...>", "Skill ids to add")
    .option("-C, --cwd <dir>", "Target project directory", process.cwd())
    .option("-y, --yes", "Skip prompts")
    .option("--dry-run", "Show planned writes without changing files")
    .option("--verbose", "Verbose logging")
    .option("--json", "Machine-readable output")
    .option("--no-cache", "Bypass GitHub response cache")
    .action(async (skillIds: string[], opts) => {
      await runAdd({
        cwd: opts.cwd,
        skillIds: parseSkillIds(skillIds),
        yes: opts.yes,
        dryRun: opts.dryRun,
        verbose: opts.verbose,
        json: opts.json,
        noCache: opts.noCache,
      });
    });
}
