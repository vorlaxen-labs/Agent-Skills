#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "skills/audits/manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const errors = [];

if (!manifest.audits || typeof manifest.audits !== "object") {
  console.error("skills/audits/manifest.json must have an `audits` object");
  process.exit(1);
}

for (const [id, entry] of Object.entries(manifest.audits)) {
  if (!entry || typeof entry !== "object") {
    errors.push(`${id}: entry must be an object`);
    continue;
  }

  const { skillPath, label, scanner } = entry;
  if (typeof skillPath !== "string" || !skillPath.startsWith("skills/audits/")) {
    errors.push(`${id}: skillPath must be under skills/audits/`);
  }
  if (typeof label !== "string" || label.length === 0) {
    errors.push(`${id}: label is required`);
  }
  if (skillPath && !existsSync(join(root, skillPath, "SKILL.md"))) {
    errors.push(`${id}: missing ${skillPath}/SKILL.md`);
  }
  if (typeof scanner === "string" && skillPath) {
    const scannerPath = join(root, skillPath, scanner);
    if (!existsSync(scannerPath)) {
      errors.push(`${id}: missing scanner at ${skillPath}/${scanner}`);
    }
  }

  const expectedPath = `skills/audits/${id}`;
  if (skillPath !== expectedPath) {
    errors.push(`${id}: skillPath must be ${expectedPath}, got ${skillPath ?? "(missing)"}`);
  }
}

let catalogAuditCount = 0;
const catalogPath = join(root, "dist/catalog.js");
if (existsSync(catalogPath)) {
  const { SKILLS } = await import(catalogPath);
  const auditSkills = SKILLS.filter((s) => s.category === "audit");
  catalogAuditCount = auditSkills.length;
  const manifestIds = new Set(Object.keys(manifest.audits));

  if (auditSkills.length !== manifestIds.size) {
    errors.push(
      `catalog audit count (${auditSkills.length}) ≠ manifest (${manifestIds.size}) — run npm run build`,
    );
  }

  for (const skill of auditSkills) {
    const entry = manifest.audits[skill.id];
    if (!entry) {
      errors.push(`catalog audit ${skill.id} missing from skills/audits/manifest.json`);
      continue;
    }
    if (skill.paths[0] !== entry.skillPath) {
      errors.push(`${skill.id}: catalog path ${skill.paths[0]} ≠ manifest ${entry.skillPath}`);
    }
    if (skill.label !== entry.label) {
      errors.push(`${skill.id}: catalog label mismatch`);
    }
    if (skill.defaultSelected !== (entry.defaultSelected ?? false)) {
      errors.push(`${skill.id}: catalog defaultSelected mismatch`);
    }
  }

  for (const id of manifestIds) {
    if (!auditSkills.some((s) => s.id === id)) {
      errors.push(`manifest audit ${id} missing from catalog — run npm run build`);
    }
  }
} else {
  console.warn("  (skip catalog cross-check — dist/catalog.js not found; run npm run build)");
}

if (errors.length > 0) {
  console.error("Audit manifest sync check failed:\n");
  for (const err of errors) {
    console.error(`  ✗ ${err}`);
  }
  process.exit(1);
}

console.log(
  `Audit manifest OK — ${Object.keys(manifest.audits).length} module(s)${
    catalogAuditCount > 0 ? ", catalog matches" : ""
  }.`,
);
