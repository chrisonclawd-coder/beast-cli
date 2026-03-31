/**
 * Beast CLI — Skills & Hooks
 * 
 * Inspired by Claude Code's skills + hooks system.
 */

// ============ SKILLS ============

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

// ============ HOOKS ============

export type HookEvent =
  | "beforeToolCall"
  | "afterToolCall"
  | "beforeFileWrite"
  | "afterFileWrite"
  | "beforeBash"
  | "afterBash"
  | "onSessionStart"
  | "onSessionEnd"
  | "onCompaction"
  | "onError"

export interface Hook {
  event: HookEvent
  command: string          // shell command to run
  condition?: string       // optional condition expression
  timeout?: number         // ms
}

export interface HookContext {
  event: HookEvent
  tool?: string
  params?: Record<string, unknown>
  result?: unknown
  session?: string
  timestamp: number
}
