import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { contentAlreadyPresent, mergeContent } from "../../src/install/merge.js";

describe("idempotent merge", () => {
  it("detects incoming content already present", () => {
    const existing = "# Vorlaxen\n\n---\n\n# Old";
    const incoming = "# Vorlaxen";
    assert.ok(contentAlreadyPresent(existing, incoming));
  });

  it("does not duplicate when incoming is subset", () => {
    const result = mergeContent("# Vorlaxen standards", "# Vorlaxen standards", "vorlaxen-first");
    assert.equal(result, "# Vorlaxen standards");
  });
});
