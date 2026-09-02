import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { MANIFEST_SCHEMA_VERSION, getManifestPath, readInstallManifest } from "../../src/install/manifest.js";
import { hashContent } from "../../src/install/hash.js";

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-skills-manifest-v2-"));
}

describe("manifest v2", () => {
  it("migrates v1 manifest to schema v2", async () => {
    const cwd = await tempProject();
    const path = getManifestPath(cwd);
    await mkdir(join(cwd, ".agent-skills"), { recursive: true });
    await writeFile(
      path,
      JSON.stringify({
        cliVersion: "1.1.0",
        platform: "agents-md",
        skills: ["global"],
        remote: null,
        installedAt: "2026-01-01T00:00:00.000Z",
        conflictPolicy: { strategy: "replace" },
        written: [join(cwd, "AGENTS.md")],
        skipped: [],
      }),
    );

    const manifest = await readInstallManifest(cwd);
    assert.equal(manifest.schemaVersion, MANIFEST_SCHEMA_VERSION);
    assert.ok(manifest.writtenBySkill.global?.includes(join(cwd, "AGENTS.md")));
    assert.equal(manifest.conflictPolicy?.default, "replace");
  });

  it("hashContent is stable for same input", () => {
    const a = hashContent("# Hello\n");
    const b = hashContent("# Hello\n");
    assert.equal(a, b);
  });
});
