import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { runInit } from "../../src/commands/init.js";
import { runStatus } from "../../src/commands/status.js";

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-skills-status-"));
}

describe("runStatus", () => {
  it("reports installed state as JSON", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      yes: true,
      json: true,
    });

    const logs: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => logs.push(String(args[0]));
    try {
      await runStatus({ cwd, json: true });
    } finally {
      console.log = original;
    }

    const parsed = JSON.parse(logs[0]!) as { installed: boolean; platform: string };
    assert.equal(parsed.installed, true);
    assert.equal(parsed.platform, "agents-md");
  });
});
