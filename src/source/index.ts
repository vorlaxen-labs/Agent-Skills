import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { GITHUB } from "../catalog.js";

export interface RemoteFile {
  relativePath: string;
  content: string;
}

export interface SkillSource {
  /** Fetch all files under the given repo-relative paths */
  fetch(paths: string[]): Promise<RemoteFile[]>;
}

async function walkDir(
  baseDir: string,
  currentDir: string,
  prefix: string,
  files: RemoteFile[],
): Promise<void> {
  const entries = await readdir(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(currentDir, entry.name);
    const rel = join(prefix, entry.name).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      await walkDir(baseDir, full, rel, files);
    } else if (entry.isFile()) {
      const content = await readFile(full, "utf8");
      files.push({ relativePath: rel, content });
    }
  }
}

/** Read skill files from the bundled copy shipped with the npm package. */
export function createBundledSource(bundledRoot: string): SkillSource {
  return {
    async fetch(paths: string[]): Promise<RemoteFile[]> {
      const files: RemoteFile[] = [];
      for (const relPath of paths) {
        const abs = join(bundledRoot, relPath);
        try {
          const info = await stat(abs);
          if (info.isDirectory()) {
            await walkDir(bundledRoot, abs, relPath, files);
          } else {
            const content = await readFile(abs, "utf8");
            files.push({ relativePath: relPath, content });
          }
        } catch {
          throw new Error(`Bundled skill path not found: ${relPath}`);
        }
      }
      return files;
    },
  };
}

/** Fetch only selected paths from GitHub — no full repo clone. */
export function createGitHubSource(
  owner = GITHUB.owner,
  repo = GITHUB.repo,
  branch = GITHUB.branch,
): SkillSource {
  return {
    async fetch(paths: string[]): Promise<RemoteFile[]> {
      const files: RemoteFile[] = [];
      for (const relPath of paths) {
        await fetchPath(owner, repo, branch, relPath, files);
      }
      return files;
    },
  };
}

async function fetchPath(
  owner: string,
  repo: string,
  branch: string,
  relPath: string,
  files: RemoteFile[],
): Promise<void> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${relPath}?ref=${branch}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "vorlaxen-agent-skills-cli",
    },
  });

  if (res.status === 404) {
    throw new Error(`Skill path not found on GitHub: ${relPath}`);
  }
  if (!res.ok) {
    throw new Error(
      `GitHub API error (${res.status}) for ${relPath}: ${await res.text()}`,
    );
  }

  const data = (await res.json()) as GitHubContent | GitHubContent[];

  if (Array.isArray(data)) {
    for (const item of data) {
      if (item.type === "file") {
        await fetchFileRaw(owner, repo, branch, item.path, files);
      } else if (item.type === "dir") {
        await fetchPath(owner, repo, branch, item.path, files);
      }
    }
    return;
  }

  if (data.type === "file") {
    await fetchFileRaw(owner, repo, branch, data.path, files);
  } else if (data.type === "dir") {
    await fetchPath(owner, repo, branch, data.path, files);
  }
}

async function fetchFileRaw(
  owner: string,
  repo: string,
  branch: string,
  relPath: string,
  files: RemoteFile[],
): Promise<void> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${relPath}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "vorlaxen-agent-skills-cli" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${relPath}: ${res.status}`);
  }
  const content = await res.text();
  files.push({ relativePath: relPath, content });
}

interface GitHubContent {
  type: "file" | "dir";
  path: string;
  download_url?: string | null;
}

export function filesForSkills(
  skillIds: string[],
  allPaths: Map<string, string[]>,
): string[] {
  const set = new Set<string>();
  for (const id of skillIds) {
    for (const p of allPaths.get(id) ?? []) {
      set.add(p);
    }
  }
  return [...set];
}

export function indexFilesByPath(files: RemoteFile[]): Map<string, string> {
  return new Map(files.map((f) => [f.relativePath, f.content]));
}

