/**
 * Beast CLI — Ollama Provider
 * 
 * Ollama API integration - local LLM inference.
 * https://github.com/ollama/ollama
 */

import { OpenAICompatibleProvider } from "./openai-compatible"
import type { Provider, ProviderConfig, Model } from "./types"

// Common Ollama models (user may have others installed)
const OLLAMA_MODELS: Model[] = [
  {
    id: "llama3.3",
    name: "Llama 3.3",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "llama3.2",
    name: "Llama 3.2",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "llama3.2-vision",
    name: "Llama 3.2 Vision",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "llama3.1",
    name: "Llama 3.1",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "mistral",
    name: "Mistral",
    contextWindow: 32768,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "mixtral",
    name: "Mixtral",
    contextWindow: 32768,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "qwen2.5",
    name: "Qwen 2.5",
    contextWindow: 32768,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "codellama",
    name: "Code Llama",
    contextWindow: 16384,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: false,
    supportsVision: false,
  },
  {
    id: "deepseek-coder-v2",
    name: "DeepSeek Coder V2",
    contextWindow: 32768,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "gemma2",
    name: "Gemma 2",
    contextWindow: 8192,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: false,
    supportsVision: false,
  },
]

export class OllamaProvider extends OpenAICompatibleProvider {
  constructor(config: ProviderConfig = {}) {
    super({
      providerId: "ollama",
      providerName: "Ollama",
      baseUrl: config.baseUrl || process.env.OLLAMA_HOST || "http://localhost:11434/v1",
      apiKey: "", // Ollama doesn't need an API key
      envKey: undefined, // No env key required
      defaultModel: config.model || "llama3.3",
      knownModels: OLLAMA_MODELS,
    })
  }
}

// Factory function
export function createOllamaProvider(config: ProviderConfig = {}): Provider {
  return new OllamaProvider(config)
}
