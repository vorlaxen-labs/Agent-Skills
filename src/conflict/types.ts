export type ConflictStrategy = "replace" | "append" | "skip";
export type AppendOrder = "existing-first" | "vorlaxen-first";

export interface ConflictPolicy {
  strategy: ConflictStrategy;
  appendOrder?: AppendOrder;
}

export interface ConflictResolveOptions {
  yes?: boolean;
  onConflict?: ConflictStrategy;
  appendOrder?: AppendOrder;
  interactive?: boolean;
}
