import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveRemoteRef } from "../src/source/resolve.js";

describe("resolveRemoteRef", () => {
  it("returns null for bundled (default)", () => {
    assert.equal(resolveRemoteRef(undefined, "1.0.0"), null);
    assert.equal(resolveRemoteRef(false, "1.0.0"), null);
  });

  it("maps bare --remote to version tag", () => {
    assert.equal(resolveRemoteRef(true, "1.2.0"), "v1.2.0");
  });

  it("passes explicit ref through", () => {
    assert.equal(resolveRemoteRef("main", "1.0.0"), "main");
    assert.equal(resolveRemoteRef("v2.0.0", "1.0.0"), "v2.0.0");
  });
});
