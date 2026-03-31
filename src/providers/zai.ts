/**
 * Beast CLI — Z.AI (GLM) Provider
 * 
 * Z.AI / GLM API integration - reasoning and thinking models.
 * https://bigmodel.cn/
 */

import { OpenAICompatibleProvider } from "./openai-compatible"
import type { Provider, ProviderConfig, Model } from "./types"

// Known Z.AI / GLM models
const ZAI_MODELS: Model[] = [
  {
    id: "glm-4-plus",
    name: "GLM 4 Plus",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "glm-4-air",
    name: "GLM 4 Air",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "glm-4-airx",
    name: "GLM 4 AirX",
    contextWindow: 8192,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "glm-4-flash",
    name: "GLM 4 Flash",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "glm-4-long",
    name: "GLM 4 Long",
    contextWindow: 1000000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "glm-4v-plus",
    name: "GLM 4V Plus",
    contextWindow: 8192,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "glm-z1-air",
    name: "GLM Z1 Air (Reasoning)",
    contextWindow: 128000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: false,
    supportsVision: false,
  },
  {
    id: "glm-z1-airx",
    name: "GLM Z1 AirX (Reasoning)",
    contextWindow: 8192,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: false,
    supportsVision: false,
  },
  {
    id: "glm-z1-flash",
    name: "GLM Z1 Flash (Reasoning)",
    contextWindow: 128000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: false,
    supportsVision: false,
  },
  {
    id: "glm-5",
    name: "GLM 5",
    contextWindow: 128000,
    maxOutputTokens: 8192,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
]

export class ZAIProvider extends OpenAICompatibleProvider {
  constructor(config: ProviderConfig = {}) {
    super({
      providerId: "zai",
      providerName: "Z.AI (GLM)",
      baseUrl: "https://api.z.ai/api/coding/paas/v4",
      apiKey: config.apiKey,
      envKey: "ZAI_API_KEY",
      defaultModel: config.model || "glm-5",
      knownModels: ZAI_MODELS,
    })
  }
}

// Factory function
export function createZAIProvider(config: ProviderConfig = {}): Provider {
  return new ZAIProvider(config)
}
