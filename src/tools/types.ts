/**
 * Beast CLI — Tool Interface
 * 
 * The tool system with fine-grained permissions.
 * Inspired by Claude Code's permission modes.
 */

import type { z } from "zod"

export type Permission = "auto" | "ask" | "deny"

export interface ToolResult {
  success: boolean
  content: string
  error?: string
  metadata?: Record<string, unknown>
}

export interface ToolContext {
  workingDir: string
  sessionId: string
  permissions: PermissionSet
  askUser: (message: string) => Promise<boolean>
}

export interface ToolDefinition {
  name: string
  description: string
  parameters: z.ZodType // Zod schema for type-safe validation
  defaultPermission: Permission
}

export interface Tool extends ToolDefinition {
  execute(params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult>
}

export interface PermissionSet {
  get(toolName: string): Permission
  set(toolName: string, permission: Permission): void
  askUser: (toolName: string, params: Record<string, unknown>) => Promise<boolean>
}

// Tool permission config
export interface PermissionConfig {
  mode: "interactive" | "auto" | "plan" | "yolo"
  tools: Record<string, Permission>
}
