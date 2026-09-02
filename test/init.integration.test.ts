import assert from "node:assert/strict";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { runInit } from "../src/commands/init.js";
import { ValidationError } from "../src/validate.js";
import { WATERMARK } from "../src/utils/watermark.js";

async function tempProject(): Promise<string> {
  return mkdtemp(join(tmpdir(), "agent-skills-test-"));
};

describe("runInit integration", () => {
  it("rejects unknown platform before writing files", async () => {
    const cwd = await tempProject();
    await assert.rejects(
      () =>
        runInit({
          cwd,
          platform: "haciabi",
          skills: ["global"],
        }),
      (err: unknown) => {
        assert.ok(err instanceof ValidationError);
        assert.match((err as ValidationError).message, /Unknown platform/);
        return true;
      },
    );
    await assert.rejects(() => stat(join(cwd, "AGENTS.md")));
  });

  it("rejects unknown skill ids", async () => {
    const cwd = await tempProject();
    await assert.rejects(
      () =>
        runInit({
          cwd,
          platform: "agents-md",
          skills: ["osman"],
        }),
      (err: unknown) => {
        assert.ok(err instanceof ValidationError);
        assert.match((err as ValidationError).message, /Unknown skill/);
        return true;
      },
    );
    await assert.rejects(() => stat(join(cwd, "AGENTS.md")));
  });

  it("installs AGENTS.md from bundled snapshot", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
    });

    const content = await readFile(join(cwd, "AGENTS.md"), "utf8");
    assert.match(content, /Constrain decisions, not implementations/);
    assert.ok(content.includes(WATERMARK));
  });

  it("installs Cursor skill tree from bundled snapshot", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "cursor",
      skills: ["global", "web-frontend"],
    });

    await stat(join(cwd, ".cursor", "rules", "global.mdc"));
    await stat(join(cwd, ".cursor", "skills", "global", "SKILL.md"));
    await stat(join(cwd, ".cursor", "skills", "web-frontend", "SKILL.md"));

    const skill = await readFile(
      join(cwd, ".cursor", "skills", "web-frontend", "SKILL.md"),
      "utf8",
    );
    assert.match(skill, /web-frontend/);
    assert.ok(skill.includes(WATERMARK));
  });

  it("overwrites existing AGENTS.md (current behavior)", async () => {
    const cwd = await tempProject();
    const dest = join(cwd, "AGENTS.md");
    const { writeFile } = await import("node:fs/promises");
    await writeFile(dest, "# Old content\n");

    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global"],
    });

    const content = await readFile(dest, "utf8");
    assert.doesNotMatch(content, /Old content/);
    assert.match(content, /Constrain decisions, not implementations/);
  });

  it("installs library skill reference tree under .agent-skills", async () => {
    const cwd = await tempProject();
    await runInit({
      cwd,
      platform: "agents-md",
      skills: ["global", "bar-js"],
    });

    await stat(join(cwd, ".agent-skills", "bar-js", "SKILL.md"));
    await stat(join(cwd, ".agent-skills", "bar-js", "reference", "api-reference.md"));
  });
});
