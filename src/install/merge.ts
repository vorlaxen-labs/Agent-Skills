import { stripWatermark } from "../markdown.js";
import type { AppendOrder } from "../conflict/types.js";

export const SECTION_SEPARATOR = "\n\n---\n\n";

export function mergeContent(
  existing: string,
  incoming: string,
  order: AppendOrder,
): string {
  const cleanExisting = stripWatermark(existing).trim();
  const cleanIncoming = stripWatermark(incoming).trim();

  if (!cleanExisting) return cleanIncoming;
  if (!cleanIncoming) return cleanExisting;

  return order === "existing-first"
    ? `${cleanExisting}${SECTION_SEPARATOR}${cleanIncoming}`
    : `${cleanIncoming}${SECTION_SEPARATOR}${cleanExisting}`;
}
