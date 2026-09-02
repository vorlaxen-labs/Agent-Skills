import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { SKILLS } from "../catalog.js";
import {
  comparePlannedToDisk,
  normalizeIncoming,
} from "../install/compare-snapshot.js";
import { pathExists, projectPath, readTextFile } from "../fs.js";
import { hashContent } from "../install/hash.js";
import type { InstallManifest } from "../install/manifest.js";
import { compareVersions } from "../install/manifest.js";
import { planFromManifest } from "../install/run.js";
import { WATERMARK } from "../markdown.js";
import { getPackageVersion } from "../version.js";
import type { DoctorCheck } from "./types.js";

export interface RunChecksOptions {
  cwd: string;
  manifest: InstallManifest;
  noCache?: boolean;
}

export async function runDoctorChecks(
  options: RunChecksOptions,
): Promise<DoctorCheck[]> {
  const { cwd, manifest, noCache } = options;
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

  let plannedDiff: Awaited<ReturnType<typeof comparePlannedToDisk>> = [];
  const plannedIncoming = new Map<string, string>();
  let snapshotError: string | undefined;

  try {
    const { planned } = await planFromManifest(cwd, manifest, noCache);
    for (const write of planned) {
      plannedIncoming.set(write.dest, normalizeIncoming(write.content));
    }
    plannedDiff = await comparePlannedToDisk(planned);
  } catch (err) {
    snapshotError =
      err instanceof Error ? err.message : String(err);
  }

  const missingFiles: string[] = [];
  const modifiedFiles: string[] = [];
  const contentDrift: string[] = [];

  for (const file of manifest.written) {
    if (!(await pathExists(file))) {
      missingFiles.push(file);
      continue;
    }

    const content = await readTextFile(file);
    if (!content.includes(WATERMARK)) {
      modifiedFiles.push(file);
      continue;
    }

    const currentHash = hashContent(content);
    const storedHash = manifest.contentHashes[file];

    if (storedHash) {
      if (currentHash !== storedHash) contentDrift.push(file);
      continue;
    }

    const baseline = plannedIncoming.get(file);
    if (baseline !== undefined && hashContent(baseline) !== currentHash) {
      contentDrift.push(file);
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

  const hasHashBaseline = Object.keys(manifest.contentHashes).length > 0;
  if (contentDrift.length === 0) {
    checks.push({
      name: "content-drift",
      status: "ok",
      message: hasHashBaseline
        ? "Content hashes match manifest"
        : "Content matches upstream snapshot (no hash baseline yet)",
    });
  } else {
    checks.push({
      name: "content-drift",
      status: "warn",
      message: `${contentDrift.length} file(s) changed since install`,
    });
  }

  const unknown = manifest.skills.filter(
    (id) => !SKILLS.some((s) => s.id === id),
  );
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

  if (snapshotError) {
    checks.push({
      name: "upstream-drift",
      status: "error",
      message: `Could not load upstream snapshot: ${snapshotError}`,
    });
  } else {
    const modify = plannedDiff.filter((f) => f.status === "modify").length;
    const create = plannedDiff.filter((f) => f.status === "create").length;
    const driftCount = modify + create;

    if (driftCount === 0) {
      checks.push({
        name: "upstream-drift",
        status: "ok",
        message: "Installed content matches upstream snapshot",
      });
    } else {
      const parts: string[] = [];
      if (modify > 0) parts.push(`${modify} modified`);
      if (create > 0) parts.push(`${create} missing on disk`);
      checks.push({
        name: "upstream-drift",
        status: "warn",
        message: `${driftCount} file(s) differ from upstream snapshot (${parts.join(", ")})`,
      });
    }
  }

  const npmDrift = await checkLibraryNpmDrift(cwd, manifest.skills);
  if (npmDrift) checks.push(npmDrift);

  checks.push(await findOrphanFiles(cwd, manifest));

  return checks;
}

export async function checkLibraryNpmDrift(
  cwd: string,
  skillIds: string[],
): Promise<DoctorCheck | null> {
  const librarySkills = SKILLS.filter(
    (s) => skillIds.includes(s.id) && s.category === "library" && s.npmPackage,
  );

  if (librarySkills.length === 0) return null;

  const pkgPath = projectPath(cwd, "package.json");
  if (!(await pathExists(pkgPath))) {
    return {
      name: "npm-drift",
      status: "warn",
      message: "Library skills installed but no package.json found",
    };
  }

  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(await readTextFile(pkgPath)) as Record<string, unknown>;
  } catch {
    return {
      name: "npm-drift",
      status: "warn",
      message: "Could not parse package.json",
    };
  }

  const deps = {
    ...(pkg.dependencies as Record<string, string> | undefined),
    ...(pkg.devDependencies as Record<string, string> | undefined),
  };

  const drifts: string[] = [];
  for (const skill of librarySkills) {
    const installed = deps[skill.npmPackage!];
    if (!installed) {
      drifts.push(`${skill.id}: ${skill.npmPackage} not in package.json`);
    } else if (installed.replace(/^[\^~]/, "") !== skill.npmVersion) {
      drifts.push(`${skill.id}: ${installed} (catalog: ${skill.npmVersion})`);
    }
  }

  if (drifts.length === 0) {
    return {
      name: "npm-drift",
      status: "ok",
      message: "Library npm versions match catalog pins",
    };
  }

  return {
    name: "npm-drift",
    status: "warn",
    message: drifts.join("; "),
  };
}

async function findOrphanFiles(
  cwd: string,
  manifest: InstallManifest,
): Promise<DoctorCheck> {
  const known = new Set(manifest.written);
  const orphans: string[] = [];

  async function scanDir(dir: string): Promise<void> {
    if (!(await pathExists(dir))) return;
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        await scanDir(full);
      } else if (entry.isFile()) {
        if (known.has(full)) continue;
        const content = await readTextFile(full);
        if (content.includes(WATERMARK)) {
          orphans.push(full);
        }
      }
    }
  }

  const roots = [
    projectPath(cwd, ".agent-skills"),
    projectPath(cwd, ".cursor"),
    projectPath(cwd, ".claude"),
    projectPath(cwd, ".github"),
    projectPath(cwd, "AGENTS.md"),
    projectPath(cwd, "CLAUDE.md"),
  ];

  for (const root of roots) {
    if (root.endsWith(".md")) {
      if ((await pathExists(root)) && !known.has(root)) {
        const content = await readTextFile(root);
        if (content.includes(WATERMARK)) orphans.push(root);
      }
    } else {
      await scanDir(root);
    }
  }

  if (orphans.length === 0) {
    return { name: "orphans", status: "info", message: "No orphan Vorlaxen files" };
  }
  return {
    name: "orphans",
    status: "info",
    message: `${orphans.length} watermark file(s) outside manifest`,
  };
}

export function summarizeChecks(checks: DoctorCheck[]): {
  ok: number;
  warn: number;
  error: number;
} {
  return {
    ok: checks.filter((c) => c.status === "ok" || c.status === "info").length,
    warn: checks.filter((c) => c.status === "warn").length,
    error: checks.filter((c) => c.status === "error").length,
  };
}

export function suggestAction(checks: DoctorCheck[]): string | null {
  if (checks.some((c) => c.name === "files" && c.status === "error")) {
    return "agent-skills doctor --fix";
  }
  if (checks.some((c) => c.name === "cli-version" && c.status === "warn")) {
    return "agent-skills update";
  }
  if (
    checks.some(
      (c) =>
        (c.name === "content-drift" || c.name === "upstream-drift") &&
        c.status === "warn",
    )
  ) {
    return "agent-skills doctor --fix";
  }
  if (checks.some((c) => c.name === "watermark" && c.status === "warn")) {
    return "agent-skills diff  # review local edits";
  }
  return null;
}
