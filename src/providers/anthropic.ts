/**
 * Beast CLI — Anthropic Provider
 * 
 * Anthropic Claude API integration.
 * Inspired by OpenCode's Anthropic provider.
 */

import type {
  Provider,
  ProviderConfig,
  Model,
  Message,
  CompleteOptions,
  CompleteResponse,
  ResponseChunk,
  ToolDefinition,
} from "./types"

// Known Anthropic models
const ANTHROPIC_MODELS: Model[] = [
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    contextWindow: 200000,
    maxOutputTokens: 64000,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "claude-opus-4-20250514",
    name: "Claude Opus 4",
    contextWindow: 200000,
    maxOutputTokens: 32000,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "claude-3-7-sonnet-20250219",
    name: "Claude 3.7 Sonnet",
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet (v2)",
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
    contextWindow: 200000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    contextWindow: 200000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
]

// Anthropic API types
interface AnthropicMessage {
  role: "user" | "assistant"
  content: string | AnthropicContentBlock[]
}

interface AnthropicContentBlock {
  type: "text" | "tool_use" | "tool_result"
  text?: string
  id?: string
  name?: string
  input?: Record<string, unknown>
  tool_use_id?: string
  content?: string
  is_error?: boolean
}

interface AnthropicResponse {
  id: string
  type: string
  role: "assistant"
  model: string
  content: AnthropicContentBlock[]
  stop_reason: string | null
  stop_sequence: string | null
  usage: {
    input_tokens: number
    output_tokens: number
    cache_creation_input_tokens?: number
    cache_read_input_tokens?: number
  }
}

export class AnthropicProvider implements Provider {
  readonly id = "anthropic"
  readonly name = "Anthropic"

  private apiKey: string
  private baseUrl: string
  private defaultModel: string

  constructor(config: ProviderConfig = {}) {
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || ""
    this.baseUrl = config.baseUrl || "https://api.anthropic.com/v1"
    this.defaultModel = config.model || "claude-sonnet-4-20250514"

    if (!this.apiKey) {
      console.warn("Anthropic API key not set. Set ANTHROPIC_API_KEY environment variable.")
    }
  }

  async listModels(): Promise<Model[]> {
    return ANTHROPIC_MODELS
  }

  async complete(messages: Message[], options?: CompleteOptions): Promise<CompleteResponse> {
    const model = options?.model || this.defaultModel
    
    const { system, anthropicMessages } = this.convertMessages(messages, options?.systemPrompt)
    const body: Record<string, unknown> = {
      model,
      messages: anthropicMessages,
      max_tokens: options?.maxTokens || 4096,
    }

    if (system) {
      body.system = system
    }

    if (options?.tools && options.tools.length > 0) {
      body.tools = this.convertTools(options.tools)
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: options?.signal,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${error}`)
    }

    const data: AnthropicResponse = await response.json()

    // Extract text and tool calls from response
    let content = ""
    const toolCalls: { id: string; name: string; arguments: Record<string, unknown> }[] = []

    for (const block of data.content) {
      if (block.type === "text" && block.text) {
        content += block.text
      } else if (block.type === "tool_use" && block.name) {
        toolCalls.push({
          id: block.id || "",
          name: block.name,
          arguments: (block.input as Record<string, unknown>) || {},
        })
      }
    }

    return {
      content,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        inputTokens: data.usage.input_tokens,
        outputTokens: data.usage.output_tokens,
        cacheReadTokens: data.usage.cache_read_input_tokens,
        cacheWriteTokens: data.usage.cache_creation_input_tokens,
      },
      model: data.model,
    }
  }

  async *stream(messages: Message[], options?: CompleteOptions): AsyncIterableIterator<ResponseChunk> {
    const model = options?.model || this.defaultModel
    
    const { system, anthropicMessages } = this.convertMessages(messages, options?.systemPrompt)
    const body: Record<string, unknown> = {
      model,
      messages: anthropicMessages,
      max_tokens: options?.maxTokens || 4096,
      stream: true,
    }

    if (system) {
      body.system = system
    }

    if (options?.tools && options.tools.length > 0) {
      body.tools = this.convertTools(options.tools)
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: options?.signal,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error("No response body")
    }

    const decoder = new TextDecoder()
    let buffer = ""

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            try {
              const parsed = JSON.parse(data)
              
              if (parsed.type === "content_block_delta") {
                if (parsed.delta?.type === "text_delta" && parsed.delta.text) {
                  yield { type: "text", content: parsed.delta.text }
                }
              } else if (parsed.type === "content_block_start") {
                const block = parsed.content_block
                if (block?.type === "tool_use" && block.name) {
                  yield {
                    type: "tool_call",
                    toolCall: {
                      id: block.id || "",
                      name: block.name,
                      arguments: {},
                    },
                  }
                }
              } else if (parsed.type === "message_delta") {
                if (parsed.usage) {
                  yield {
                    type: "done",
                    usage: {
                      inputTokens: parsed.usage.input_tokens || 0,
                      outputTokens: parsed.usage.output_tokens || 0,
                    },
                  }
                }
              } else if (parsed.type === "message_stop") {
                yield { type: "done" }
                return
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    yield { type: "done" }
  }

  private convertMessages(
    messages: Message[],
    systemPrompt?: string
  ): { system: string | null; anthropicMessages: AnthropicMessage[] } {
    const anthropicMessages: AnthropicMessage[] = []
    let system: string | null = systemPrompt || null

    for (const msg of messages) {
      if (msg.role === "system") {
        // Use first system message if no explicit system prompt
        if (!system) {
          system = msg.content
        }
        continue
      }

      // Anthropic only supports user/assistant roles
      const role = msg.role === "user" || msg.role === "assistant" ? msg.role : "user"

      if (msg.role === "tool") {
        // Tool result
        anthropicMessages.push({
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: msg.toolCallId || "",
              content: msg.content,
            },
          ],
        })
      } else if (msg.toolCalls && msg.toolCalls.length > 0) {
        // Assistant with tool calls
        anthropicMessages.push({
          role: "assistant",
          content: [
            { type: "text", text: msg.content },
            ...msg.toolCalls.map((tc) => ({
              type: "tool_use" as const,
              id: tc.id,
              name: tc.name,
              input: tc.arguments,
            })),
          ],
        })
      } else {
        anthropicMessages.push({
          role,
          content: msg.content,
        })
      }
    }

    return { system, anthropicMessages }
  }

  private convertTools(tools: ToolDefinition[]): unknown[] {
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters,
    }))
  }
}

// Factory function
export function createAnthropicProvider(config: ProviderConfig = {}): Provider {
  return new AnthropicProvider(config)
}
