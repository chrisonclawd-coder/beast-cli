/**
 * Beast CLI — Mistral Provider
 * 
 * Mistral AI API integration.
 * https://docs.mistral.ai/
 */

import { OpenAICompatibleProvider } from "./openai-compatible"
import type { Provider, ProviderConfig, Model } from "./types"

// Known Mistral models
const MISTRAL_MODELS: Model[] = [
  {
    id: "mistral-large-latest",
    name: "Mistral Large",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "mistral-small-latest",
    name: "Mistral Small",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "codestral-latest",
    name: "Codestral",
    contextWindow: 32000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "pixtral-12b-2409",
    name: "Pixtral 12B",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "open-mistral-nemo",
    name: "Mistral Nemo",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "open-codestral-mamba",
    name: "Codestral Mamba",
    contextWindow: 256000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: false,
    supportsVision: false,
  },
]

export class MistralProvider extends OpenAICompatibleProvider {
  constructor(config: ProviderConfig = {}) {
    super({
      providerId: "mistral",
      providerName: "Mistral",
      baseUrl: "https://api.mistral.ai/v1",
      apiKey: config.apiKey,
      envKey: "MISTRAL_API_KEY",
      defaultModel: config.model || "mistral-large-latest",
      knownModels: MISTRAL_MODELS,
    })
  }
}

// Factory function
export function createMistralProvider(config: ProviderConfig = {}): Provider {
  return new MistralProvider(config)
}
