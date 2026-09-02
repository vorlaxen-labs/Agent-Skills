#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontmatter, readRepoFile } from "./lib/markdown.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "skills/libraries/manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const PACKAGE_LINE =
  /^\*\*Package:\*\* `([^`]+)` v([0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?)/m;

async function npmVersionExists(packageName, version) {
  const encoded = packageName.replace("/", "%2F");
  const url = `https://registry.npmjs.org/${encoded}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`npm registry error for ${packageName}: HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!data.versions?.[version]) {
    const latest = data["dist-tags"]?.latest ?? "unknown";
    throw new Error(
      `${packageName}@${version} not found on npm (latest: ${latest})`,
    );
  }
  return data["dist-tags"]?.latest ?? null;
}

function parsePackageLine(skillBody) {
  const match = skillBody.match(PACKAGE_LINE);
  if (!match) {
    throw new Error("Missing **Package:** line with npm name and version");
  }
  return { npmPackage: match[1], npmVersion: match[2] };
}

const errors = [];
const warnings = [];

for (const [id, entry] of Object.entries(manifest.libraries)) {
  const skillFile = join(entry.skillPath, "SKILL.md");
  const raw = readRepoFile(root, skillFile);
  const fm = parseFrontmatter(raw);
  const body = raw.includes("\n---\n")
    ? raw.slice(raw.indexOf("\n---\n", 4) + 5)
    : raw;
  const line = parsePackageLine(body);

  const checks = [
    ["manifest.npmPackage", entry.npmPackage, line.npmPackage],
    ["manifest.npmVersion", entry.npmVersion, line.npmVersion],
    ["frontmatter.npmPackage", entry.npmPackage, fm.npmPackage],
    ["frontmatter.npmVersion", entry.npmVersion, fm.npmVersion],
  ];

  for (const [label, expected, actual] of checks) {
    if (expected !== actual) {
      errors.push(
        `${id}: ${label} mismatch — expected ${expected}, got ${actual ?? "(missing)"}`,
      );
    }
  }

  try {
    const latest = await npmVersionExists(entry.npmPackage, entry.npmVersion);
    if (latest && latest !== entry.npmVersion) {
      warnings.push(
        `${id}: pinned ${entry.npmVersion}, npm latest is ${latest} — update manifest when docs are verified`,
      );
    }
    console.log(`  ✓ ${entry.npmPackage}@${entry.npmVersion} exists on npm`);
  } catch (err) {
    errors.push(`${id}: ${err.message}`);
  }
}

if (warnings.length > 0) {
  console.warn("\nWarnings:");
  for (const w of warnings) {
    console.warn(`  ⚠ ${w}`);
  }
}

if (errors.length > 0) {
  console.error("\nLibrary version check failed:\n");
  for (const err of errors) {
    console.error(`  ✗ ${err}`);
  }
  process.exit(1);
}

console.log(
  `\nLibrary manifest OK — ${Object.keys(manifest.libraries).length} packages bound and verified.`,
);
