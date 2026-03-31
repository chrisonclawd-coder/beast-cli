/**
 * Beast CLI — Skills Types
 * 
 * Types for the skills system.
 */

export interface Skill {
  name: string
  description: string
  prompt: string
  tools?: string[]         // allowed tool names
  model?: string           // preferred model
  permission?: "auto" | "ask" | "deny"
  files?: string[]         // relevant file globs
}

export interface SkillManifest {
  version: 1
  skills: Record<string, Skill>
}
