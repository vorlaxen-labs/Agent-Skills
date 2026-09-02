import { checkbox, select } from "@inquirer/prompts";
import { Command, InvalidArgumentError } from "commander";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PLATFORMS, SKILLS, type Platform } from "../catalog.js";
import { detectConflicts } from "../conflict/detect.js";
import { resolvePolicy } from "../conflict/resolve.js";
import type {
  AppendOrder,
  ConflictPolicy,
  ConflictStrategy,
} from "../conflict/types.js";
import { executePlan } from "../install/executor.js";
import { buildManifest, writeInstallManifest } from "../install/manifest.js";
import { planInstall } from "../install/planners/index.js";
import type { InstallContext } from "../install/types.js";
import {
  logVerbose,
  platformLabel,
  printInitResult,
  setOutputOptions,
} from "../output.js";
import { resolveSource, type RemoteRef } from "../source/resolve.js";
import {
  parsePlatform,
  parseSkillIds,
  ValidationError,
} from "../validate.js";
import { getPackageVersion } from "../version.js";

export interface InitOptions {
  cwd?: string;
  platform?: string;
  skills?: string[];
  remote?: RemoteRef;
  yes?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  json?: boolean;
  onConflict?: ConflictStrategy;
  appendOrder?: AppendOrder;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const platformIds = PLATFORMS.map((p) => p.id).join(", ");
const skillIds = SKILLS.map((s) => s.id).join(", ");

function collectPaths(skillIds: string[]): string[] {
  const set = new Set<string>();
  for (const skill of SKILLS) {
    if (skillIds.includes(skill.id)) {
      for (const p of skill.paths) set.add(p);
    }
  }
  return [...set];
}

function parseConflictStrategy(value: string): ConflictStrategy {
  const normalized = value.trim() as ConflictStrategy;
  if (!["replace", "append", "skip"].includes(normalized)) {
    throw new InvalidArgumentError(
      `Invalid on-conflict mode "${value}". Use: replace, append, or skip.`,
    );
  }
  return normalized;
}

function parseAppendOrder(value: string): AppendOrder {
  const normalized = value.trim() as AppendOrder;
  if (!["existing-first", "vorlaxen-first"].includes(normalized)) {
    throw new InvalidArgumentError(
      `Invalid append-order "${value}". Use: existing-first or vorlaxen-first.`,
    );
  }
  return normalized;
}

export async function runInit(options: InitOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const packageVersion = getPackageVersion();
  const output = setOutputOptions({
    verbose: options.verbose ?? false,
    json: options.json ?? false,
  });

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
  const selectedIds: string[] = options.skills
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

  if (selectedIds.length === 0) {
    throw new Error("No skills selected. Aborting.");
  }

  if (!selectedIds.includes("global") && !output.json) {
    console.warn(
      "Warning: Global skill not selected — standards may be incomplete.",
    );
  }

  const paths = collectPaths(selectedIds);
  const bundledRoot = join(__dirname, "..", "..", "bundled");
  const source = resolveSource(options.remote, packageVersion, bundledRoot);

  logVerbose(`Fetching paths: ${paths.join(", ")}`);
  if (!output.json) console.log("\nFetching selected skills…");

  const files = await source.fetch(paths);
  const skills = SKILLS.filter((s) => selectedIds.includes(s.id));
  const ctx: InstallContext = { cwd, skills, files };

  const planned = planInstall(platform, ctx);
  logVerbose(`Planned ${planned.length} file write(s)`);

  const conflicts = await detectConflicts(planned);
  logVerbose(`Detected ${conflicts.length} conflict(s)`);

  const policy: ConflictPolicy | null = await resolvePolicy(conflicts, {
    yes: options.yes,
    onConflict: options.onConflict,
    appendOrder: options.appendOrder,
    interactive: !options.yes && !options.onConflict,
  });

  const result = await executePlan(planned, {
    dryRun: options.dryRun,
    policy,
  });

  let manifestPath: string | undefined;
  if (!options.dryRun && result.written.length > 0) {
    const manifest = buildManifest(
      platform,
      selectedIds,
      options.remote,
      policy,
      result,
    );
    manifestPath = await writeInstallManifest(cwd, manifest);
    logVerbose(`Wrote manifest to ${manifestPath}`);
  }

  printInitResult({
    platform,
    platformLabel: platformLabel(platform),
    result,
    conflictPolicy: policy,
    dryRun: options.dryRun ?? false,
    manifestPath,
  });
}

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Interactive setup — pick platform and skills")
    .option(
      "-p, --platform <platform>",
      `Platform (${platformIds})`,
      (value: string) => {
        try {
          return parsePlatform(value);
        } catch (err) {
          throw new InvalidArgumentError(
            err instanceof ValidationError ? err.message : String(err),
          );
        }
      },
    )
    .option(
      "-s, --skills <ids>",
      `Comma-separated skill ids (${skillIds})`,
      (value: string) => {
        try {
          return parseSkillIds(value.split(","));
        } catch (err) {
          throw new InvalidArgumentError(
            err instanceof ValidationError ? err.message : String(err),
          );
        }
      },
    )
    .option(
      "-r, --remote [ref]",
      "Fetch from GitHub: omit ref for package version tag, or pass e.g. main for latest",
    )
    .option("-y, --yes", "Skip prompts; use defaults (AGENTS.md platform defaults)")
    .option("-C, --cwd <dir>", "Target project directory", process.cwd())
    .option("--dry-run", "Show planned writes without changing files")
    .option("--verbose", "Verbose logging")
    .option("--json", "Machine-readable output")
    .option(
      "--on-conflict <mode>",
      "Conflict strategy: replace, append, or skip",
      parseConflictStrategy,
    )
    .option(
      "--append-order <order>",
      "When appending: existing-first or vorlaxen-first",
      parseAppendOrder,
    )
    .action(async (opts) => {
      let remote: boolean | string | undefined;
      if (opts.remote !== undefined) {
        remote = opts.remote === true ? true : opts.remote;
      }

      await runInit({
        cwd: opts.cwd,
        platform: opts.platform,
        skills: opts.skills,
        remote,
        yes: opts.yes,
        dryRun: opts.dryRun,
        verbose: opts.verbose,
        json: opts.json,
        onConflict: opts.onConflict,
        appendOrder: opts.appendOrder,
      });
    });
}
