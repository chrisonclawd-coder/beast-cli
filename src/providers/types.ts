/**
 * Beast CLI — Provider Interface
 * 
 * Unified interface for all LLM providers.
 * Inspired by OpenCode's provider-agnostic design.
 */

export interface Message {
  role: "system" | "user" | "assistant" | "tool"
  content: string
  toolCallId?: string
  toolCalls?: ToolCall[]
}

export interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface ResponseChunk {
  type: "text" | "tool_call" | "tool_result" | "thinking" | "reasoning" | "done"
  content?: string
  toolCall?: ToolCall
  toolResult?: { id: string; content: string }
  usage?: Usage
}

export interface Usage {
  inputTokens: number
  outputTokens: number
  cacheReadTokens?: number
  cacheWriteTokens?: number
}

export interface Model {
  id: string
  name: string
  contextWindow: number
  maxOutputTokens: number
  supportsStreaming: boolean
  supportsToolCalls: boolean
  supportsVision: boolean
  costPerToken?: { input: number; output: number }
}

export interface ProviderConfig {
  apiKey?: string
  baseUrl?: string
  model?: string
  [key: string]: unknown
}

export interface Provider {
  readonly id: string
  readonly name: string

  listModels(): Promise<Model[]>
  complete(messages: Message[], options?: CompleteOptions): Promise<CompleteResponse>
  stream(messages: Message[], options?: CompleteOptions): AsyncIterableIterator<ResponseChunk>
}

export interface CompleteOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  tools?: ToolDefinition[]
  systemPrompt?: string
  signal?: AbortSignal
}

export interface CompleteResponse {
  content: string
  toolCalls?: ToolCall[]
  usage: Usage
  model: string
}

export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown> // JSON Schema
}
