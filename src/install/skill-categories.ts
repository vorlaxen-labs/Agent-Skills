import { SKILLS } from "../catalog.js";

export function auditSkillIds(skillIds: string[]): string[] {
  const auditIds = new Set(
    SKILLS.filter((s) => s.category === "audit").map((s) => s.id),
  );
  return skillIds.filter((id) => auditIds.has(id));
}
