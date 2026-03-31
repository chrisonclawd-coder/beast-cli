/**
 * Beast CLI — LiteLLM Proxy Provider
 * 
 * LiteLLM proxy integration - unified proxy for any LLM provider.
 * https://docs.litellm.ai/
 */

import { OpenAICompatibleProvider } from "./openai-compatible"
import type { Provider, ProviderConfig, Model } from "./types"

export class LiteLLMProvider extends OpenAICompatibleProvider {
  constructor(config: ProviderConfig = {}) {
    super({
      providerId: "litellm",
      providerName: "LiteLLM Proxy",
      baseUrl: config.baseUrl || process.env.LITELLM_BASE_URL || "http://localhost:4000/v1",
      apiKey: config.apiKey || process.env.LITELLM_API_KEY || "",
      envKey: "LITELLM_API_KEY",
      defaultModel: config.model || "gpt-4",
      // LiteLLM proxies to many providers, so we don't have a static model list
      knownModels: [],
    })
  }
}

// Factory function
export function createLiteLLMProvider(config: ProviderConfig = {}): Provider {
  return new LiteLLMProvider(config)
}
