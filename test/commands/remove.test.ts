import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { runInit } from "../../src/commands/init.js";
import { runRemove } from "../../src/commands/remove.js";

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-skills-remove-"));
}

describe("runRemove", () => {
  it("removes a library skill from installation", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global", "bar-js"],
      yes: true,
      json: true,
    });

    await runRemove({
      cwd,
      skillIds: ["bar-js"],
      yes: true,
      json: true,
    });

    await assert.rejects(() => stat(join(cwd, ".agent-skills", "bar-js", "SKILL.md")));

    const manifest = JSON.parse(
      await readFile(join(cwd, ".agent-skills", "manifest.json"), "utf8"),
    ) as { skills: string[] };
    assert.deepEqual(manifest.skills, ["global"]);
  });
});
