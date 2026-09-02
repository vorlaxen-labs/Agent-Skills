import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import { TELEMETRY_URL } from "../../src/telemetry/client.js";
import { resetSessionIdForTests } from "../../src/telemetry/context.js";
import {
  extractCommandProperties,
  isTelemetryEnabled,
  trackCommand,
  trackEvent,
} from "../../src/telemetry/track.js";

describe("isTelemetryEnabled", () => {
  const original = process.env.VORLAXEN_TELEMETRY;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.VORLAXEN_TELEMETRY;
    } else {
      process.env.VORLAXEN_TELEMETRY = original;
    }
  });

  it("is enabled by default", () => {
    delete process.env.VORLAXEN_TELEMETRY;
    assert.equal(isTelemetryEnabled(false), true);
  });

  it("respects --no-telemetry flag", () => {
    assert.equal(isTelemetryEnabled(true), false);
  });

  it("respects VORLAXEN_TELEMETRY env", () => {
    process.env.VORLAXEN_TELEMETRY = "0";
    assert.equal(isTelemetryEnabled(false), false);

    process.env.VORLAXEN_TELEMETRY = "no";
    assert.equal(isTelemetryEnabled(false), false);

    process.env.VORLAXEN_TELEMETRY = "false";
    assert.equal(isTelemetryEnabled(false), false);
  });
});

describe("extractCommandProperties", () => {
  it("extracts install-related fields", () => {
    const props = extractCommandProperties(
      "init",
      {
        platform: "cursor",
        skills: ["global", "web-frontend"],
        remote: true,
        dryRun: true,
      },
      [],
    );

    assert.deepEqual(props, {
      platform: "cursor",
      skills_count: 2,
      remote: true,
      dry_run: true,
    });
  });

  it("uses positional args for add/remove skill counts", () => {
    const props = extractCommandProperties("add", {}, ["bar-js", "huk-js"]);
    assert.equal(props.skills_count, 2);
  });
});

describe("trackEvent", () => {
  const original = process.env.VORLAXEN_TELEMETRY;
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    resetSessionIdForTests();
    globalThis.fetch = originalFetch;
    if (original === undefined) {
      delete process.env.VORLAXEN_TELEMETRY;
    } else {
      process.env.VORLAXEN_TELEMETRY = original;
    }
  });

  it("does not send when telemetry is disabled", async () => {
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      return new Response(null, { status: 204 });
    }) as typeof fetch;

    trackEvent("cli.command.completed", { command: "list" }, { noTelemetry: true });
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(called, false);
  });

  it("sends event payload with event, properties, and context", async () => {
    delete process.env.VORLAXEN_TELEMETRY;

    let body: unknown;
    globalThis.fetch = (async (_url, init) => {
      body = JSON.parse(String(init?.body));
      return new Response(null, { status: 204 });
    }) as typeof fetch;

    trackEvent("cli.command.completed", {
      command: "init",
      duration_ms: 100,
      exit_code: 0,
    });

    await new Promise((resolve) => setTimeout(resolve, 20));

    assert.equal(typeof body, "object");
    const event = body as {
      event: string;
      properties: { command: string };
      context: {
        cli: { name: string; version: string };
        runtime: { node_version: string; os: string; distribution: string; arch: string };
        session: { anonymous_id: string };
      };
    };

    assert.equal(event.event, "cli.command.completed");
    assert.equal(event.properties.command, "init");
    assert.equal(event.context.cli.name, "agent-skills");
    assert.match(event.context.runtime.node_version, /^\d+$/);
    assert.equal(typeof event.context.session.anonymous_id, "string");
  });

  it("trackCommand builds cli.command.completed payload", async () => {
    delete process.env.VORLAXEN_TELEMETRY;

    let url = "";
    let body: unknown;
    globalThis.fetch = (async (requestUrl, init) => {
      url = String(requestUrl);
      body = JSON.parse(String(init?.body));
      return new Response(null, { status: 204 });
    }) as typeof fetch;

    trackCommand({
      command: "init",
      durationMs: 842,
      exitCode: 0,
      commandOpts: {
        platform: "cursor",
        skills: ["global", "web-frontend", "bar-js"],
        remote: false,
      },
      args: [],
    });

    await new Promise((resolve) => setTimeout(resolve, 20));

    assert.equal(url, TELEMETRY_URL);
    const event = body as {
      event: string;
      properties: {
        command: string;
        duration_ms: number;
        exit_code: number;
        platform: string;
        skills_count: number;
      };
    };

    assert.equal(event.event, "cli.command.completed");
    assert.equal(event.properties.command, "init");
    assert.equal(event.properties.duration_ms, 842);
    assert.equal(event.properties.exit_code, 0);
    assert.equal(event.properties.platform, "cursor");
    assert.equal(event.properties.skills_count, 3);
  });
});
