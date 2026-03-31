/**
 * Beast CLI — Perplexity Provider
 * 
 * Perplexity API integration - AI search with citations.
 * https://docs.perplexity.ai/
 */

import { OpenAICompatibleProvider } from "./openai-compatible"
import type { Provider, ProviderConfig, Model } from "./types"

// Known Perplexity models
const PERPLEXITY_MODELS: Model[] = [
  {
    id: "sonar",
    name: "Sonar",
    contextWindow: 127072,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: false,
    supportsVision: false,
  },
  {
    id: "sonar-pro",
    name: "Sonar Pro",
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: false,
    supportsVision: false,
  },
  {
    id: "sonar-reasoning",
    name: "Sonar Reasoning",
    contextWindow: 127072,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: false,
    supportsVision: false,
  },
  {
    id: "sonar-reasoning-pro",
    name: "Sonar Reasoning Pro",
    contextWindow: 127072,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: false,
    supportsVision: false,
  },
  {
    id: "sonar-deep-research",
    name: "Sonar Deep Research",
    contextWindow: 127072,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: false,
    supportsVision: false,
  },
  {
    id: "r1-1776",
    name: "R1 1776",
    contextWindow: 127072,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: false,
    supportsVision: false,
  },
]

export class PerplexityProvider extends OpenAICompatibleProvider {
  constructor(config: ProviderConfig = {}) {
    super({
      providerId: "perplexity",
      providerName: "Perplexity",
      baseUrl: "https://api.perplexity.ai",
      apiKey: config.apiKey,
      envKey: "PERPLEXITY_API_KEY",
      defaultModel: config.model || "sonar",
      knownModels: PERPLEXITY_MODELS,
    })
  }
}

// Factory function
export function createPerplexityProvider(config: ProviderConfig = {}): Provider {
  return new PerplexityProvider(config)
}
