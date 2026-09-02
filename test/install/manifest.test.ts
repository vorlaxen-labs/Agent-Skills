import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  compareVersions,
  getManifestPath,
  ManifestError,
  readInstallManifest,
  unknownSkillIds,
} from "../../src/install/manifest.js";

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-skills-manifest-"));
}

describe("readInstallManifest", () => {
  it("throws ManifestError when manifest is missing", async () => {
    const cwd = await tempProject();
    await assert.rejects(
      () => readInstallManifest(cwd),
      (err: unknown) => {
        assert.ok(err instanceof ManifestError);
        assert.match((err as ManifestError).message, /agent-skills init/);
        return true;
      },
    );
  });

  it("throws ManifestError for invalid JSON", async () => {
    const cwd = await tempProject();
    const path = getManifestPath(cwd);
    await mkdir(join(cwd, ".agent-skills"), { recursive: true });
    await writeFile(path, "not json");
    await assert.rejects(
      () => readInstallManifest(cwd),
      (err: unknown) => err instanceof ManifestError,
    );
  });

  it("reads valid manifest", async () => {
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
        conflictPolicy: null,
        written: [join(cwd, "AGENTS.md")],
        skipped: [],
      }),
    );

    const manifest = await readInstallManifest(cwd);
    assert.equal(manifest.platform, "agents-md");
    assert.deepEqual(manifest.skills, ["global"]);
  });
});

describe("compareVersions", () => {
  it("compares semver segments numerically", () => {
    assert.ok(compareVersions("1.2.0", "1.1.0") > 0);
    assert.ok(compareVersions("1.1.0", "1.2.0") < 0);
    assert.equal(compareVersions("1.1.0", "1.1.0"), 0);
    assert.ok(compareVersions("v1.2.0", "1.1.9") > 0);
  });
});

describe("unknownSkillIds", () => {
  it("returns ids not in catalog", () => {
    assert.deepEqual(unknownSkillIds(["global", "fake-skill"]), ["fake-skill"]);
    assert.deepEqual(unknownSkillIds(["global"]), []);
  });
});
