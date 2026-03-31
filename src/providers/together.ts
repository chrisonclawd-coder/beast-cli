/**
 * Beast CLI — Together AI Provider
 * 
 * Together AI API integration - open-source model hosting.
 * https://docs.together.ai/docs/chat-completions
 */

import { OpenAICompatibleProvider } from "./openai-compatible"
import type { Provider, ProviderConfig, Model } from "./types"

// Popular Together AI models
const TOGETHER_MODELS: Model[] = [
  {
    id: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    name: "Llama 3.3 70B Instruct Turbo",
    contextWindow: 131072,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo",
    name: "Llama 3.2 90B Vision Instruct Turbo",
    contextWindow: 131072,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
    name: "Llama 3.2 11B Vision Instruct Turbo",
    contextWindow: 131072,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: true,
  },
  {
    id: "mistralai/Mixtral-8x7B-Instruct-v0.1",
    name: "Mixtral 8x7B Instruct",
    contextWindow: 32768,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "mistralai/Mixtral-8x22B-Instruct-v0.1",
    name: "Mixtral 8x22B Instruct",
    contextWindow: 65536,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "Qwen/Qwen2.5-72B-Instruct-Turbo",
    name: "Qwen 2.5 72B Instruct Turbo",
    contextWindow: 32768,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "deepseek-ai/DeepSeek-V3",
    name: "DeepSeek V3",
    contextWindow: 64000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: true,
    supportsVision: false,
  },
  {
    id: "codellama/CodeLlama-70b-Instruct-hf",
    name: "CodeLlama 70B Instruct",
    contextWindow: 4096,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsToolCalls: false,
    supportsVision: false,
  },
]

export class TogetherProvider extends OpenAICompatibleProvider {
  constructor(config: ProviderConfig = {}) {
    super({
      providerId: "together",
      providerName: "Together AI",
      baseUrl: "https://api.together.xyz/v1",
      apiKey: config.apiKey,
      envKey: "TOGETHER_API_KEY",
      defaultModel: config.model || "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      knownModels: TOGETHER_MODELS,
    })
  }
}

// Factory function
export function createTogetherProvider(config: ProviderConfig = {}): Provider {
  return new TogetherProvider(config)
}
