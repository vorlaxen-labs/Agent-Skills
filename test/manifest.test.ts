import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SKILLS } from "../src/catalog.js";
import auditManifest from "../skills/audits/manifest.json" with { type: "json" };
import libraryManifest from "../skills/libraries/manifest.json" with { type: "json" };

describe("audit manifest binding", () => {
  it("catalog audit skills match skills/audits/manifest.json", () => {
    const auditSkills = SKILLS.filter((s) => s.category === "audit");
    assert.equal(auditSkills.length, Object.keys(auditManifest.audits).length);

    for (const skill of auditSkills) {
      const entry = auditManifest.audits[skill.id as keyof typeof auditManifest.audits];
      assert.ok(entry, `missing manifest entry for ${skill.id}`);
      assert.equal(skill.paths[0], entry.skillPath);
      assert.equal(skill.label, entry.label);
      assert.equal(skill.defaultSelected, entry.defaultSelected ?? false);
    }
  });
});

describe("library manifest binding", () => {
  it("catalog library skills match manifest.json", () => {
    const librarySkills = SKILLS.filter((s) => s.category === "library");
    assert.equal(librarySkills.length, Object.keys(libraryManifest.libraries).length);

    for (const skill of librarySkills) {
      const entry = libraryManifest.libraries[skill.id as keyof typeof libraryManifest.libraries];
      assert.ok(entry, `missing manifest entry for ${skill.id}`);
      assert.equal(skill.npmPackage, entry.npmPackage);
      assert.equal(skill.npmVersion, entry.npmVersion);
    }
  });
});
