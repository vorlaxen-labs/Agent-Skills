import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { runInstall } from "../../src/install/run.js";

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-skills-run-"));
}

describe("runInstall", () => {
  it("installs from bundled snapshot and writes manifest", async () => {
    const cwd = await tempProject();
    const result = await runInstall({
      cwd,
      platform: "agents-md",
      skillIds: ["global"],
      yes: true,
      showFetchMessage: false,
    });

    assert.equal(result.platform, "agents-md");
    assert.ok(result.result.written.length > 0);
    assert.ok(result.manifestPath);

    await stat(join(cwd, "AGENTS.md"));
    await stat(join(cwd, ".agent-skills", "manifest.json"));
  });

  it("dry-run does not write files or manifest", async () => {
    const cwd = await tempProject();
    const result = await runInstall({
      cwd,
      platform: "agents-md",
      skillIds: ["global"],
      dryRun: true,
      yes: true,
      showFetchMessage: false,
    });

    assert.ok(result.result.written.length > 0);
    assert.equal(result.manifestPath, undefined);

    const { access } = await import("node:fs/promises");
    await assert.rejects(() => access(join(cwd, "AGENTS.md")));
  });

  it("uses replace as yesConflictDefault for update-style runs", async () => {
    const cwd = await tempProject();
    const dest = join(cwd, "AGENTS.md");
    const { writeFile } = await import("node:fs/promises");
    await writeFile(dest, "# Old content\n");

    await runInstall({
      cwd,
      platform: "agents-md",
      skillIds: ["global"],
      yes: true,
      yesConflictDefault: "replace",
      showFetchMessage: false,
    });

    const content = await readFile(dest, "utf8");
    assert.doesNotMatch(content, /Old content/);
    assert.match(content, /Constrain decisions/);
  });
});
