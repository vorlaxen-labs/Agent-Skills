import assert from "node:assert/strict";
import { mkdtemp, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { runDoctor } from "../../src/commands/doctor.js";
import { runInit } from "../../src/commands/init.js";

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-skills-doctor-fix-"));
}

describe("doctor --fix", () => {
  it("restores missing files", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      yes: true,
      onConflict: "replace",
      json: true,
    });

    await unlink(join(cwd, "AGENTS.md"));

    const code = await runDoctor({ cwd, fix: true, json: true });
    assert.equal(code, 0);

    const { stat } = await import("node:fs/promises");
    await stat(join(cwd, "AGENTS.md"));
  });
});
