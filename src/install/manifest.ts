import { PLATFORMS, SKILLS, type Platform } from "../catalog.js";
import type { ConflictPolicy } from "../conflict/types.js";
import { pathExists, projectPath, readTextFile, writeTextFile } from "../fs.js";
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

export class ManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManifestError";
  }
}

export function getManifestPath(cwd: string): string {
  return projectPath(cwd, ".agent-skills", "manifest.json");
}

export async function readInstallManifest(cwd: string): Promise<InstallManifest> {
  const path = getManifestPath(cwd);
  if (!(await pathExists(path))) {
    throw new ManifestError(
      "No installation found. Run `agent-skills init` first.",
    );
  }

  let raw: unknown;
  try {
    raw = JSON.parse(await readTextFile(path));
  } catch {
    throw new ManifestError(`Invalid manifest at ${path}`);
  }

  return validateManifest(raw, path);
}

function validateManifest(raw: unknown, path: string): InstallManifest {
  if (!raw || typeof raw !== "object") {
    throw new ManifestError(`Invalid manifest at ${path}`);
  }

  const m = raw as Record<string, unknown>;
  const platform = m.platform;
  if (
    typeof platform !== "string" ||
    !PLATFORMS.some((p) => p.id === platform)
  ) {
    throw new ManifestError(`Invalid platform in manifest at ${path}`);
  }

  if (!Array.isArray(m.skills) || m.skills.some((s) => typeof s !== "string")) {
    throw new ManifestError(`Invalid skills in manifest at ${path}`);
  }

  if (!Array.isArray(m.written) || m.written.some((s) => typeof s !== "string")) {
    throw new ManifestError(`Invalid written paths in manifest at ${path}`);
  }

  return {
    cliVersion: typeof m.cliVersion === "string" ? m.cliVersion : "",
    platform: platform as Platform,
    skills: m.skills as string[],
    remote: (m.remote ?? null) as RemoteRef | null,
    installedAt: typeof m.installedAt === "string" ? m.installedAt : "",
    conflictPolicy: (m.conflictPolicy ?? null) as ConflictPolicy | null,
    written: m.written as string[],
    skipped: Array.isArray(m.skipped)
      ? (m.skipped as string[])
      : [],
  };
}

export async function writeInstallManifest(
  cwd: string,
  manifest: InstallManifest,
): Promise<string> {
  const dest = getManifestPath(cwd);
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

export function compareVersions(a: string, b: string): number {
  const parse = (v: string) =>
    v.replace(/^v/, "").split(".").map((n) => Number.parseInt(n, 10) || 0);
  const av = parse(a);
  const bv = parse(b);
  const len = Math.max(av.length, bv.length);
  for (let i = 0; i < len; i++) {
    const diff = (av[i] ?? 0) - (bv[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function unknownSkillIds(skillIds: string[]): string[] {
  const known = new Set(SKILLS.map((s) => s.id));
  return skillIds.filter((id) => !known.has(id));
}
