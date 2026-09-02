import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SKILLS } from "../src/catalog.js";
import libraryManifest from "../skills/libraries/manifest.json" with { type: "json" };

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
