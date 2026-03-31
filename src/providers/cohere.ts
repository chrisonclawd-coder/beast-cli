/**
 * Beast CLI — Cohere Provider
 * 
 * Cohere API integration - enterprise LLMs.
 * https://docs.cohere.com/docs
 * 
 * Note: Cohere uses its own API format (not OpenAI-compatible).
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
  ToolCall,
} from "./types"

// Cohere API types
interface CohereMessage {
  role: "system" | "user" | "assistant" | "tool"
  content: string
  tool_call_id?: string
  tool_calls?: CohereToolCall[]
}

interface CohereToolCall {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string
  }
}

interface CohereResponse {
  id: string
  message: {
    role: string
    content: string | null
    tool_calls?: CohereToolCall[]
  }
  finish_reason: string
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// Known Cohere models
const COHERE_MODELS: Model[] = [
  {
    id: "command-a-03-2025",
    name: "Command A",
    contextWindow: 256000,
    maxOutputTokens: 8000,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "command-r7b-12-2024",
    name: "Command R7B",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "command-r-plus-08-2024",
    name: "Command R+",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "command-r-08-2024",
    name: "Command R",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "command",
    name: "Command",
    contextWindow: 4096,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "command-light",
    name: "Command Light",
    contextWindow: 4096,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: false,
    supportsVision: false,
  },
  {
    id: "command-nightly",
    name: "Command Nightly",
    contextWindow: 4096,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
]

export class CohereProvider implements Provider {
  readonly id = "cohere"
  readonly name = "Cohere"

  private apiKey: string
  private baseUrl: string
  private defaultModel: string

  constructor(config: ProviderConfig = {}) {
    this.apiKey = config.apiKey || process.env.CO_API_KEY || ""
    this.baseUrl = config.baseUrl || "https://api.cohere.com/v2"
    this.defaultModel = config.model || "command-a-03-2025"

    if (!this.apiKey) {
      console.warn("Cohere API key not set. Set CO_API_KEY environment variable.")
    }
  }

  async listModels(): Promise<Model[]> {
    return COHERE_MODELS
  }

  async complete(messages: Message[], options?: CompleteOptions): Promise<CompleteResponse> {
    const model = options?.model || this.defaultModel
    
    const cohereMessages = this.convertMessages(messages, options?.systemPrompt)
    const body: Record<string, unknown> = {
      model,
      messages: cohereMessages,
      max_tokens: options?.maxTokens || 4096,
    }

    if (options?.temperature !== undefined) {
      body.temperature = options.temperature
    }

    if (options?.tools && options.tools.length > 0) {
      body.tools = this.convertTools(options.tools)
    }

    const response = await fetch(`${this.baseUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: options?.signal,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Cohere API error: ${response.status} - ${error}`)
    }

    const data: CohereResponse = await response.json()

    return {
      content: data.message.content || "",
      toolCalls: data.message.tool_calls?.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      })),
      usage: {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
      },
      model: model,
    }
  }

  async *stream(messages: Message[], options?: CompleteOptions): AsyncIterableIterator<ResponseChunk> {
    const model = options?.model || this.defaultModel
    
    const cohereMessages = this.convertMessages(messages, options?.systemPrompt)
    const body: Record<string, unknown> = {
      model,
      messages: cohereMessages,
      max_tokens: options?.maxTokens || 4096,
      stream: true,
    }

    if (options?.temperature !== undefined) {
      body.temperature = options.temperature
    }

    if (options?.tools && options.tools.length > 0) {
      body.tools = this.convertTools(options.tools)
    }

    const response = await fetch(`${this.baseUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: options?.signal,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Cohere API error: ${response.status} - ${error}`)
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
            if (data === "[DONE]") {
              yield { type: "done" }
              return
            }

            try {
              const parsed = JSON.parse(data)
              
              // Cohere streaming format
              if (parsed.type === "content-delta" && parsed.delta?.message?.content?.text) {
                yield { type: "text", content: parsed.delta.message.content.text }
              }

              if (parsed.type === "tool-call-chunk" && parsed.delta?.message?.tool_calls) {
                for (const tc of parsed.delta.message.tool_calls) {
                  if (tc.function?.name) {
                    yield {
                      type: "tool_call",
                      toolCall: {
                        id: tc.id,
                        name: tc.function.name,
                        arguments: {},
                      },
                    }
                  }
                }
              }

              if (parsed.type === "message-end" && parsed.usage) {
                yield {
                  type: "done",
                  usage: {
                    inputTokens: parsed.usage.tokens?.input || 0,
                    outputTokens: parsed.usage.tokens?.output || 0,
                  },
                }
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

  private convertMessages(messages: Message[], systemPrompt?: string): CohereMessage[] {
    const result: CohereMessage[] = []

    if (systemPrompt) {
      result.push({ role: "system", content: systemPrompt })
    }

    for (const msg of messages) {
      const cohereMsg: CohereMessage = {
        role: msg.role,
        content: msg.content,
      }

      if (msg.toolCallId) {
        cohereMsg.tool_call_id = msg.toolCallId
      }

      if (msg.toolCalls) {
        cohereMsg.tool_calls = msg.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          },
        }))
      }

      result.push(cohereMsg)
    }

    return result
  }

  private convertTools(tools: ToolDefinition[]): unknown[] {
    return tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }))
  }
}

// Factory function
export function createCohereProvider(config: ProviderConfig = {}): Provider {
  return new CohereProvider(config)
}
