/**
 * Beast CLI — Hooks Executor
 * 
 * Execute hooks on various events.
 * Inspired by Claude Code's hooks system.
 */

import { spawn } from "child_process"
import * as path from "path"
import type { Hook, HookEvent, HookContext } from "./types"

export interface HookExecutorConfig {
  projectRoot: string
  timeout: number // Default timeout in ms
  enabled: boolean
  env?: Record<string, string>
}

export interface HookResult {
  hook: Hook
  success: boolean
  output: string
  durationMs: number
  error?: string
}

/**
 * Hook Executor - runs hook commands on events
 */
export class HookExecutor {
  private config: HookExecutorConfig
  private hooks: Map<HookEvent, Hook[]> = new Map()
  private runningHooks: Set<string> = new Set()

  constructor(config: HookExecutorConfig) {
    this.config = config
  }

  /**
   * Register hooks from config
   */
  register(hooks: Record<string, string[]>): void {
    this.hooks.clear()

    for (const [event, commands] of Object.entries(hooks)) {
      const hookEvent = event as HookEvent
      if (!isValidHookEvent(hookEvent)) {
        console.warn(`Unknown hook event: ${event}`)
        continue
      }

      const hookList: Hook[] = commands.map(cmd => ({
        event: hookEvent,
        command: cmd,
        timeout: this.config.timeout,
      }))

      this.hooks.set(hookEvent, hookList)
    }
  }

  /**
   * Add a single hook
   */
  addHook(hook: Hook): void {
    const existing = this.hooks.get(hook.event) || []
    existing.push(hook)
    this.hooks.set(hook.event, existing)
  }

