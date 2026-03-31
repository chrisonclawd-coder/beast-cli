/**
 * Beast CLI — Skills Loader
 *
 * Load and manage skills from .beast/skills/
 * Inspired by Claude Code's skills system.
 */
import type { Skill } from "./types";
export interface SkillLoaderConfig {
    skillsDir: string;
    cacheEnabled: boolean;
}
export interface LoadedSkill extends Skill {
    id: string;
    path: string;
    enabled: boolean;
}
/**
 * Skill Loader - handles loading skills from .beast/skills/
 */
export declare class SkillLoader {
    private skillsDir;
    private cache;
    private cacheEnabled;
    constructor(config: SkillLoaderConfig);
    /**
     * Load all skills from the skills directory
     */
    loadAll(): Promise<LoadedSkill[]>;
    /**
     * Load a single skill by ID
     */
    load(skillId: string): Promise<LoadedSkill | null>;
    /**
     * Get all cached skills
     */
    getCached(): LoadedSkill[];
    /**
     * Clear the cache
     */
    clearCache(): void;
    /**
     * Find all SKILL.md files
     */
    private findSkillFiles;
    /**
     * Load a skill from a SKILL.md file
     */
    private loadSkill;
    /**
     * Parse a SKILL.md file
     */
    private parseSkillMarkdown;
    /**
     * Simple YAML frontmatter parser
     */
    private parseYamlFrontmatter;
}
/**
 * Create a skill loader for a project
 */
export declare function createSkillLoader(projectRoot: string): SkillLoader;
export declare function getSkillLoader(projectRoot?: string): SkillLoader;
