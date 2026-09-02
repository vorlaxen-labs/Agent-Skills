export interface RemoteFile {
  relativePath: string;
  content: string;
}

export interface SkillSource {
  fetch(paths: string[]): Promise<RemoteFile[]>;
}

export function indexFilesByPath(files: RemoteFile[]): Map<string, string> {
  return new Map(files.map((f) => [f.relativePath, f.content]));
}
