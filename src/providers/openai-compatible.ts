/**
 * Beast CLI — OpenAI-Compatible Base Provider
 * 
 * Base class for providers that use OpenAI-compatible APIs.
 * Handles chat completions with streaming support.
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

export interface OpenAICompatibleConfig {
  providerId: string
  providerName: string
  baseUrl: string
  apiKey?: string
  envKey?: string
  defaultModel?: string
  extraHeaders?: Record<string, string>
  knownModels?: Model[]
}

export class OpenAICompatibleProvider implements Provider {
  readonly id: string
  readonly name: string

  protected baseUrl: string
  protected apiKey: string
  protected defaultModel: string
  protected extraHeaders: Record<string, string>
  protected knownModels: Model[]

  constructor(config: OpenAICompatibleConfig) {
    this.id = config.providerId
    this.name = config.providerName
    this.baseUrl = config.baseUrl
    this.apiKey = config.apiKey || (config.envKey ? process.env[config.envKey] || "" : "")
    this.defaultModel = config.defaultModel || "default"
    this.extraHeaders = config.extraHeaders || {}
    this.knownModels = config.knownModels || []

    if (!this.apiKey && config.envKey) {
      console.warn(`${config.providerName} API key not set. Set ${config.envKey} environment variable.`)
    }
  }

  async listModels(): Promise<Model[]> {
    // Return static list if available, otherwise try to fetch from API
    if (this.knownModels.length > 0) {
      return this.knownModels
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((model: any) => ({
          id: model.id,
          name: model.id,
          contextWindow: model.context_length || 128000,
          maxOutputTokens: model.max_output_tokens || 4096,
          supportsStreaming: true,
          supportsToolCalls: true,
          supportsVision: false,
        }))
      }
    } catch {
      // Ignore errors when listing models
    }

    return []
  }

  async complete(messages: Message[], options?: CompleteOptions): Promise<CompleteResponse> {
    const model = (options?.model && options.model !== "default") ? options.model : this.defaultModel
    
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
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal: options?.signal,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`${this.name} API error: ${response.status} - ${error}`)
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
    const model = (options?.model && options.model !== "default") ? options.model : this.defaultModel
    
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
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal: options?.signal,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`${this.name} API error: ${response.status} - ${error}`)
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

  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`
    }

    return { ...headers, ...this.extraHeaders }
  }

  protected convertMessages(messages: Message[], systemPrompt?: string): OpenAIMessage[] {
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

  protected convertTools(tools: ToolDefinition[]): unknown[] {
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
