/**
 * Beast CLI — Skills Loader
 *
 * Load and manage skills from .beast/skills/
 * Inspired by Claude Code's skills system.
 */
import * as fs from "fs/promises";
import * as path from "path";
import { glob } from "glob";
/**
 * Skill Loader - handles loading skills from .beast/skills/
 */
export class SkillLoader {
    skillsDir;
    cache = new Map();
    cacheEnabled;
    constructor(config) {
        this.skillsDir = config.skillsDir;
        this.cacheEnabled = config.cacheEnabled;
    }
    /**
     * Load all skills from the skills directory
     */
    async loadAll() {
        const skills = [];
        this.cache.clear();
        try {
            // Find all SKILL.md files
            const skillFiles = await this.findSkillFiles();
            for (const file of skillFiles) {
                const skill = await this.loadSkill(file);
                if (skill) {
                    skills.push(skill);
                    this.cache.set(skill.id, skill);
                }
            }
        }
        catch (error) {
            // Skills directory might not exist
            if (error.code !== "ENOENT") {
                console.warn(`Failed to load skills: ${error}`);
            }
        }
        return skills;
    }
    /**
     * Load a single skill by ID
     */
    async load(skillId) {
        // Check cache first
        if (this.cacheEnabled && this.cache.has(skillId)) {
            return this.cache.get(skillId);
        }
        const skillPath = path.join(this.skillsDir, skillId, "SKILL.md");
        const skill = await this.loadSkill(skillPath);
        if (skill) {
            this.cache.set(skillId, skill);
        }
        return skill;
    }
    /**
     * Get all cached skills
     */
    getCached() {
        return Array.from(this.cache.values());
    }
    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Find all SKILL.md files
     */
    async findSkillFiles() {
        const pattern = path.join(this.skillsDir, "**/SKILL.md");
        try {
            const matches = await glob(pattern);
            return matches;
        }
        catch {
            return [];
        }
    }
    /**
     * Load a skill from a SKILL.md file
     */
    async loadSkill(skillPath) {
        try {
            const content = await fs.readFile(skillPath, "utf-8");
            const parsed = this.parseSkillMarkdown(content, skillPath);
            return parsed;
        }
        catch {
            return null;
        }
    }
    /**
     * Parse a SKILL.md file
     */
    parseSkillMarkdown(content, filePath) {
        const id = path.basename(path.dirname(filePath));
        // Extract frontmatter if present
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        let metadata = {};
        let body = content;
        if (frontmatterMatch) {
            metadata = this.parseYamlFrontmatter(frontmatterMatch[1]);
            body = content.slice(frontmatterMatch[0].length).trim();
        }
        // Extract title from first heading
        const titleMatch = body.match(/^#\s+(.+)$/m);
        const name = metadata.name || titleMatch?.[1] || id;
        // Extract description
        const descMatch = body.match(/(?:^#\s+.+\n+)(.+?)(?=\n\n|\n#|$)/s);
        const description = metadata.description || descMatch?.[1]?.trim() || "";
        // Parse skill data
        const skill = {
            id,
            name,
            description,
            prompt: body,
            path: filePath,
            enabled: true,
        };
        // Add optional fields from frontmatter
        if (metadata.tools) {
            skill.tools = metadata.tools;
        }
        if (metadata.model) {
            skill.model = metadata.model;
        }
        if (metadata.permission) {
            skill.permission = metadata.permission;
        }
        if (metadata.files) {
            skill.files = metadata.files;
        }
        return skill;
    }
    /**
     * Simple YAML frontmatter parser
     */
    parseYamlFrontmatter(yaml) {
        const result = {};
        const lines = yaml.split("\n");
        for (const line of lines) {
            const match = line.match(/^(\w+):\s*(.+)$/);
            if (match) {
                const key = match[1];
                let value = match[2].trim();
                // Parse arrays
                if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
                    value = value
                        .slice(1, -1)
                        .split(",")
                        .map(v => v.trim().replace(/^["']|["']$/g, ""));
                }
                result[key] = value;
            }
        }
        return result;
    }
}
/**
 * Create a skill loader for a project
 */
export function createSkillLoader(projectRoot) {
    return new SkillLoader({
        skillsDir: path.join(projectRoot, ".beast", "skills"),
        cacheEnabled: true,
    });
}
// Global skill loader
let globalSkillLoader = null;
export function getSkillLoader(projectRoot) {
    if (!globalSkillLoader || projectRoot) {
        globalSkillLoader = createSkillLoader(projectRoot || process.cwd());
    }
    return globalSkillLoader;
}
//# sourceMappingURL=loader.js.map