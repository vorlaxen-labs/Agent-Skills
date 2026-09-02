import { PLATFORMS, SKILLS, type Platform } from "./catalog.js";
import type { ConflictPolicy } from "./conflict/types.js";
import type { InstallResult } from "./install/types.js";

export interface OutputOptions {
  verbose: boolean;
  json: boolean;
}

let outputOptions: OutputOptions = { verbose: false, json: false };

export function setOutputOptions(options: Partial<OutputOptions>): OutputOptions {
  outputOptions = {
    verbose: options.verbose ?? false,
    json: options.json ?? false,
  };
  return outputOptions;
}

export function getOutputOptions(): OutputOptions {
  return outputOptions;
}

export function logVerbose(message: string): void {
  if (outputOptions.verbose) {
    console.error(`[verbose] ${message}`);
  }
}

export interface InitResultPayload {
  platform: Platform;
  platformLabel: string;
  result: InstallResult;
  conflictPolicy: ConflictPolicy | null;
  dryRun: boolean;
  manifestPath?: string;
}

export function printInitResult(payload: InitResultPayload): void {
  if (outputOptions.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const { platformLabel, result, dryRun, manifestPath } = payload;
  const verb = dryRun ? "Would install" : "Installed";

  console.log(`\n${verb} ${result.written.length} file(s) for ${platformLabel}:\n`);

  for (const file of result.written) {
    console.log(`  ✓ ${file}`);
  }

  if (result.skipped.length > 0) {
    console.log(`\nSkipped ${result.skipped.length} existing file(s):\n`);
    for (const file of result.skipped) {
      console.log(`  ○ ${file}`);
    }
  }

  if (dryRun && result.planned) {
    console.log("\nDry-run actions:\n");
    for (const action of result.planned) {
      console.log(`  ${action.action.padEnd(8)} ${action.dest}`);
    }
  }

  if (manifestPath && !dryRun) {
    console.log(`\nManifest: ${manifestPath}`);
  }

  console.log("");
}

export function platformLabel(platform: Platform): string {
  return PLATFORMS.find((p) => p.id === platform)?.label ?? platform;
}

export function printList(): void {
  if (outputOptions.json) {
    console.log(
      JSON.stringify(
        {
          platforms: PLATFORMS,
          skills: SKILLS.map(({ paths: _paths, ...skill }) => skill),
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log("\nPlatforms:\n");
  for (const platform of PLATFORMS) {
    console.log(`  ${platform.id.padEnd(14)} ${platform.label}`);
  }

  console.log("\nSkills:\n");
  for (const skill of SKILLS) {
    const defaults = skill.defaultSelected ? " (default)" : "";
    console.log(
      `  ${skill.id.padEnd(18)} ${skill.label}${defaults}  [${skill.category}]`,
    );
  }

  console.log("");
}

export interface DoctorCheck {
  name: string;
  status: "ok" | "warn" | "error";
  message: string;
}

export interface DoctorResultPayload {
  manifestFound: boolean;
  checks: DoctorCheck[];
  manifestPath?: string;
}

export function printDoctorResult(payload: DoctorResultPayload): void {
  if (outputOptions.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log("\nAgent Skills Doctor\n");
  if (!payload.manifestFound) {
    console.log("  ✗ No installation found — run `agent-skills init` first.\n");
    return;
  }

  for (const check of payload.checks) {
    const icon = check.status === "ok" ? "✓" : check.status === "warn" ? "!" : "✗";
    console.log(`  ${icon} ${check.name}: ${check.message}`);
  }
  if (payload.manifestPath) {
    console.log(`\nManifest: ${payload.manifestPath}`);
  }
  console.log("");
}

export interface DiffResultPayload {
  files: import("./diff/unified.js").FileDiff[];
}

export function printDiffResult(payload: DiffResultPayload): void {
  if (outputOptions.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log("\nDiff vs installed snapshot:\n");
  for (const file of payload.files) {
    console.log(`  ${file.status.padEnd(10)} ${file.dest}`);
    if (file.diff) {
      console.log(file.diff.split("\n").map((l) => `    ${l}`).join("\n"));
      console.log("");
    }
  }
  console.log("");
}

export interface UninstallResultPayload {
  removed: string[];
  skipped: string[];
  dryRun: boolean;
}

export function printUninstallResult(payload: UninstallResultPayload): void {
  if (outputOptions.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const verb = payload.dryRun ? "Would remove" : "Removed";
  console.log(`\n${verb} ${payload.removed.length} file(s):\n`);
  for (const file of payload.removed) {
    console.log(`  ✓ ${file}`);
  }
  if (payload.skipped.length > 0) {
    console.log(`\nSkipped ${payload.skipped.length} file(s):\n`);
    for (const file of payload.skipped) {
      console.log(`  ○ ${file}`);
    }
  }
  console.log("");
}
