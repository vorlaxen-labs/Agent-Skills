import { mkdir, writeFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";

export async function ensureDir(filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
}

export async function writeTextFile(
  filePath: string,
  content: string,
): Promise<void> {
  await ensureDir(filePath);
  await writeFile(filePath, content, "utf8");
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export function projectPath(cwd: string, ...segments: string[]): string {
  return join(cwd, ...segments);
}
