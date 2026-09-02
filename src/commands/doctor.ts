import { Command } from "commander";
import { SKILLS } from "../catalog.js";
import { pathExists, readTextFile } from "../fs.js";
import {
  compareVersions,
  getManifestPath,
  ManifestError,
  readInstallManifest,
  unknownSkillIds,
} from "../install/manifest.js";
import {
  logVerbose,
  printDoctorResult,
  setOutputOptions,
  type DoctorCheck,
} from "../output.js";
import { WATERMARK } from "../markdown.js";
import { getPackageVersion } from "../version.js";

export interface DoctorOptions {
  cwd?: string;
  verbose?: boolean;
  json?: boolean;
}

export async function runDoctor(options: DoctorOptions = {}): Promise<number> {
  const cwd = options.cwd ?? process.cwd();
  setOutputOptions({ verbose: options.verbose ?? false, json: options.json ?? false });

  const manifestPath = getManifestPath(cwd);
  if (!(await pathExists(manifestPath))) {
    printDoctorResult({ manifestFound: false, checks: [] });
    return 1;
  }

  let manifest;
  try {
    manifest = await readInstallManifest(cwd);
  } catch (err) {
    if (err instanceof ManifestError) {
      printDoctorResult({
        manifestFound: false,
        checks: [{ name: "manifest", status: "error", message: err.message }],
      });
      return 1;
    }
    throw err;
  }

  const checks: DoctorCheck[] = [];
  const currentVersion = getPackageVersion();

  if (compareVersions(currentVersion, manifest.cliVersion) > 0) {
    checks.push({
      name: "cli-version",
      status: "warn",
      message: `Update available (${manifest.cliVersion} → ${currentVersion}). Run \`agent-skills update\`.`,
    });
  } else {
    checks.push({
      name: "cli-version",
      status: "ok",
      message: `CLI ${currentVersion} matches or exceeds installed ${manifest.cliVersion}`,
    });
  }

  const missingFiles: string[] = [];
  const modifiedFiles: string[] = [];
  for (const file of manifest.written) {
    if (!(await pathExists(file))) {
      missingFiles.push(file);
      continue;
    }
    const content = await readTextFile(file);
    if (!content.includes(WATERMARK)) {
      modifiedFiles.push(file);
    }
  }

  if (missingFiles.length === 0) {
    checks.push({
      name: "files",
      status: "ok",
      message: `All ${manifest.written.length} installed file(s) present`,
    });
  } else {
    checks.push({
      name: "files",
      status: "error",
      message: `${missingFiles.length} missing file(s): ${missingFiles.join(", ")}`,
    });
  }

  if (modifiedFiles.length === 0) {
    checks.push({
      name: "watermark",
      status: "ok",
      message: "Installed files intact",
    });
  } else {
    checks.push({
      name: "watermark",
      status: "warn",
      message: `${modifiedFiles.length} file(s) modified locally (no watermark)`,
    });
  }

  const unknown = unknownSkillIds(manifest.skills);
  if (unknown.length === 0) {
    checks.push({
      name: "skills",
      status: "ok",
      message: `Skills valid: ${manifest.skills.join(", ")}`,
    });
  } else {
    checks.push({
      name: "skills",
      status: "warn",
      message: `Unknown skill ids in manifest: ${unknown.join(", ")}`,
    });
  }

  for (const skillId of manifest.skills) {
    const def = SKILLS.find((s) => s.id === skillId);
    if (def?.npmVersion) {
      logVerbose(`Library ${skillId} pinned at npm ${def.npmVersion}`);
    }
  }

  printDoctorResult({ manifestFound: true, checks, manifestPath });

  const hasError = checks.some((c) => c.status === "error");
  return hasError ? 1 : 0;
}

export function registerDoctorCommand(program: Command): void {
  program
    .command("doctor")
    .description("Check installed agent skills health")
    .option("-C, --cwd <dir>", "Target project directory", process.cwd())
    .option("--verbose", "Verbose logging")
    .option("--json", "Machine-readable output")
    .action(async (opts) => {
      const code = await runDoctor({
        cwd: opts.cwd,
        verbose: opts.verbose,
        json: opts.json,
      });
      if (code !== 0) process.exitCode = code;
    });
}
