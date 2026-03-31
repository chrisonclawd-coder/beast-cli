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

// Providers
export { OpenAIProvider, createOpenAIProvider } from "./openai"
export { AnthropicProvider, createAnthropicProvider } from "./anthropic"
export { GoogleProvider, createGoogleProvider } from "./google"

// Import for registration
import { providerRegistry } from "./registry"
import { createOpenAIProvider } from "./openai"
import { createAnthropicProvider } from "./anthropic"
import { createGoogleProvider } from "./google"

// Register all providers
providerRegistry.registerFactory("openai", createOpenAIProvider)
providerRegistry.registerFactory("anthropic", createAnthropicProvider)
providerRegistry.registerFactory("google", createGoogleProvider)

// Auto-discover available providers
const discovered = providerRegistry.autoDiscover()
if (discovered.length > 0) {
  console.log(`🦁 Discovered providers: ${discovered.join(", ")}`)
}
