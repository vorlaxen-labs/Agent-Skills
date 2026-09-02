#!/usr/bin/env node
import { Command, InvalidArgumentError } from "commander";
import { runInit } from "./commands/init.js";
import { PLATFORMS, SKILLS } from "./catalog.js";
import { parsePlatform, parseSkillIds, ValidationError } from "./validate.js";
import { getPackageVersion } from "./version.js";

const program = new Command();

program
  .name("agent-skills")
  .description("Install Vorlaxen Agent Skills into your project")
  .version(getPackageVersion());

const platformIds = PLATFORMS.map((p) => p.id).join(", ");
const skillIds = SKILLS.map((s) => s.id).join(", ");

program
  .command("init")
  .description("Interactive setup — pick platform and skills")
  .option(
    "-p, --platform <platform>",
    `Platform (${platformIds})`,
    (value: string) => {
      try {
        return parsePlatform(value);
      } catch (err) {
        throw new InvalidArgumentError(
          err instanceof ValidationError ? err.message : String(err),
        );
      }
    },
  )
  .option(
    "-s, --skills <ids>",
    `Comma-separated skill ids (${skillIds})`,
    (value: string) => {
      try {
        return parseSkillIds(value.split(","));
      } catch (err) {
        throw new InvalidArgumentError(
          err instanceof ValidationError ? err.message : String(err),
        );
      }
    },
  )
  .option(
    "-r, --remote [ref]",
    "Fetch from GitHub: omit ref for package version tag, or pass e.g. main for latest",
  )
  .option("-y, --yes", "Skip prompts; use defaults (AGENTS.md platform defaults)")
  .option("-C, --cwd <dir>", "Target project directory", process.cwd())
  .action(async (opts) => {
    try {
      let remote: boolean | string | undefined;
      if (opts.remote !== undefined) {
        remote = opts.remote === true ? true : opts.remote;
      }

      await runInit({
        cwd: opts.cwd,
        platform: opts.platform,
        skills: opts.skills,
        remote,
        yes: opts.yes,
      });
    } catch (err) {
      console.error(err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  });

program.parse();
