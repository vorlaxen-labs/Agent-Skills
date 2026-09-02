import type { Platform } from "../catalog.js";
import type { ConflictPolicy } from "../conflict/types.js";
import { projectPath, writeTextFile } from "../fs.js";
import type { RemoteRef } from "../source/resolve.js";
import { getPackageVersion } from "../version.js";
import type { InstallResult } from "./types.js";

export interface InstallManifest {
  cliVersion: string;
  platform: Platform;
  skills: string[];
  remote: RemoteRef | null;
  installedAt: string;
  conflictPolicy: ConflictPolicy | null;
  written: string[];
  skipped: string[];
}

export async function writeInstallManifest(
  cwd: string,
  manifest: InstallManifest,
): Promise<string> {
  const dest = projectPath(cwd, ".agent-skills", "manifest.json");
  const content = JSON.stringify(
    { ...manifest, cliVersion: manifest.cliVersion || getPackageVersion() },
    null,
    2,
  );
  await writeTextFile(dest, `${content}\n`);
  return dest;
}

export function buildManifest(
  platform: Platform,
  skills: string[],
  remote: RemoteRef,
  policy: ConflictPolicy | null,
  result: InstallResult,
): InstallManifest {
  return {
    cliVersion: getPackageVersion(),
    platform,
    skills,
    remote: remote ?? null,
    installedAt: new Date().toISOString(),
    conflictPolicy: policy,
    written: result.written,
    skipped: result.skipped,
  };
}
