import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, it } from "node:test";
import { runTelemetry } from "../../src/commands/telemetry.js";
import {
  readTelemetryConfig,
  setTelemetryConfigPathForTests,
} from "../../src/telemetry/config.js";

describe("runTelemetry", () => {
  let tempDir = "";

  afterEach(async () => {
    setTelemetryConfigPathForTests(undefined);
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = "";
    }
  });

  async function useTempConfig(): Promise<void> {
    tempDir = await mkdtemp(join(tmpdir(), "agent-skills-telemetry-cmd-"));
    setTelemetryConfigPathForTests(join(tempDir, "telemetry.json"));
  }

  it("reports status as JSON", async () => {
    await useTempConfig();
    const logs: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => logs.push(String(args[0]));

    try {
      await runTelemetry({ action: "status", json: true });
    } finally {
      console.log = original;
    }

    const parsed = JSON.parse(logs[0]!) as { enabled: boolean; configPath: string };
    assert.equal(parsed.enabled, true);
    assert.match(parsed.configPath, /telemetry\.json$/);
  });

  it("persists no via telemetry command", async () => {
    await useTempConfig();
    await runTelemetry({ action: "no", json: true });

    const config = await readTelemetryConfig();
    assert.equal(config.enabled, false);
  });

  it("persists yes via telemetry command", async () => {
    await useTempConfig();
    await runTelemetry({ action: "no", json: true });
    await runTelemetry({ action: "yes", json: true });

    const config = await readTelemetryConfig();
    assert.equal(config.enabled, true);
  });
});
