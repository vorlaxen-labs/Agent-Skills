import assert from "node:assert/strict";
import { mkdtemp, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { runAdd } from "../../src/commands/add.js";
import { runInit } from "../../src/commands/init.js";

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-skills-add-"));
}

describe("runAdd", () => {
  it("adds a library skill to existing install", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      yes: true,
      json: true,
    });

    await runAdd({
      cwd,
      skillIds: ["bar-js"],
      yes: true,
      json: true,
    });

    await stat(join(cwd, ".agent-skills", "bar-js", "SKILL.md"));
  });
});
