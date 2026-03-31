/**
 * Beast CLI — Skills Loader
 * 
 * Load and manage skills from .beast/skills/
 * Inspired by Claude Code's skills system.
 */

import * as fs from "fs/promises"
import * as path from "path"
import { glob } from "glob"
import type { Skill, SkillManifest } from "./types"

export interface SkillLoaderConfig {
  skillsDir: string
  cacheEnabled: boolean
}

export interface LoadedSkill extends Skill {
  id: string
  path: string
  enabled: boolean
}

/**
 * Skill Loader - handles loading skills from .beast/skills/
 */
export class SkillLoader {
  private skillsDir: string
  private cache: Map<string, LoadedSkill> = new Map()
  private cacheEnabled: boolean

  constructor(config: SkillLoaderConfig) {
    this.skillsDir = config.skillsDir
    this.cacheEnabled = config.cacheEnabled
  }

  /**
   * Load all skills from the skills directory
   */
  async loadAll(): Promise<LoadedSkill[]> {
    const skills: LoadedSkill[] = []
    this.cache.clear()

    try {
      // Find all SKILL.md files
      const skillFiles = await this.findSkillFiles()
      
      for (const file of skillFiles) {
        const skill = await this.loadSkill(file)
        if (skill) {
          skills.push(skill)
          this.cache.set(skill.id, skill)
        }
      }
    } catch (error) {
      // Skills directory might not exist
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.warn(`Failed to load skills: ${error}`)
      }
    }

    return skills
  }

  /**
   * Load a single skill by ID
   */
  async load(skillId: string): Promise<LoadedSkill | null> {
    // Check cache first
    if (this.cacheEnabled && this.cache.has(skillId)) {
      return this.cache.get(skillId)!
    }

    const skillPath = path.join(this.skillsDir, skillId, "SKILL.md")
    const skill = await this.loadSkill(skillPath)
    
    if (skill) {
      this.cache.set(skillId, skill)
    }
    
    return skill
  }

  /**
   * Get all cached skills
   */
  getCached(): LoadedSkill[] {
    return Array.from(this.cache.values())
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Find all SKILL.md files
   */
  private async findSkillFiles(): Promise<string[]> {
    const pattern = path.join(this.skillsDir, "**/SKILL.md")
    
    try {
      const matches = await glob(pattern)
      return matches
    } catch {
      return []
    }
  }

  /**
   * Load a skill from a SKILL.md file
   */
  private async loadSkill(skillPath: string): Promise<LoadedSkill | null> {
    try {
      const content = await fs.readFile(skillPath, "utf-8")
      const parsed = this.parseSkillMarkdown(content, skillPath)
      return parsed
    } catch {
      return null
    }
  }

  /**
   * Parse a SKILL.md file
   */
  private parseSkillMarkdown(content: string, filePath: string): LoadedSkill {
    const id = path.basename(path.dirname(filePath))
    
    // Extract frontmatter if present
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/)
    let metadata: Record<string, unknown> = {}
    let body = content

    if (frontmatterMatch) {
      metadata = this.parseYamlFrontmatter(frontmatterMatch[1])
      body = content.slice(frontmatterMatch[0].length).trim()
    }

    // Extract title from first heading
    const titleMatch = body.match(/^#\s+(.+)$/m)
    const name = (metadata.name as string) || titleMatch?.[1] || id

    // Extract description
    const descMatch = body.match(/(?:^#\s+.+\n+)(.+?)(?=\n\n|\n#|$)/s)
    const description = (metadata.description as string) || descMatch?.[1]?.trim() || ""

    // Parse skill data
    const skill: LoadedSkill = {
      id,
      name,
      description,
      prompt: body,
      path: filePath,
      enabled: true,
    }

    // Add optional fields from frontmatter
    if (metadata.tools) {
      skill.tools = metadata.tools as string[]
    }
    if (metadata.model) {
      skill.model = metadata.model as string
    }
    if (metadata.permission) {
      skill.permission = metadata.permission as "auto" | "ask" | "deny"
    }
    if (metadata.files) {
      skill.files = metadata.files as string[]
    }

    return skill
  }

  /**
   * Simple YAML frontmatter parser
   */
  private parseYamlFrontmatter(yaml: string): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    const lines = yaml.split("\n")

    for (const line of lines) {
      const match = line.match(/^(\w+):\s*(.+)$/)
      if (match) {
        const key = match[1]
        let value: unknown = match[2].trim()

        // Parse arrays
        if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
          value = value
            .slice(1, -1)
            .split(",")
            .map(v => v.trim().replace(/^["']|["']$/g, ""))
        }

        result[key] = value
      }
    }

    return result
  }
}

/**
 * Create a skill loader for a project
 */
export function createSkillLoader(projectRoot: string): SkillLoader {
  return new SkillLoader({
    skillsDir: path.join(projectRoot, ".beast", "skills"),
    cacheEnabled: true,
  })
}

// Global skill loader
let globalSkillLoader: SkillLoader | null = null

export function getSkillLoader(projectRoot?: string): SkillLoader {
  if (!globalSkillLoader || projectRoot) {
    globalSkillLoader = createSkillLoader(projectRoot || process.cwd())
  }
  return globalSkillLoader
}
