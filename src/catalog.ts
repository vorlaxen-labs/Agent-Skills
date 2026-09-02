export type Platform = "agents-md" | "cursor" | "claude-code" | "copilot";

export type SkillCategory = "standard" | "domain" | "library";

export interface SkillDefinition {
  id: string;
  label: string;
  category: SkillCategory;
  /** Paths relative to repo root — fetched selectively */
  paths: string[];
  /** Cursor skill directory name */
  cursorSkillName: string;
  /** Claude Code rule filename (without path) */
  claudeRuleName: string;
  defaultSelected: boolean;
}

export const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "agents-md", label: "AGENTS.md" },
  { id: "cursor", label: "Cursor" },
  { id: "claude-code", label: "Claude Code" },
  { id: "copilot", label: "Copilot" },
];

export const SKILLS: SkillDefinition[] = [
  {
    id: "global",
    label: "Global",
    category: "standard",
    paths: ["AGENTS.md", "skills/global", "rules/global.mdc"],
    cursorSkillName: "global",
    claudeRuleName: "global.md",
    defaultSelected: true,
  },
  {
    id: "web-frontend",
    label: "Web Frontend",
    category: "domain",
    paths: ["skills/web/frontend"],
    cursorSkillName: "web-frontend",
    claudeRuleName: "web-frontend.md",
    defaultSelected: true,
  },
  {
    id: "web-backend",
    label: "Web Backend",
    category: "domain",
    paths: ["skills/web/backend"],
    cursorSkillName: "web-backend",
    claudeRuleName: "web-backend.md",
    defaultSelected: true,
  },
  {
    id: "bar-js",
    label: "bar-js",
    category: "library",
    paths: ["skills/libraries/bar-js"],
    cursorSkillName: "bar-js",
    claudeRuleName: "bar-js.md",
    defaultSelected: false,
  },
  {
    id: "huk-js",
    label: "huk-js",
    category: "library",
    paths: ["skills/libraries/huk-js"],
    cursorSkillName: "huk-js",
    claudeRuleName: "huk-js.md",
    defaultSelected: false,
  },
  {
    id: "kargomucuz-sdk",
    label: "kargomucuz-sdk",
    category: "library",
    paths: ["skills/libraries/kargomucuz-sdk"],
    cursorSkillName: "kargomucuz-sdk",
    claudeRuleName: "kargomucuz-sdk.md",
    defaultSelected: false,
  },
];

export const GITHUB = {
  owner: "vorlaxen-labs",
  repo: "agent-skills",
  branch: "main",
} as const;
