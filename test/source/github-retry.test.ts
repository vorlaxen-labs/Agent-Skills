import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";

describe("GitHub fetch retry", () => {
  it("retries on 503 then succeeds", async () => {
    let apiAttempts = 0;
    const originalFetch = globalThis.fetch;

    globalThis.fetch = mock.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("api.github.com")) {
        apiAttempts++;
        if (apiAttempts < 3) {
          return new Response("unavailable", { status: 503 });
        }
        return new Response(
          JSON.stringify({ type: "file", path: "AGENTS.md" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response("# Skill content", { status: 200 });
    }) as typeof fetch;

    try {
      const { createGitHubSource } = await import("../../src/source/github.js");
      const source = createGitHubSource("owner", "repo", "main", { noCache: true });
      const files = await source.fetch(["AGENTS.md"]);

      assert.equal(apiAttempts, 3);
      assert.equal(files.length, 1);
      assert.match(files[0]!.content, /Skill content/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("includes GITHUB_TOKEN guidance on 403", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mock.fn(async () =>
      new Response("rate limit", { status: 403 }),
    ) as typeof fetch;

    try {
      const { createGitHubSource } = await import("../../src/source/github.js");
      const source = createGitHubSource("owner", "repo", "main", { noCache: true });

      await assert.rejects(
        () => source.fetch(["AGENTS.md"]),
        /GITHUB_TOKEN/,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
