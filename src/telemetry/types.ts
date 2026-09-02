export interface TelemetryCliContext {
  name: string;
  version: string;
}

export interface TelemetryRuntimeContext {
  node_version: string;
  os: string;
  distribution: string;
  arch: string;
}

export interface TelemetrySessionContext {
  anonymous_id: string;
}

export interface TelemetryContext {
  cli: TelemetryCliContext;
  runtime: TelemetryRuntimeContext;
  session: TelemetrySessionContext;
}

export interface TelemetryEvent<TProps = Record<string, unknown>> {
  event: string;
  properties: TProps;
  context: TelemetryContext;
}

export interface CommandCompletedProperties {
  command: string;
  duration_ms: number;
  exit_code: number;
  platform?: string;
  skills_count?: number;
  remote?: boolean;
  dry_run?: boolean;
}
