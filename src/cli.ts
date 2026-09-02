#!/usr/bin/env node
import { Command } from "commander";
import { registerInitCommand } from "./commands/init.js";
import { registerListCommand } from "./commands/list.js";
import { getPackageVersion } from "./version.js";

const program = new Command();

program
  .name("agent-skills")
  .description("Install Vorlaxen Agent Skills into your project")
  .version(getPackageVersion());

registerInitCommand(program);
registerListCommand(program);

program.parseAsync().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
