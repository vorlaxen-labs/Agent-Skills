import { PLATFORMS, SKILLS, type Platform } from "../catalog.js";
import {
  defaultPolicyOverrides,
  normalizePolicyV2,
} from "../conflict/path-policy.js";
import type { ConflictPolicyV2 } from "../conflict/types.js";
import { pathExists, projectPath, readTextFile, writeTextFile } from "../fs.js";
import type { RemoteRef } from "../source/resolve.js";
import { getPackageVersion } from "../version.js";
import { hashContent } from "./hash.js";
import { buildWrittenBySkill } from "./skill-paths.js";
import type { InstallResult } from "./types.js";

export const MANIFEST_SCHEMA_VERSION = 2;

export interface InstallManifest {
  schemaVersion: number;
  cliVersion: string;
  platform: Platform;
  skills: string[];
  remote: RemoteRef | null;
  installedAt: string;
  conflictPolicy: ConflictPolicyV2 | null;
  written: string[];
  skipped: string[];
  writtenBySkill: Record<string, string[]>;
  contentHashes: Record<string, string>;
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

  return validateManifest(raw, path, cwd);
}

function migrateV1(
  m: Record<string, unknown>,
  cwd: string,
): InstallManifest {
  const platform = m.platform as Platform;
  const skills = m.skills as string[];
  const written = m.written as string[];
  const oldPolicy = m.conflictPolicy as
    | { strategy: string; appendOrder?: ConflictPolicyV2["appendOrder"] }
    | null;

  let conflictPolicy: ConflictPolicyV2 | null = null;
  if (oldPolicy && typeof oldPolicy.strategy === "string") {
    conflictPolicy = normalizePolicyV2({
      default: oldPolicy.strategy as ConflictPolicyV2["default"],
      appendOrder: oldPolicy.appendOrder,
    });
  }

  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    cliVersion: typeof m.cliVersion === "string" ? m.cliVersion : "",
    platform,
    skills,
    remote: (m.remote ?? null) as RemoteRef | null,
    installedAt: typeof m.installedAt === "string" ? m.installedAt : "",
    conflictPolicy,
    written,
    skipped: Array.isArray(m.skipped) ? (m.skipped as string[]) : [],
    writtenBySkill: buildWrittenBySkill(written, cwd, skills),
    contentHashes: {},
  };
}

function validateManifest(raw: unknown, path: string, cwd: string): InstallManifest {
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

  const schemaVersion = typeof m.schemaVersion === "number" ? m.schemaVersion : 1;
  if (schemaVersion < 2) {
    return migrateV1(m, cwd);
  }

  const conflictPolicy = normalizePolicyV2(
    (m.conflictPolicy ?? null) as ConflictPolicyV2 | null,
  );

  const writtenBySkill =
    m.writtenBySkill && typeof m.writtenBySkill === "object"
      ? (m.writtenBySkill as Record<string, string[]>)
      : buildWrittenBySkill(m.written as string[], cwd, m.skills as string[]);

  const contentHashes =
    m.contentHashes && typeof m.contentHashes === "object"
      ? (m.contentHashes as Record<string, string>)
      : {};

  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    cliVersion: typeof m.cliVersion === "string" ? m.cliVersion : "",
    platform: platform as Platform,
    skills: m.skills as string[],
    remote: (m.remote ?? null) as RemoteRef | null,
    installedAt: typeof m.installedAt === "string" ? m.installedAt : "",
    conflictPolicy,
    written: m.written as string[],
    skipped: Array.isArray(m.skipped) ? (m.skipped as string[]) : [],
    writtenBySkill,
    contentHashes,
  };
}

export async function writeInstallManifest(
  cwd: string,
  manifest: InstallManifest,
): Promise<string> {
  const dest = getManifestPath(cwd);
  const content = JSON.stringify(
    {
      ...manifest,
      schemaVersion: MANIFEST_SCHEMA_VERSION,
      cliVersion: manifest.cliVersion || getPackageVersion(),
    },
    null,
    2,
  );
  await writeTextFile(dest, `${content}\n`);
  return dest;
}

export async function buildContentHashes(
  written: string[],
): Promise<Record<string, string>> {
  const hashes: Record<string, string> = {};
  for (const dest of written) {
    if (await pathExists(dest)) {
      hashes[dest] = hashContent(await readTextFile(dest));
    }
  }
  return hashes;
}

export function buildManifest(
  cwd: string,
  platform: Platform,
  skills: string[],
  remote: RemoteRef,
  policy: ConflictPolicyV2 | null,
  result: InstallResult,
  contentHashes: Record<string, string>,
): InstallManifest {
  const normalized = normalizePolicyV2(policy);
  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    cliVersion: getPackageVersion(),
    platform,
    skills,
    remote: remote ?? null,
    installedAt: new Date().toISOString(),
    conflictPolicy: normalized,
    written: result.written,
    skipped: result.skipped,
    writtenBySkill: buildWrittenBySkill(result.written, cwd, skills),
    contentHashes,
  };
}

export function mergeManifests(
  existing: InstallManifest,
  incoming: InstallManifest,
): InstallManifest {
  const written = [...new Set([...existing.written, ...incoming.written])];
  const skipped = [...new Set([...existing.skipped, ...incoming.skipped])].filter(
    (s) => !written.includes(s),
  );

  const writtenBySkill: Record<string, string[]> = { ...existing.writtenBySkill };
  for (const [skillId, paths] of Object.entries(incoming.writtenBySkill)) {
    writtenBySkill[skillId] = [...new Set([...(writtenBySkill[skillId] ?? []), ...paths])];
  }

  const contentHashes = { ...existing.contentHashes, ...incoming.contentHashes };

  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    cliVersion: incoming.cliVersion || getPackageVersion(),
    platform: existing.platform,
    skills: [...new Set([...existing.skills, ...incoming.skills])],
    remote: incoming.remote ?? existing.remote,
    installedAt: new Date().toISOString(),
    conflictPolicy: incoming.conflictPolicy ?? existing.conflictPolicy,
    written,
    skipped,
    writtenBySkill,
    contentHashes,
  };
}

export function removeSkillsFromManifest(
  manifest: InstallManifest,
  skillIds: string[],
  removedPaths: string[],
): InstallManifest {
  const removedSet = new Set(removedPaths);
  const skills = manifest.skills.filter((id) => !skillIds.includes(id));
  const written = manifest.written.filter((p) => !removedSet.has(p));
  const skipped = manifest.skipped.filter((p) => !removedSet.has(p));

  const writtenBySkill = { ...manifest.writtenBySkill };
  for (const id of skillIds) delete writtenBySkill[id];

  const contentHashes = { ...manifest.contentHashes };
  for (const p of removedPaths) delete contentHashes[p];

  return {
    ...manifest,
    skills,
    written,
    skipped,
    writtenBySkill,
    contentHashes,
    installedAt: new Date().toISOString(),
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

export function defaultConflictPolicy(): ConflictPolicyV2 {
  return normalizePolicyV2({
    default: "append",
    appendOrder: "vorlaxen-first",
    overrides: defaultPolicyOverrides(),
  })!;
}
