import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export function cacheFilePath(
  owner: string,
  repo: string,
  ref: string,
  relPath: string,
): string {
  return join(
    homedir(),
    ".cache",
    "agent-skills",
    owner,
    repo,
    ref,
    relPath,
  );
}

export async function readCache(
  owner: string,
  repo: string,
  ref: string,
  relPath: string,
): Promise<string | null> {
  const path = cacheFilePath(owner, repo, ref, relPath);
  try {
    await stat(path);
    return readFile(path, "utf8");
  } catch {
    return null;
  }
}

export async function writeCache(
  owner: string,
  repo: string,
  ref: string,
  relPath: string,
  content: string,
): Promise<void> {
  const path = cacheFilePath(owner, repo, ref, relPath);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
}
