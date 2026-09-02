import { statSync } from "node:fs";
import { GITHUB } from "../catalog.js";
import { createBundledSource, createGitHubSource, type SkillSource } from "./index.js";

/** undefined/false → bundled; true → package version tag; string → explicit git ref */
export type RemoteRef = boolean | string | undefined;

export function resolveRemoteRef(
  remote: RemoteRef,
  packageVersion: string,
): string | null {
  if (remote === undefined || remote === false) {
    return null;
  }
  if (remote === true) {
    return `v${packageVersion}`;
  }
  return remote;
}

export function resolveSource(
  remote: RemoteRef,
  packageVersion: string,
  bundledRoot: string,
): SkillSource {
  const ref = resolveRemoteRef(remote, packageVersion);

  if (ref === null) {
    try {
      statSync(bundledRoot);
      return createBundledSource(bundledRoot);
    } catch {
      return createGitHubSource(GITHUB.owner, GITHUB.repo, `v${packageVersion}`);
    }
  }

  return createGitHubSource(GITHUB.owner, GITHUB.repo, ref);
}
