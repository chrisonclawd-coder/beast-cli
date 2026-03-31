/**
 * Beast CLI — OpenAI Provider
 * 
 * OpenAI API integration (GPT-4, o1, o3, etc.)
 * Inspired by OpenCode's OpenAI provider.
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

// OpenAI API types
interface OpenAIMessage {
  role: "system" | "user" | "assistant" | "tool"
  content: string
  tool_call_id?: string
  tool_calls?: OpenAIToolCall[]
}

interface OpenAIToolCall {
  id: string
  type: "function"
  function: {
    name: string
    arguments: string
  }
}

interface OpenAIResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string | null
      tool_calls?: OpenAIToolCall[]
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// Known OpenAI models
const OPENAI_MODELS: Model[] = [
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    contextWindow: 1047576,
    maxOutputTokens: 32768,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    contextWindow: 1047576,
    maxOutputTokens: 32768,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    contextWindow: 1047576,
    maxOutputTokens: 32768,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    contextWindow: 128000,
    maxOutputTokens: 16384,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    contextWindow: 128000,
    maxOutputTokens: 16384,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "o1",
    name: "o1",
    contextWindow: 200000,
    maxOutputTokens: 100000,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "o1-mini",
    name: "o1 Mini",
    contextWindow: 128000,
    maxOutputTokens: 65536,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "o3",
    name: "o3",
    contextWindow: 200000,
    maxOutputTokens: 100000,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "o3-mini",
    name: "o3 Mini",
    contextWindow: 200000,
    maxOutputTokens: 100000,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "o4-mini",
    name: "o4 Mini",
    contextWindow: 200000,
    maxOutputTokens: 100000,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
]

export class OpenAIProvider implements Provider {
  readonly id = "openai"
  readonly name = "OpenAI"

  private apiKey: string
  private baseUrl: string
  private defaultModel: string

  constructor(config: ProviderConfig = {}) {
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || ""
    this.baseUrl = config.baseUrl || "https://api.openai.com/v1"
    this.defaultModel = config.model || "gpt-4.1"

    if (!this.apiKey) {
      console.warn("OpenAI API key not set. Set OPENAI_API_KEY environment variable.")
    }
  }

  async listModels(): Promise<Model[]> {
    // Return static list for now (API has /models endpoint but returns limited info)
    return OPENAI_MODELS
  }

  async complete(messages: Message[], options?: CompleteOptions): Promise<CompleteResponse> {
    const model = options?.model || this.defaultModel
    
    const openaiMessages = this.convertMessages(messages, options?.systemPrompt)
    const body: Record<string, unknown> = {
      model,
      messages: openaiMessages,
      max_tokens: options?.maxTokens || 4096,
    }

    if (options?.temperature !== undefined) {
      body.temperature = options.temperature
    }

    if (options?.tools && options.tools.length > 0) {
      body.tools = this.convertTools(options.tools)
      body.tool_choice = "auto"
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
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
      throw new Error(`OpenAI API error: ${response.status} - ${error}`)
    }

    const data: OpenAIResponse = await response.json()
    const choice = data.choices[0]

    return {
      content: choice.message.content || "",
      toolCalls: choice.message.tool_calls?.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments),
      })),
      usage: {
        inputTokens: data.usage.prompt_tokens,
        outputTokens: data.usage.completion_tokens,
      },
      model: data.model,
    }
  }

  async *stream(messages: Message[], options?: CompleteOptions): AsyncIterableIterator<ResponseChunk> {
    const model = options?.model || this.defaultModel
    
    const openaiMessages = this.convertMessages(messages, options?.systemPrompt)
    const body: Record<string, unknown> = {
      model,
      messages: openaiMessages,
      max_tokens: options?.maxTokens || 4096,
      stream: true,
    }

    if (options?.temperature !== undefined) {
      body.temperature = options.temperature
    }

    if (options?.tools && options.tools.length > 0) {
      body.tools = this.convertTools(options.tools)
      body.tool_choice = "auto"
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
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
      throw new Error(`OpenAI API error: ${response.status} - ${error}`)
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
              const delta = parsed.choices?.[0]?.delta

              if (delta?.content) {
                yield { type: "text", content: delta.content }
              }

              if (delta?.tool_calls) {
                for (const tc of delta.tool_calls) {
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

              if (parsed.usage) {
                yield {
                  type: "done",
                  usage: {
                    inputTokens: parsed.usage.prompt_tokens || 0,
                    outputTokens: parsed.usage.completion_tokens || 0,
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

  private convertMessages(messages: Message[], systemPrompt?: string): OpenAIMessage[] {
    const result: OpenAIMessage[] = []

    if (systemPrompt) {
      result.push({ role: "system", content: systemPrompt })
    }

    for (const msg of messages) {
      const openaiMsg: OpenAIMessage = {
        role: msg.role,
        content: msg.content,
      }

      if (msg.toolCallId) {
        openaiMsg.tool_call_id = msg.toolCallId
      }

      if (msg.toolCalls) {
        openaiMsg.tool_calls = msg.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function" as const,
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          },
        }))
      }

      result.push(openaiMsg)
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
export function createOpenAIProvider(config: ProviderConfig = {}): Provider {
  return new OpenAIProvider(config)
}
