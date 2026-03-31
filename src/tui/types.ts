/**
 * Beast CLI — TUI Types
 * 
 * Types for the Ink-based terminal UI.
 */

import type { Message, ResponseChunk } from "../providers/types"
import type { ToolCallRecord } from "../agents/types"

export type TUIState = "idle" | "thinking" | "streaming" | "tool_call" | "waiting_input"

export interface TUIConfig {
  showTokens: boolean
  showTimestamps: boolean
  showToolCalls: boolean
  theme: "dark" | "light"
  vimMode: boolean
  compactMode: boolean
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  toolCalls?: ToolCallRecord[]
  tokens?: { input: number; output: number }
  streaming?: boolean
}

export interface TUIContext {
  messages: ChatMessage[]
  state: TUIState
  currentTool: string | null
  tokenUsage: { input: number; output: number }
  error: string | null
}
