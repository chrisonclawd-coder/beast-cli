/**
 * Beast CLI — Tool Executor
 * 
 * Executes tools with permission checks.
 * Inspired by OpenCode's permission system + Claude Code's tool execution.
 */

import type { Tool, ToolResult, Permission } from "./types"

export type ToolPermission = Permission

export interface ExecutorConfig {
  permissions: Map<string, ToolPermission>
  defaultPermission: ToolPermission
  onPermissionRequest?: (tool: string, params: Record<string, unknown>) => Promise<boolean>
}

export interface ExecutionResult {
  tool: string
  result: ToolResult
  durationMs: number
  permission: "granted" | "denied" | "auto"
}

export interface SimplifiedToolContext {
  workingDir?: string
  sessionId?: string
}

/**
 * Tool Executor - runs tools with permission checks
 */
export class ToolExecutor {
  private tools: Map<string, Tool> = new Map()
  private config: ExecutorConfig

  constructor(config?: Partial<ExecutorConfig>) {
    this.config = {
      permissions: config?.permissions || new Map(),
      defaultPermission: config?.defaultPermission || "ask",
      onPermissionRequest: config?.onPermissionRequest,
    }
  }

  /**
   * Register a tool
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool)
  }

  /**
   * Register multiple tools
   */
  registerTools(tools: Tool[]): void {
    for (const tool of tools) {
      this.registerTool(tool)
    }
  }

  /**
   * Get all registered tools
   */
  getTools(): Tool[] {
    return Array.from(this.tools.values())
  }

  /**
   * Get tool definitions for LLM (JSON Schema format)
   */
  getToolDefinitions(): Array<{
    name: string
    description: string
    parameters: Record<string, unknown>
  }> {
    return this.getTools().map((tool) => {
      // Convert Zod schema to JSON Schema
      const zodSchema = tool.parameters
      const jsonSchema = zodToJsonSchema(zodSchema)
      
      return {
        name: tool.name,
        description: tool.description,
        parameters: jsonSchema,
      }
    })
  }

  /**
   * Check if a tool is registered
   */
  hasTool(name: string): boolean {
    return this.tools.has(name)
  }

  /**
   * Execute a tool with permission check
   */
  async execute(
    toolName: string,
    params: Record<string, unknown>,
    context?: SimplifiedToolContext
  ): Promise<ExecutionResult> {
    const startTime = Date.now()

    // Check if tool exists
    const tool = this.tools.get(toolName)
    if (!tool) {
      return {
        tool: toolName,
        result: {
          success: false,
          content: "",
          error: `Unknown tool: ${toolName}`,
        },
        durationMs: Date.now() - startTime,
        permission: "auto",
      }
    }

    // Check permission
    const permissionResult = await this.checkPermission(toolName, params, tool.defaultPermission)

    if (!permissionResult.allowed) {
      return {
        tool: toolName,
        result: {
          success: false,
          content: "",
          error: "Permission denied",
        },
        durationMs: Date.now() - startTime,
        permission: "denied",
      }
    }

    // Validate parameters using Zod schema
    const validationResult = tool.parameters.safeParse(params)
    if (!validationResult.success) {
      return {
        tool: toolName,
        result: {
          success: false,
          content: "",
          error: `Invalid parameters: ${validationResult.error.errors.map(e => e.message).join(", ")}`,
        },
        durationMs: Date.now() - startTime,
        permission: permissionResult.auto ? "auto" : "granted",
      }
    }

    // Build context
    const toolContext = {
      workingDir: context?.workingDir || process.cwd(),
      sessionId: context?.sessionId || "default",
      permissions: {
        get: (name: string) => this.config.permissions.get(name) || this.config.defaultPermission,
        set: (name: string, perm: Permission) => this.config.permissions.set(name, perm),
        askUser: async () => false, // Default implementation
      },
      askUser: async () => false, // Default implementation
    }

    // Execute the tool
    try {
      const result = await tool.execute(params, toolContext)
      return {
        tool: toolName,
        result,
        durationMs: Date.now() - startTime,
        permission: permissionResult.auto ? "auto" : "granted",
      }
    } catch (error) {
      return {
        tool: toolName,
        result: {
          success: false,
          content: "",
          error: error instanceof Error ? error.message : String(error),
        },
        durationMs: Date.now() - startTime,
        permission: permissionResult.auto ? "auto" : "granted",
      }
    }
  }

  /**
   * Check permission for a tool
   */
  private async checkPermission(
    toolName: string,
    params: Record<string, unknown>,
    toolDefault: Permission
  ): Promise<{ allowed: boolean; auto: boolean }> {
    // Get permission setting (tool default overrides executor default)
    const permission = this.config.permissions.get(toolName) || toolDefault || this.config.defaultPermission

    // Auto-allow
    if (permission === "auto") {
      return { allowed: true, auto: true }
    }

    // Auto-deny
    if (permission === "deny") {
      return { allowed: false, auto: true }
    }

    // Ask for permission
    if (permission === "ask") {
      // If there's a custom permission handler, use it
      if (this.config.onPermissionRequest) {
        const allowed = await this.config.onPermissionRequest(toolName, params)
        return { allowed, auto: false }
      }

      // Default: deny in non-interactive mode
      return { allowed: false, auto: false }
    }

    return { allowed: false, auto: false }
  }

  /**
   * Set permission for a tool
   */
  setPermission(toolName: string, permission: ToolPermission): void {
    this.config.permissions.set(toolName, permission)
  }

  /**
   * Set default permission
   */
  setDefaultPermission(permission: ToolPermission): void {
    this.config.defaultPermission = permission
  }

  /**
   * Clear all permissions
   */
  clearPermissions(): void {
    this.config.permissions.clear()
  }
}

/**
 * Simple Zod to JSON Schema converter
 */
function zodToJsonSchema(zodSchema: unknown): Record<string, unknown> {
  // Basic conversion - in production, use a proper library
  // This is a simplified version
  const schema: Record<string, unknown> = {
    type: "object",
    properties: {},
    required: [],
  }
  
  // For now, return a generic object schema
  // A proper implementation would introspect the Zod schema
  return schema
}

// Create a default executor instance
export const toolExecutor = new ToolExecutor()
