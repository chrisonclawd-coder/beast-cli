/**
 * Beast CLI — xAI (Grok) Provider
 * 
 * xAI API integration - Grok models.
 * https://docs.x.ai/docs
 */

import { OpenAICompatibleProvider } from "./openai-compatible"
import type { Provider, ProviderConfig, Model } from "./types"

// Known xAI models
const XAI_MODELS: Model[] = [
  {
    id: "grok-3-beta",
    name: "Grok 3 Beta",
    contextWindow: 131072,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "grok-3-fast-beta",
    name: "Grok 3 Fast Beta",
    contextWindow: 131072,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "grok-3-mini-beta",
    name: "Grok 3 Mini Beta",
    contextWindow: 131072,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "grok-3-mini-fast-beta",
    name: "Grok 3 Mini Fast Beta",
    contextWindow: 131072,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "grok-2-1212",
    name: "Grok 2 (1212)",
    contextWindow: 131072,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "grok-2-vision-1212",
    name: "Grok 2 Vision (1212)",
    contextWindow: 32768,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "grok-beta",
    name: "Grok Beta",
    contextWindow: 131072,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "grok-vision-beta",
    name: "Grok Vision Beta",
    contextWindow: 8192,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
]

export class XAIProvider extends OpenAICompatibleProvider {
  constructor(config: ProviderConfig = {}) {
    super({
      providerId: "xai",
      providerName: "xAI (Grok)",
      baseUrl: "https://api.x.ai/v1",
      apiKey: config.apiKey,
      envKey: "XAI_API_KEY",
      defaultModel: config.model || "grok-3-beta",
      knownModels: XAI_MODELS,
    })
  }
}

// Factory function
export function createXAIProvider(config: ProviderConfig = {}): Provider {
  return new XAIProvider(config)
}
