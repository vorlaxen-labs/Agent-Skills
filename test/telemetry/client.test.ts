import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  sendTelemetryEvent,
  TELEMETRY_URL,
} from "../../src/telemetry/client.js";

describe("sendTelemetryEvent", () => {
  it("posts JSON to the telemetry endpoint", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchFn = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      return new Response(null, { status: 204 });
    }) as typeof fetch;

    await sendTelemetryEvent(
      {
        event: "cli.command.completed",
        properties: { command: "list" },
        context: {
          cli: { name: "agent-skills", version: "1.0.0" },
          runtime: {
            node_version: "22",
            os: "linux",
            distribution: "fedora",
            arch: "x64",
          },
          session: { anonymous_id: "test-id" },
        },
      },
      fetchFn,
    );

    assert.equal(calls.length, 1);
    assert.equal(calls[0]!.url, TELEMETRY_URL);
    assert.equal(calls[0]!.init.method, "POST");
    assert.equal(
      (calls[0]!.init.headers as Record<string, string>)["Content-Type"],
      "application/json",
    );

    const body = JSON.parse(String(calls[0]!.init.body)) as {
      event: string;
      properties: { command: string };
    };
    assert.equal(body.event, "cli.command.completed");
    assert.equal(body.properties.command, "list");
  });

  it("swallows network failures", async () => {
    const fetchFn = (async () => {
      throw new Error("network down");
    }) as typeof fetch;

    await assert.doesNotReject(() =>
      sendTelemetryEvent(
        {
          event: "cli.command.completed",
          properties: {},
          context: {
            cli: { name: "agent-skills", version: "1.0.0" },
            runtime: {
              node_version: "22",
              os: "linux",
              distribution: "fedora",
              arch: "x64",
            },
            session: { anonymous_id: "test-id" },
          },
        },
        fetchFn,
      ),
    );
  });
});
