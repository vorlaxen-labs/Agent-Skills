import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { checkLibraryNpmDrift } from "../../src/doctor/checks.js";

describe("npm drift", () => {
  it("warns when library package missing from package.json", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "agent-skills-npm-"));
    await mkdir(cwd, { recursive: true });
    await writeFile(join(cwd, "package.json"), JSON.stringify({ dependencies: {} }));

    const check = await checkLibraryNpmDrift(cwd, ["bar-js"]);
    assert.ok(check);
    assert.equal(check!.status, "warn");
  });
});
