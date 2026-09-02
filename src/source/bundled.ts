import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import type { RemoteFile, SkillSource } from "./types.js";

async function walkDir(
  currentDir: string,
  prefix: string,
  files: RemoteFile[],
): Promise<void> {
  const entries = await readdir(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(currentDir, entry.name);
    const rel = join(prefix, entry.name).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      await walkDir(full, rel, files);
    } else if (entry.isFile()) {
      const content = await readFile(full, "utf8");
      files.push({ relativePath: rel, content });
    }
  }
}

export function createBundledSource(bundledRoot: string): SkillSource {
  return {
    async fetch(paths: string[]): Promise<RemoteFile[]> {
      const files: RemoteFile[] = [];
      for (const relPath of paths) {
        const abs = join(bundledRoot, relPath);
        try {
          const info = await stat(abs);
          if (info.isDirectory()) {
            await walkDir(abs, relPath, files);
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
