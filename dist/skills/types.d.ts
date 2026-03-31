/**
 * Beast CLI — Skills Types
 *
 * Types for the skills system.
 */
export interface Skill {
    name: string;
    description: string;
    prompt: string;
    tools?: string[];
    model?: string;
    permission?: "auto" | "ask" | "deny";
    files?: string[];
}
export interface SkillManifest {
    version: 1;
    skills: Record<string, Skill>;
}
