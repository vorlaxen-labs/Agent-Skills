import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveStrategyForPath } from "../../src/conflict/path-policy.js";

describe("per-file conflict policy", () => {
  it("uses append override for AGENTS.md when default is append", () => {
    const cwd = "/project";
    const strategy = resolveStrategyForPath(`${cwd}/AGENTS.md`, cwd, {
      default: "append",
      overrides: { "AGENTS.md": "append" },
    });
    assert.equal(strategy, "append");
  });

  it("uses replace for rules when default is append", () => {
    const cwd = "/project";
    const strategy = resolveStrategyForPath(
      `${cwd}/.cursor/rules/global.mdc`,
      cwd,
      {
        default: "append",
        overrides: { ".cursor/rules/*": "replace" },
      },
    );
    assert.equal(strategy, "replace");
  });

  it("honors global replace without path overrides", () => {
    const cwd = "/project";
    const strategy = resolveStrategyForPath(`${cwd}/AGENTS.md`, cwd, {
      default: "replace",
      overrides: {},
    });
    assert.equal(strategy, "replace");
  });
});
