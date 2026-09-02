#!/usr/bin/env node
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const bundled = join(root, "bundled");

const paths = [
  "AGENTS.md",
  "rules/global.mdc",
  "skills/global",
  "skills/web/frontend",
  "skills/web/backend",
  "skills/libraries/bar-js",
  "skills/libraries/huk-js",
  "skills/libraries/kargomucuz-sdk",
];

function hashFile(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function collectFiles(dir, base = dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectFiles(full, base));
    } else {
      files.push(full.slice(base.length + 1));
    }
  }
  return files.sort();
}

function buildFreshBundled() {
  const tmp = join(root, ".bundled-check-tmp");
  if (existsSync(tmp)) rmSync(tmp, { recursive: true });
  mkdirSync(tmp, { recursive: true });

  for (const rel of paths) {
    const src = join(root, rel);
    const dest = join(tmp, rel);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest, { recursive: true });
  }
  return tmp;
}

function fingerprintTree(baseDir) {
  const map = new Map();
  for (const rel of paths) {
    const abs = join(baseDir, rel);
    if (!existsSync(abs)) {
      throw new Error(`Missing bundled path: ${rel}`);
    }
    if (statSync(abs).isDirectory()) {
      for (const file of collectFiles(abs, abs)) {
        map.set(join(rel, file).replace(/\\/g, "/"), hashFile(join(abs, file)));
      }
    } else {
      map.set(rel, hashFile(abs));
    }
  }
  return map;
}

if (!existsSync(bundled)) {
  console.error("bundled/ not found — run npm run build first");
  process.exit(1);
}

const expected = fingerprintTree(buildFreshBundled());
const actual = fingerprintTree(bundled);
rmSync(join(root, ".bundled-check-tmp"), { recursive: true, force: true });

const mismatches = [];
for (const [rel, hash] of expected) {
  if (actual.get(rel) !== hash) {
    mismatches.push(rel);
  }
}

if (mismatches.length > 0) {
  console.error(`Bundled snapshot out of sync (${mismatches.length} file(s)):`);
  for (const rel of mismatches) console.error(`  - ${rel}`);
  console.error("Run: npm run build");
  process.exit(1);
}

console.log(`Bundled snapshot OK — ${expected.size} file(s) match source tree.`);
