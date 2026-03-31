/**
 * Beast CLI — Groq Provider
 * 
 * Groq API integration - ultra-fast LLM inference.
 * https://console.groq.com/docs
 */

import { OpenAICompatibleProvider } from "./openai-compatible"
import type { Provider, ProviderConfig, Model } from "./types"

// Known Groq models
const GROQ_MODELS: Model[] = [
  {
    id: "llama-3.3-70b-versatile",
    name: "Llama 3.3 70B Versatile",
    contextWindow: 128000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "llama-3.3-70b-specdec",
    name: "Llama 3.3 70B SpecDec",
    contextWindow: 8192,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "llama-3.1-8b-instant",
    name: "Llama 3.1 8B Instant",
    contextWindow: 128000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "llama-3.2-1b-preview",
    name: "Llama 3.2 1B Preview",
    contextWindow: 8192,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: false,
    supportsVision: false,
  },
  {
    id: "llama-3.2-3b-preview",
    name: "Llama 3.2 3B Preview",
    contextWindow: 8192,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: false,
    supportsVision: false,
  },
  {
    id: "llama-3.2-11b-vision-preview",
    name: "Llama 3.2 11B Vision Preview",
    contextWindow: 8192,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "llama-3.2-90b-vision-preview",
    name: "Llama 3.2 90B Vision Preview",
    contextWindow: 8192,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "mixtral-8x7b-32768",
    name: "Mixtral 8x7B",
    contextWindow: 32768,
    maxOutputTokens: 32768,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "gemma2-9b-it",
    name: "Gemma 2 9B IT",
    contextWindow: 8192,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
]

export class GroqProvider extends OpenAICompatibleProvider {
  constructor(config: ProviderConfig = {}) {
    super({
      providerId: "groq",
      providerName: "Groq",
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: config.apiKey,
      envKey: "GROQ_API_KEY",
      defaultModel: config.model || "llama-3.3-70b-versatile",
      knownModels: GROQ_MODELS,
    })
  }
}

// Factory function
export function createGroqProvider(config: ProviderConfig = {}): Provider {
  return new GroqProvider(config)
}