  /**
   * Remove a hook
   */
  removeHook(event: HookEvent, command: string): boolean {
    const hooks = this.hooks.get(event)
    if (!hooks) return false

    const index = hooks.findIndex(h => h.command === command)
    if (index >= 0) {
      hooks.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * Execute all hooks for an event
   */
  async execute(event: HookEvent, context: Partial<HookContext> = {}): Promise<HookResult[]> {
    if (!this.config.enabled) {
      return []
    }

    const hooks = this.hooks.get(event)
    if (!hooks || hooks.length === 0) {
      return []
    }

    const fullContext: HookContext = {
      event,
      timestamp: Date.now(),
      ...context,
    }

    const results: HookResult[] = []

    for (const hook of hooks) {
      // Check condition if present
      if (hook.condition && !this.evaluateCondition(hook.condition, fullContext)) {
        continue
      }

      const result = await this.executeHook(hook, fullContext)
      results.push(result)

      // If a hook fails, we continue but record the failure
      if (!result.success) {
        console.warn(`Hook failed: ${hook.command}`)
      }
    }

    return results
  }

  /**
   * Execute a single hook command
   */
  private async executeHook(hook: Hook, context: HookContext): Promise<HookResult> {
    const startTime = Date.now()
    const hookId = `${hook.event}:${hook.command}`

    // Prevent duplicate execution
    if (this.runningHooks.has(hookId)) {
      return {
        hook,
        success: false,
        output: "",
        durationMs: 0,
        error: "Hook already running",
      }
    }

    this.runningHooks.add(hookId)

    try {
      const result = await this.runCommand(hook.command, context, hook.timeout || this.config.timeout)
      
      return {
        hook,
        success: result.exitCode === 0,
        output: result.stdout + result.stderr,
        durationMs: Date.now() - startTime,
        error: result.exitCode !== 0 ? `Exit code: ${result.exitCode}` : undefined,
      }
    } catch (error) {
      return {
        hook,
        success: false,
        output: "",
        durationMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    } finally {
      this.runningHooks.delete(hookId)
    }
  }

  /**
   * Run a shell command with proper cleanup
   */
  private runCommand(
    command: string,
    context: HookContext,
    timeout: number
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      const env: Record<string, string> = {
        ...process.env,
        ...this.config.env,
        BEAST_EVENT: context.event,
        BEAST_TOOL: context.tool || "",
        BEAST_SESSION: context.session || "",
        BEAST_TIMESTAMP: String(context.timestamp),
      }

      if (context.params) {
        env.BEAST_PARAMS = JSON.stringify(context.params)
      }

      const proc = spawn(command, [], {
        cwd: this.config.projectRoot,
        shell: true,
        env,
        timeout,
      })

      let stdout = ""
      let stderr = ""
      let resolved = false

      const cleanup = () => {
        proc.stdout?.removeAllListeners("data")
        proc.stderr?.removeAllListeners("data")
        proc.removeAllListeners("close")
        proc.removeAllListeners("error")
      }

      proc.stdout?.on("data", (data) => {
        stdout += data.toString()
      })

      proc.stderr?.on("data", (data) => {
        stderr += data.toString()
      })

      proc.on("close", (code) => {
        if (resolved) return
        resolved = true
        cleanup()
        resolve({
          exitCode: code ?? 1,
          stdout,
          stderr,
        })
      })

      proc.on("error", (err) => {
        if (resolved) return
        resolved = true
        cleanup()
        if (!proc.killed) {
          proc.kill()
        }
        resolve({
          exitCode: 1,
          stdout,
          stderr: err.message,
        })
      })
    })
  }

  /**
   * Evaluate a hook condition safely.
   * Only allows a restricted subset of expressions to prevent code injection.
   */
  private evaluateCondition(condition: string, context: HookContext): boolean {
    try {
      // Sanitize condition - only allow safe characters
      // Allowed: alphanumeric, spaces, quotes, comparison operators, logical operators,
      // property access (.), array access ([]), parentheses, includes method
      const safePattern = /^[a-zA-Z0-9_\.\"\'\[\]\s===!<>!==&&||().includes]+$/
      
      if (!safePattern.test(condition)) {
        console.warn(`Hook condition contains disallowed characters: ${condition}`)
        return false
      }
      
      // Block dangerous patterns
      const dangerousPatterns = [
        /eval/i,
        /function\s*\(/i,
        /require\s*\(/i,
        /import\s+/i,
        /process\./i,
        /global\./i,
        /window\./i,
        /document\./i,
        /__proto__/i,
        /\.constructor/i,
        /prototype/i,
      ]
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(condition)) {
          console.warn(`Hook condition contains blocked pattern: ${condition}`)
          return false
        }
      }
      
      // Convert 'contains' to '.includes(' for backwards compatibility
      let sanitizedCondition = condition.replace(/\bcontains\b/g, ".includes(")
      // Fix the syntax: "path contains 'x'" -> "path.includes('x')"
      sanitizedCondition = sanitizedCondition.replace(/\.includes\(([^)]+)\)/g, ".includes($1)")
      
      // Simple condition evaluation with sanitized input
      const fn = new Function(
        "tool", "params", "result", "session",
        `"use strict"; return (${sanitizedCondition})`
      )
      return fn(context.tool, context.params, context.result, context.session)
    } catch {
      console.warn(`Invalid hook condition: ${condition}`)
      return false
    }
  }

  /**
   * Get all registered hooks
   */
  getHooks(event?: HookEvent): Hook[] {
    if (event) {
      return this.hooks.get(event) || []
    }
    
    const all: Hook[] = []
    for (const hooks of this.hooks.values()) {
      all.push(...hooks)
    }
    return all
  }

  /**
   * Clear all hooks
   */
  clear(): void {
    this.hooks.clear()
  }
}

/**
 * Check if an event is a valid hook event
 */
function isValidHookEvent(event: string): event is HookEvent {
  const validEvents: HookEvent[] = [
    "beforeToolCall",
    "afterToolCall",
    "beforeFileWrite",
    "afterFileWrite",
    "beforeBash",
    "afterBash",
    "onSessionStart",
    "onSessionEnd",
    "onCompaction",
    "onError",
  ]
  return validEvents.includes(event as HookEvent)
}

/**
 * Create a hook executor
 */
export function createHookExecutor(projectRoot: string, options?: Partial<HookExecutorConfig>): HookExecutor {
  return new HookExecutor({
    projectRoot,
    timeout: 30000,
    enabled: true,
    ...options,
  })
}

// Global hook executor
let globalHookExecutor: HookExecutor | null = null

export function getHookExecutor(projectRoot?: string): HookExecutor {
  if (!globalHookExecutor || projectRoot) {
    globalHookExecutor = createHookExecutor(projectRoot || process.cwd())
  }
  return globalHookExecutor
}
