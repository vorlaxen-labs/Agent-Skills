import { GITHUB } from "../catalog.js";
import type { RemoteFile, SkillSource } from "./types.js";

interface GitHubContent {
  type: "file" | "dir";
  path: string;
}

export function createGitHubSource(
  owner = GITHUB.owner,
  repo = GITHUB.repo,
  ref: string = GITHUB.branch,
): SkillSource {
  return {
    async fetch(paths: string[]): Promise<RemoteFile[]> {
      const files: RemoteFile[] = [];
      for (const relPath of paths) {
        await fetchPath(owner, repo, ref, relPath, files);
      }
      return files;
    },
  };
}

async function fetchPath(
  owner: string,
  repo: string,
  ref: string,
  relPath: string,
  files: RemoteFile[],
): Promise<void> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${relPath}?ref=${ref}`;
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
        await fetchFileRaw(owner, repo, ref, item.path, files);
      } else if (item.type === "dir") {
        await fetchPath(owner, repo, ref, item.path, files);
      }
    }
    return;
  }

  if (data.type === "file") {
    await fetchFileRaw(owner, repo, ref, data.path, files);
  } else if (data.type === "dir") {
    await fetchPath(owner, repo, ref, data.path, files);
  }
}

async function fetchFileRaw(
  owner: string,
  repo: string,
  ref: string,
  relPath: string,
  files: RemoteFile[],
): Promise<void> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${relPath}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "vorlaxen-agent-skills-cli" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${relPath}: ${res.status}`);
  }
  files.push({ relativePath: relPath, content: await res.text() });
}
