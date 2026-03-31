/**
 * Beast CLI — Fireworks AI Provider
 * 
 * Fireworks AI API integration - fast serverless inference.
 * https://docs.fireworks.ai/
 */

import { OpenAICompatibleProvider } from "./openai-compatible"
import type { Provider, ProviderConfig, Model } from "./types"

// Popular Fireworks AI models
const FIREWORKS_MODELS: Model[] = [
  {
    id: "accounts/fireworks/models/llama-v3p3-70b-instruct",
    name: "Llama 3.3 70B Instruct",
    contextWindow: 131072,
    maxOutputTokens: 16384,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "accounts/fireworks/models/llama-v3p1-405b-instruct",
    name: "Llama 3.1 405B Instruct",
    contextWindow: 131072,
    maxOutputTokens: 16384,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "accounts/fireworks/models/llama-v3p2-11b-vision-instruct",
    name: "Llama 3.2 11B Vision Instruct",
    contextWindow: 131072,
    maxOutputTokens: 16384,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "accounts/fireworks/models/llama-v3p2-90b-vision-instruct",
    name: "Llama 3.2 90B Vision Instruct",
    contextWindow: 131072,
    maxOutputTokens: 16384,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "accounts/fireworks/models/qwen2p5-72b-instruct",
    name: "Qwen 2.5 72B Instruct",
    contextWindow: 32768,
    maxOutputTokens: 16384,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "accounts/fireworks/models/mixtral-8x7b-instruct",
    name: "Mixtral 8x7B Instruct",
    contextWindow: 32768,
    maxOutputTokens: 16384,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "accounts/fireworks/models/mixtral-8x22b-instruct",
    name: "Mixtral 8x22B Instruct",
    contextWindow: 65536,
    maxOutputTokens: 16384,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "accounts/fireworks/models/deepseek-v3",
    name: "DeepSeek V3",
    contextWindow: 64000,
    maxOutputTokens: 16384,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
]

export class FireworksProvider extends OpenAICompatibleProvider {
  constructor(config: ProviderConfig = {}) {
    super({
      providerId: "fireworks",
      providerName: "Fireworks AI",
      baseUrl: "https://api.fireworks.ai/inference/v1",
      apiKey: config.apiKey,
      envKey: "FIREWORKS_API_KEY",
      defaultModel: config.model || "accounts/fireworks/models/llama-v3p3-70b-instruct",
      knownModels: FIREWORKS_MODELS,
    })
  }
}

// Factory function
export function createFireworksProvider(config: ProviderConfig = {}): Provider {
  return new FireworksProvider(config)
}
