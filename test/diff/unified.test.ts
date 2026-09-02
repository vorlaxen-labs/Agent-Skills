import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { compareContent, unifiedDiff } from "../../src/diff/unified.js";

describe("unified diff", () => {
  it("compareContent detects unchanged and modify", () => {
    assert.equal(compareContent("a", "a"), "unchanged");
    assert.equal(compareContent("", "new"), "create");
    assert.equal(compareContent("old", "new"), "modify");
  });

  it("unifiedDiff emits +/- lines", () => {
    const diff = unifiedDiff("a.txt", "b.txt", "line1\nline2", "line1\nline3");
    assert.match(diff, /^--- a\.txt/m);
    assert.match(diff, /^\+\+\+ b\.txt/m);
    assert.match(diff, /^-line2/m);
    assert.match(diff, /^\+line3/m);
  });
});
