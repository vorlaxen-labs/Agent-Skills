import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bashCompletion, zshCompletion, fishCompletion } from "../../src/commands/completion.js";

describe("shell completion", () => {
  it("generates bash completion with commands", () => {
    const script = bashCompletion();
    assert.match(script, /complete -F _agent_skills_completions agent-skills/);
    assert.match(script, /init/);
    assert.match(script, /doctor/);
    assert.match(script, /update/);
  });

  it("generates zsh completion", () => {
    const script = zshCompletion();
    assert.match(script, /#compdef agent-skills/);
    assert.match(script, /init/);
  });

  it("generates fish completion", () => {
    const script = fishCompletion();
    assert.match(script, /complete -c agent-skills/);
    assert.match(script, /uninstall/);
  });
});
