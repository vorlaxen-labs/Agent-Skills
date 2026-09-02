import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { runDoctor } from "../../src/commands/doctor.js";
import { runInit } from "../../src/commands/init.js";

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-skills-doctor-"));
}

describe("runDoctor", () => {
  it("returns exit code 1 when no manifest", async () => {
    const cwd = await tempProject();
    const code = await runDoctor({ cwd, json: true });
    assert.equal(code, 1);
  });

  it("returns 0 for healthy installation", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      yes: true,
      json: true,
    });

    const code = await runDoctor({ cwd, json: true });
    assert.equal(code, 0);
  });

  it("reports missing files", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      yes: true,
      json: true,
    });

    const agentsPath = join(cwd, "AGENTS.md");
    const { unlink } = await import("node:fs/promises");
    await unlink(agentsPath);

    const code = await runDoctor({ cwd, json: true });
    assert.equal(code, 1);
  });

  it("warns when watermark is missing (modified file)", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      yes: true,
      json: true,
    });

    await writeFile(join(cwd, "AGENTS.md"), "# User modified\n");

    const code = await runDoctor({ cwd, json: true });
    assert.equal(code, 0);
  });
});
