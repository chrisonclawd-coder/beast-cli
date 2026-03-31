/**
 * Beast CLI — OpenRouter Provider
 * 
 * OpenRouter API integration - unified access to many LLMs.
 * https://openrouter.ai/docs
 */

import { OpenAICompatibleProvider } from "./openai-compatible"
import type { Provider, ProviderConfig, Model } from "./types"

// Popular OpenRouter models
const OPENROUTER_MODELS: Model[] = [
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet (via OpenRouter)",
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "anthropic/claude-3-opus",
    name: "Claude 3 Opus (via OpenRouter)",
    contextWindow: 200000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o (via OpenRouter)",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "openai/gpt-4-turbo",
    name: "GPT-4 Turbo (via OpenRouter)",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "google/gemini-pro-1.5",
    name: "Gemini Pro 1.5 (via OpenRouter)",
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "meta-llama/llama-3.1-70b-instruct",
    name: "Llama 3.1 70B Instruct (via OpenRouter)",
    contextWindow: 131072,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "meta-llama/llama-3.1-405b-instruct",
    name: "Llama 3.1 405B Instruct (via OpenRouter)",
    contextWindow: 131072,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "mistralai/mistral-large",
    name: "Mistral Large (via OpenRouter)",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
]

export class OpenRouterProvider extends OpenAICompatibleProvider {
  constructor(config: ProviderConfig = {}) {
    super({
      providerId: "openrouter",
      providerName: "OpenRouter",
      baseUrl: "https://openrouter.ai/api/v1",
      apiKey: config.apiKey,
      envKey: "OPENROUTER_API_KEY",
      defaultModel: config.model || "anthropic/claude-3.5-sonnet",
      extraHeaders: {
        "HTTP-Referer": "https://github.com/beast-cli",
        "X-Title": "Beast CLI",
      },
      knownModels: OPENROUTER_MODELS,
    })
  }
}

// Factory function
export function createOpenRouterProvider(config: ProviderConfig = {}): Provider {
  return new OpenRouterProvider(config)
}
