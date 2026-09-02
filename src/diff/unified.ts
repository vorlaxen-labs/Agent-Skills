export type DiffStatus = "create" | "modify" | "unchanged" | "missing";

export interface FileDiff {
  dest: string;
  status: DiffStatus;
  diff?: string;
}

export function unifiedDiff(
  fromLabel: string,
  toLabel: string,
  before: string,
  after: string,
): string {
  const a = before.split("\n");
  const b = after.split("\n");
  const lines: string[] = [`--- ${fromLabel}`, `+++ ${toLabel}`];

  const max = Math.max(a.length, b.length);
  let i = 0;
  while (i < max) {
    const al = a[i];
    const bl = b[i];
    if (al === bl) {
      i++;
      continue;
    }

    let j = i + 1;
    while (j < max && a[j] !== b[j]) j++;

    if (j >= max) {
      for (let k = i; k < a.length; k++) lines.push(`-${a[k]}`);
      for (let k = i; k < b.length; k++) lines.push(`+${b[k]}`);
      break;
    }

    for (let k = i; k < j; k++) {
      if (k < a.length) lines.push(`-${a[k]}`);
      if (k < b.length) lines.push(`+${b[k]}`);
    }
    i = j;
  }

  return lines.join("\n");
}

export function compareContent(before: string, after: string): DiffStatus {
  if (before === after) return "unchanged";
  if (before === "") return "create";
  return "modify";
}
