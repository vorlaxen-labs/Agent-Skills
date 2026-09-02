import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Strip YAML frontmatter from skill/rule files. */
export function stripFrontmatter(content) {
  if (!content.startsWith("---\n")) {
    return content;
  }
  const end = content.indexOf("\n---\n", 4);
  if (end === -1) {
    return content;
  }
  return content.slice(end + 5);
}

/** Parse simple `key: value` lines from YAML frontmatter (no nested objects). */
export function parseFrontmatter(content) {
  if (!content.startsWith("---\n")) {
    return {};
  }
  const end = content.indexOf("\n---\n", 4);
  if (end === -1) {
    return {};
  }
  const block = content.slice(4, end);
  const out = {};
  for (const line of block.split("\n")) {
    const match = line.match(/^([a-zA-Z]+):\s*(.+)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[match[1]] = value;
  }
  return out;
}

/** Shared global body — from `# Core Principle` onward. */
export function extractGlobalBody(content, { stripFm = false } = {}) {
  const text = stripFm ? stripFrontmatter(content) : content;
  const marker = "# Core Principle";
  const index = text.indexOf(marker);
  if (index === -1) {
    throw new Error(`Missing "${marker}" section`);
  }
  return text.slice(index).trim();
}

export function readRepoFile(root, relPath) {
  return readFileSync(join(root, relPath), "utf8");
}
