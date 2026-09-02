export type ConflictStrategy = "replace" | "append" | "skip" | "inherit";
export type AppendOrder = "existing-first" | "vorlaxen-first";

/** @deprecated Use ConflictPolicyV2 — kept for migration from v1 manifests */
export interface ConflictPolicy {
  strategy: ConflictStrategy;
  appendOrder?: AppendOrder;
}

export interface ConflictPolicyV2 {
  default: ConflictStrategy;
  appendOrder?: AppendOrder;
  overrides?: Record<string, ConflictStrategy>;
}

export interface ConflictResolveOptions {
  yes?: boolean;
  onConflict?: ConflictStrategy;
  appendOrder?: AppendOrder;
  interactive?: boolean;
  conflictOverrides?: Record<string, ConflictStrategy>;
}
