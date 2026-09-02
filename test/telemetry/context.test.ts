import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getDistribution,
  getNodeMajorVersion,
  getRuntimeContext,
  getSessionId,
  resetSessionIdForTests,
} from "../../src/telemetry/context.js";

describe("telemetry context", () => {
  it("extracts node major version", () => {
    assert.equal(getNodeMajorVersion("v22.20.1"), "22");
    assert.equal(getNodeMajorVersion("v18.0.0"), "18");
  });

  it("maps platform-specific distribution names", () => {
    assert.equal(getDistribution("darwin"), "macos");
    assert.equal(getDistribution("win32"), "windows");
    assert.equal(getDistribution("freebsd"), "freebsd");
  });

  it("builds runtime context with required fields", () => {
    const runtime = getRuntimeContext();
    assert.equal(typeof runtime.node_version, "string");
    assert.equal(typeof runtime.os, "string");
    assert.equal(typeof runtime.distribution, "string");
    assert.equal(typeof runtime.arch, "string");
    assert.match(runtime.node_version, /^\d+$/);
  });

  it("generates a stable session id within one process", () => {
    resetSessionIdForTests();
    const first = getSessionId();
    const second = getSessionId();
    assert.equal(first, second);
  });

  it("generates a new session id after reset", () => {
    resetSessionIdForTests();
    const first = getSessionId();
    resetSessionIdForTests();
    const second = getSessionId();
    assert.notEqual(first, second);
  });
});
