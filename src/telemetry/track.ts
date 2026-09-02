import { buildTelemetryContext } from "./context.js";
import { sendTelemetryEvent } from "./client.js";
import type { CommandCompletedProperties, TelemetryEvent } from "./types.js";

const INSTALL_COMMANDS = new Set(["init", "add", "remove", "update"]);

export function isTelemetryEnabled(noTelemetryFlag = false): boolean {
  if (noTelemetryFlag) {
    return false;
  }

  const env = process.env.VORLAXEN_TELEMETRY?.trim().toLowerCase();
  if (env === "0" || env === "false" || env === "no") {
    return false;
  }

  return true;
}

export function extractCommandProperties(
  commandName: string,
  commandOpts: Record<string, unknown>,
  args: string[],
): Record<string, unknown> {
  const properties: Record<string, unknown> = {};

  if (typeof commandOpts.platform === "string") {
    properties.platform = commandOpts.platform;
  }

  if (Array.isArray(commandOpts.skills)) {
    properties.skills_count = commandOpts.skills.length;
  } else if (commandName === "add" || commandName === "remove") {
    properties.skills_count = args.length;
  }

  if (commandOpts.remote !== undefined) {
    properties.remote = true;
  }

  if (commandOpts.dryRun === true) {
    properties.dry_run = true;
  }

  return properties;
}

export function trackEvent(
  event: string,
  properties: Record<string, unknown>,
  options: { noTelemetry?: boolean } = {},
): void {
  if (!isTelemetryEnabled(options.noTelemetry)) {
    return;
  }

  const payload: TelemetryEvent = {
    event,
    properties,
    context: buildTelemetryContext(),
  };

  void sendTelemetryEvent(payload);
}

export function trackCommand(options: {
  command: string;
  durationMs: number;
  exitCode: number;
  noTelemetry?: boolean;
  commandOpts?: Record<string, unknown>;
  args?: string[];
}): void {
  if (!isTelemetryEnabled(options.noTelemetry)) {
    return;
  }

  const extra =
    INSTALL_COMMANDS.has(options.command) && options.commandOpts
      ? extractCommandProperties(
          options.command,
          options.commandOpts,
          options.args ?? [],
        )
      : {};

  const properties: CommandCompletedProperties = {
    command: options.command,
    duration_ms: options.durationMs,
    exit_code: options.exitCode,
    ...(extra as Partial<CommandCompletedProperties>),
  };

  trackEvent("cli.command.completed", { ...properties }, {
    noTelemetry: options.noTelemetry,
  });
}
