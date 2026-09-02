import { Command } from "commander";
import { comparePlannedToDisk, summarizeDiff } from "../install/compare-snapshot.js";
import { pathExists } from "../fs.js";
import { runDoctorChecks, suggestAction, summarizeChecks } from "../doctor/checks.js";
import {
  getManifestPath,
  readInstallManifest,
} from "../install/manifest.js";
import { planFromManifest } from "../install/run.js";
import { printStatusResult, setOutputOptions } from "../output.js";
import { getPackageVersion } from "../version.js";

export interface StatusOptions {
  cwd?: string;
  json?: boolean;
  noCache?: boolean;
}

export async function runStatus(options: StatusOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  setOutputOptions({ json: options.json ?? false, verbose: false });

  const manifestPath = getManifestPath(cwd);
  if (!(await pathExists(manifestPath))) {
    printStatusResult({ installed: false });
    return;
  }

  const manifest = await readInstallManifest(cwd);
  const checks = await runDoctorChecks({ cwd, manifest, noCache: options.noCache });
  const summary = summarizeChecks(checks);

  const { planned } = await planFromManifest(cwd, manifest, options.noCache);
  const diffSummary = summarizeDiff(await comparePlannedToDisk(planned));

  printStatusResult({
    installed: true,
    platform: manifest.platform,
    skills: manifest.skills,
    cliVersion: manifest.cliVersion,
    currentCliVersion: getPackageVersion(),
    installedAt: manifest.installedAt,
    doctor: summary,
    diff: diffSummary,
    suggestedAction: suggestAction(checks),
    manifestPath,
  });
}

export function registerStatusCommand(program: Command): void {
  program
    .command("status")
    .description("Summary of installation health and drift")
    .option("-C, --cwd <dir>", "Target project directory", process.cwd())
    .option("--json", "Machine-readable output")
    .option("--no-cache", "Bypass GitHub response cache")
    .action(async (opts) => {
      await runStatus({
        cwd: opts.cwd,
        json: opts.json,
        noCache: opts.noCache,
      });
    });
}
