import assert from "node:assert/strict";
import { mkdtemp, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { runInit } from "../../src/commands/init.js";
import { runUninstall } from "../../src/commands/uninstall.js";

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-skills-uninstall-"));
}

describe("runUninstall", () => {
  it("removes installed files and manifest with --yes", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      yes: true,
      json: true,
    });

    await runUninstall({ cwd, yes: true, json: true });

    await assert.rejects(() => stat(join(cwd, "AGENTS.md")));
    await assert.rejects(() => stat(join(cwd, ".agent-skills", "manifest.json")));
  });

  it("skips files without watermark unless --force", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      yes: true,
      json: true,
    });

    const dest = join(cwd, "AGENTS.md");
    await writeFile(dest, "# User modified\n");

    const logs: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => logs.push(String(args[0]));
    try {
      await runUninstall({ cwd, yes: true, json: true });
    } finally {
      console.log = original;
    }

    const parsed = JSON.parse(logs[0]!) as { skipped: string[] };
    assert.ok(parsed.skipped.includes(dest));
    await stat(dest);
  });

  it("dry-run lists files without deleting", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
      yes: true,
      json: true,
    });

    await runUninstall({ cwd, yes: true, dryRun: true, json: true });
    await stat(join(cwd, "AGENTS.md"));
  });
});
