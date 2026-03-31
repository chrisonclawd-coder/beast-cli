/**
 * Beast CLI — Hooks Types
 * 
 * Types for the hooks system.
 */

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
