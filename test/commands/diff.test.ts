import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { runDiff } from "../../src/commands/diff.js";
import { runInit } from "../../src/commands/init.js";

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-skills-diff-"));
}

describe("runDiff", () => {
  it("reports unchanged after fresh install", async () => {
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
      await runDiff({ cwd, json: true });
    } finally {
      console.log = original;
    }

    const output = logs.join("\n");
    const parsed = JSON.parse(output) as { files: { status: string }[] };
    assert.ok(parsed.files.every((f) => f.status === "unchanged"));
  });

  it("reports modify when local file differs", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      yes: true,
      json: true,
    });

    await writeFile(join(cwd, "AGENTS.md"), "# Different content\n");

    const logs: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => logs.push(String(args[0]));
    try {
      await runDiff({ cwd, json: true });
    } finally {
      console.log = original;
    }

    const parsed = JSON.parse(logs[0]!) as { files: { status: string }[] };
    assert.ok(parsed.files.some((f) => f.status === "modify"));
  });
});
