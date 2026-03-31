/**
 * Beast CLI — DeepSeek Provider
 * 
 * DeepSeek API integration - reasoning models.
 * https://platform.deepseek.com/api-docs/
 */

import { OpenAICompatibleProvider } from "./openai-compatible"
import type { Provider, ProviderConfig, Model } from "./types"

// Known DeepSeek models
const DEEPSEEK_MODELS: Model[] = [
  {
    id: "deepseek-reasoner",
    name: "DeepSeek Reasoner (R1)",
    contextWindow: 64000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: false,
    supportsVision: false,
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek Chat (V3)",
    contextWindow: 64000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "deepseek-coder",
    name: "DeepSeek Coder",
    contextWindow: 16000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
]

export class DeepSeekProvider extends OpenAICompatibleProvider {
  constructor(config: ProviderConfig = {}) {
    super({
      providerId: "deepseek",
      providerName: "DeepSeek",
      baseUrl: "https://api.deepseek.com/v1",
      apiKey: config.apiKey,
      envKey: "DEEPSEEK_API_KEY",
      defaultModel: config.model || "deepseek-chat",
      knownModels: DEEPSEEK_MODELS,
    })
  }
}

// Factory function
export function createDeepSeekProvider(config: ProviderConfig = {}): Provider {
  return new DeepSeekProvider(config)
}
