import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parsePlatform,
  parseSkillIds,
  ValidationError,
} from "../../src/validate.js";

describe("parsePlatform", () => {
  it("accepts valid platform ids", () => {
    assert.equal(parsePlatform("cursor"), "cursor");
    assert.equal(parsePlatform(" agents-md "), "agents-md");
  });

  it("rejects unknown platform with friendly message", () => {
    assert.throws(
      () => parsePlatform("haciabi"),
      (err: unknown) => {
        assert.ok(err instanceof ValidationError);
        assert.match(
          (err as ValidationError).message,
          /Unknown platform "haciabi"/,
        );
        assert.match(
          (err as ValidationError).message,
          /Available: agents-md, cursor, claude-code, copilot/,
        );
        return true;
      },
    );
  });
});

describe("parseSkillIds", () => {
  it("accepts valid skill ids", () => {
    assert.deepEqual(parseSkillIds(["global", "bar-js"]), ["global", "bar-js"]);
    assert.deepEqual(parseSkillIds([" global ", "web-frontend"]), [
      "global",
      "web-frontend",
    ]);
  });

  it("rejects unknown skill ids", () => {
    assert.throws(
      () => parseSkillIds(["osman"]),
      (err: unknown) => {
        assert.ok(err instanceof ValidationError);
        assert.match((err as ValidationError).message, /Unknown skill "osman"/);
        assert.match((err as ValidationError).message, /Available:/);
        assert.match((err as ValidationError).message, /global/);
        return true;
      },
    );
  });

  it("rejects empty selection", () => {
    assert.throws(
      () => parseSkillIds(["", "  "]),
      (err: unknown) => {
        assert.ok(err instanceof ValidationError);
        assert.match((err as ValidationError).message, /No skills selected/);
        return true;
      },
    );
  });
});
