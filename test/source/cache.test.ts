import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { dirname } from "node:path";
import { describe, it } from "node:test";
import {
  cacheFilePath,
  readCache,
  writeCache,
} from "../../src/source/cache.js";

describe("source cache", () => {
  it("writes and reads cached content", async () => {
    const relPath = `test-cache/SKILL.md`;
    const content = "# Cached skill content";

    await writeCache("owner", "repo", "main", relPath, content);
    const cached = await readCache("owner", "repo", "main", relPath);
    assert.equal(cached, content);

    const path = cacheFilePath("owner", "repo", "main", relPath);
    await rm(dirname(path), { recursive: true, force: true });
  });

  it("returns null on cache miss", async () => {
    const result = await readCache("owner", "repo", "missing-ref", "nope/SKILL.md");
    assert.equal(result, null);
  });
});
