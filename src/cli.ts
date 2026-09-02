#!/usr/bin/env node
import { Command } from "commander";
import { registerCompletionCommand } from "./commands/completion.js";
import { registerDiffCommand } from "./commands/diff.js";
import { registerDoctorCommand } from "./commands/doctor.js";
import { registerInitCommand } from "./commands/init.js";
import { registerListCommand } from "./commands/list.js";
import { registerUninstallCommand } from "./commands/uninstall.js";
import { registerUpdateCommand } from "./commands/update.js";
import { getPackageVersion } from "./version.js";

const program = new Command();

program
  .name("agent-skills")
  .description("Install Vorlaxen Agent Skills into your project")
  .version(getPackageVersion());

registerInitCommand(program);
registerListCommand(program);
registerDoctorCommand(program);
registerUpdateCommand(program);
registerDiffCommand(program);
registerUninstallCommand(program);
registerCompletionCommand(program);

program.parseAsync().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
