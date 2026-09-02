import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SKILLS, type Platform } from "../catalog.js";
import { detectConflicts } from "../conflict/detect.js";
import { resolvePolicy } from "../conflict/resolve.js";
import type { AppendOrder, ConflictPolicy, ConflictStrategy } from "../conflict/types.js";
import { logVerbose } from "../output.js";
import { resolveSource, type RemoteRef } from "../source/resolve.js";
import { getPackageVersion } from "../version.js";
import { collectPaths } from "./collect-paths.js";
import { executePlan } from "./executor.js";
import { buildManifest, writeInstallManifest } from "./manifest.js";
import { planInstall } from "./planners/index.js";
import type { InstallContext, InstallResult } from "./types.js";

const bundledRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "bundled",
);

export interface RunInstallOptions {
  cwd: string;
  platform: Platform;
  skillIds: string[];
  remote?: RemoteRef;
  dryRun?: boolean;
  onConflict?: ConflictStrategy;
  appendOrder?: AppendOrder;
  yes?: boolean;
  /** When true, skip interactive conflict prompts (use flags/defaults). */
  nonInteractive?: boolean;
  /** Default conflict strategy when --yes and no --on-conflict (init: append, update: replace). */
  yesConflictDefault?: ConflictStrategy;
  noCache?: boolean;
  showFetchMessage?: boolean;
}

export interface RunInstallResult {
  platform: Platform;
  skillIds: string[];
  remote?: RemoteRef;
  result: InstallResult;
  conflictPolicy: ConflictPolicy | null;
  manifestPath?: string;
}

export async function runInstall(
  options: RunInstallOptions,
): Promise<RunInstallResult> {
  const {
    cwd,
    platform,
    skillIds,
    remote,
    dryRun,
    onConflict,
    appendOrder,
    yes,
    nonInteractive,
    yesConflictDefault = "append",
    noCache,
    showFetchMessage = true,
  } = options;

  const paths = collectPaths(skillIds);
  const packageVersion = getPackageVersion();
  const source = resolveSource(remote, packageVersion, bundledRoot, { noCache });

  logVerbose(`Fetching paths: ${paths.join(", ")}`);
  if (showFetchMessage) {
    const { getOutputOptions } = await import("../output.js");
    if (!getOutputOptions().json) console.log("\nFetching selected skills…");
  }

  const files = await source.fetch(paths);
  const skills = SKILLS.filter((s) => skillIds.includes(s.id));
  const ctx: InstallContext = { cwd, skills, files };

  const planned = planInstall(platform, ctx);
  logVerbose(`Planned ${planned.length} file write(s)`);

  const conflicts = await detectConflicts(planned);
  logVerbose(`Detected ${conflicts.length} conflict(s)`);

  const effectiveOnConflict =
    onConflict ?? (yes || nonInteractive ? yesConflictDefault : undefined);

  const policy: ConflictPolicy | null = await resolvePolicy(conflicts, {
    yes: yes || nonInteractive,
    onConflict: effectiveOnConflict,
    appendOrder,
    interactive: !yes && !nonInteractive && !onConflict,
  });

  const result = await executePlan(planned, { dryRun, policy });

  let manifestPath: string | undefined;
  if (!dryRun && result.written.length > 0) {
    const manifest = buildManifest(platform, skillIds, remote, policy, result);
    manifestPath = await writeInstallManifest(cwd, manifest);
    logVerbose(`Wrote manifest to ${manifestPath}`);
  }

  return {
    platform,
    skillIds,
    remote,
    result,
    conflictPolicy: policy,
    manifestPath,
  };
}

export async function planFromManifest(
  cwd: string,
  manifest: {
    platform: Platform;
    skills: string[];
    remote: RemoteRef | null;
  },
  noCache?: boolean,
): Promise<{ planned: ReturnType<typeof planInstall>; ctx: InstallContext }> {
  const paths = collectPaths(manifest.skills);
  const source = resolveSource(
    manifest.remote ?? undefined,
    getPackageVersion(),
    bundledRoot,
    { noCache },
  );
  const files = await source.fetch(paths);
  const skills = SKILLS.filter((s) => manifest.skills.includes(s.id));
  const ctx: InstallContext = { cwd, skills, files };
  const planned = planInstall(manifest.platform, ctx);
  return { planned, ctx };
}
