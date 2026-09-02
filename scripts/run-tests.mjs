#!/usr/bin/env node
import { readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const testDir = join(root, "test");

function collectTestFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectTestFiles(full));
    } else if (entry.endsWith(".test.ts")) {
      files.push(full);
    }
  }

  return files.sort();
}

const files = collectTestFiles(testDir);

if (files.length === 0) {
  console.error("No test files found in test/");
  process.exit(1);
}

const result = spawnSync(process.execPath, ["--import", "tsx", "--test", ...files], {
  stdio: "inherit",
  cwd: root,
});

process.exit(result.status ?? 1);
