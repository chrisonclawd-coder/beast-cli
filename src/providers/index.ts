/**
 * Beast CLI — Provider Index
 * 
 * Exports all providers and registers them with the registry.
 */

// Types
export type {
  Message,
  ToolCall,
  ResponseChunk,
  Usage,
  Model,
  ProviderConfig,
  Provider,
  CompleteOptions,
  CompleteResponse,
  ToolDefinition,
} from "./types"

// Registry
export { providerRegistry, ProviderRegistry } from "./registry"

// Base classes
export { OpenAICompatibleProvider } from "./openai-compatible"
export type { OpenAICompatibleConfig } from "./openai-compatible"

// Providers
export { OpenAIProvider, createOpenAIProvider } from "./openai"
export { AnthropicProvider, createAnthropicProvider } from "./anthropic"
export { GoogleProvider, createGoogleProvider } from "./google"
export { OpenRouterProvider, createOpenRouterProvider } from "./openrouter"
export { GroqProvider, createGroqProvider } from "./groq"
export { MistralProvider, createMistralProvider } from "./mistral"
export { TogetherProvider, createTogetherProvider } from "./together"
export { FireworksProvider, createFireworksProvider } from "./fireworks"
export { DeepSeekProvider, createDeepSeekProvider } from "./deepseek"
export { CohereProvider, createCohereProvider } from "./cohere"
export { XAIProvider, createXAIProvider } from "./xai"
export { PerplexityProvider, createPerplexityProvider } from "./perplexity"
export { OllamaProvider, createOllamaProvider } from "./ollama"
export { LiteLLMProvider, createLiteLLMProvider } from "./litellm"
export { ZAIProvider, createZAIProvider } from "./zai"

// Import for registration
import { providerRegistry } from "./registry"
import { createOpenAIProvider } from "./openai"
import { createAnthropicProvider } from "./anthropic"
import { createGoogleProvider } from "./google"
import { createOpenRouterProvider } from "./openrouter"
import { createGroqProvider } from "./groq"
import { createMistralProvider } from "./mistral"
import { createTogetherProvider } from "./together"
import { createFireworksProvider } from "./fireworks"
import { createDeepSeekProvider } from "./deepseek"
import { createCohereProvider } from "./cohere"
import { createXAIProvider } from "./xai"
import { createPerplexityProvider } from "./perplexity"
import { createOllamaProvider } from "./ollama"
import { createLiteLLMProvider } from "./litellm"
import { createZAIProvider } from "./zai"

// Register all providers
providerRegistry.registerFactory("openai", createOpenAIProvider)
providerRegistry.registerFactory("anthropic", createAnthropicProvider)
providerRegistry.registerFactory("google", createGoogleProvider)
providerRegistry.registerFactory("openrouter", createOpenRouterProvider)
providerRegistry.registerFactory("groq", createGroqProvider)
providerRegistry.registerFactory("mistral", createMistralProvider)
providerRegistry.registerFactory("together", createTogetherProvider)
providerRegistry.registerFactory("fireworks", createFireworksProvider)
providerRegistry.registerFactory("deepseek", createDeepSeekProvider)
providerRegistry.registerFactory("cohere", createCohereProvider)
providerRegistry.registerFactory("xai", createXAIProvider)
providerRegistry.registerFactory("perplexity", createPerplexityProvider)
providerRegistry.registerFactory("ollama", createOllamaProvider)
providerRegistry.registerFactory("litellm", createLiteLLMProvider)
providerRegistry.registerFactory("zai", createZAIProvider)

// Auto-discover available providers
const discovered = providerRegistry.autoDiscover()
if (discovered.length > 0) {
  console.log(`🦁 Discovered providers: ${discovered.join(", ")}`)
}
