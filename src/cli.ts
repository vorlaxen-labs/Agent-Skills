#!/usr/bin/env node
import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { PLATFORMS, SKILLS } from "./catalog.js";

const program = new Command();

program
  .name("agent-skills")
  .description("Install Vorlaxen Agent Skills into your project")
  .version("1.0.0");

program
  .command("init")
  .description("Interactive setup — pick platform and skills")
  .option("-p, --platform <platform>", `Platform: ${PLATFORMS.map((p) => p.id).join(", ")}`)
  .option(
    "-s, --skills <ids>",
    `Comma-separated skill ids: ${SKILLS.map((s) => s.id).join(", ")}`,
  )
  .option("-r, --remote", "Fetch latest from GitHub instead of bundled copy")
  .option("-y, --yes", "Skip prompts; use defaults (AGENTS.md platform defaults)")
  .option("-C, --cwd <dir>", "Target project directory", process.cwd())
  .action(async (opts) => {
    try {
      await runInit({
        cwd: opts.cwd,
        platform: opts.platform,
        skills: opts.skills?.split(",").map((s: string) => s.trim()),
        remote: opts.remote,
        yes: opts.yes,
      });
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  });

program.parse();
