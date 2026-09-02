export interface PlannedWrite {
  dest: string;
  content: string;
}

export interface PlannedAction {
  dest: string;
  action: "create" | "replace" | "append" | "skip";
}
