#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractGlobalBody,
  readRepoFile,
  stripFrontmatter,
} from "./lib/markdown.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const GLOBAL_FILES = [
  {
    label: "AGENTS.md",
    path: "AGENTS.md",
    stripFm: false,
    fromCore: true,
  },
  {
    label: "skills/global/SKILL.md",
    path: "skills/global/SKILL.md",
    stripFm: true,
    fromCore: true,
  },
  {
    label: "rules/global.mdc",
    path: "rules/global.mdc",
    stripFm: true,
    fromCore: true,
  },
];

function bodyFor(entry) {
  let content = readRepoFile(root, entry.path);
  if (entry.stripFm) {
    content = stripFrontmatter(content);
  }
  if (entry.fromCore) {
    return extractGlobalBody(content);
  }
  return content.trim();
}

const bodies = GLOBAL_FILES.map((entry) => ({
  label: entry.label,
  body: bodyFor(entry),
}));

const reference = bodies[0].body;
const errors = [];

for (let i = 1; i < bodies.length; i++) {
  if (bodies[i].body !== reference) {
    errors.push(
      `${bodies[i].label} is out of sync with ${bodies[0].label} (from # Core Principle).`,
    );
  }
}

if (errors.length > 0) {
  console.error("Global sync check failed:\n");
  for (const err of errors) {
    console.error(`  ✗ ${err}`);
  }
  console.error(
    "\nUpdate AGENTS.md, skills/global/SKILL.md, and rules/global.mdc together.",
  );
  process.exit(1);
}

console.log(
  `Global sync OK — ${GLOBAL_FILES.length} files match from # Core Principle.`,
);
