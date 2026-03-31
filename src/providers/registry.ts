/**
 * Beast CLI — Provider Registry
 * 
 * Auto-discovery and management of LLM providers.
 * Inspired by OpenCode's modular provider system.
 */

import type { Provider, ProviderConfig, Model } from "./types"

// Provider factory type
type ProviderFactory = (config: ProviderConfig) => Provider

// Registry stores all available providers
class ProviderRegistry {
  private providers: Map<string, Provider> = new Map()
  private factories: Map<string, ProviderFactory> = new Map()
  private defaultProvider: string | null = null

  /**
   * Register a provider factory
   */
  registerFactory(id: string, factory: ProviderFactory): void {
    this.factories.set(id, factory)
  }

  /**
   * Get or create a provider instance
   */
  getProvider(id: string, config?: ProviderConfig): Provider {
    // Return cached instance if exists and no new config
    if (this.providers.has(id) && !config) {
      return this.providers.get(id)!
    }

    const factory = this.factories.get(id)
    if (!factory) {
      throw new Error(`Unknown provider: ${id}. Available: ${this.listAvailable().join(", ")}`)
    }

    const provider = factory(config || {})
    this.providers.set(id, provider)
    return provider
  }

  /**
   * List all registered provider factories
   */
  listAvailable(): string[] {
    return Array.from(this.factories.keys())
  }

  /**
   * List all instantiated providers
   */
  listActive(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * Set the default provider
   */
  setDefault(id: string): void {
    if (!this.factories.has(id)) {
      throw new Error(`Cannot set unknown provider as default: ${id}`)
    }
    this.defaultProvider = id
  }

  /**
   * Get the default provider
   */
  getDefault(): Provider | null {
    if (!this.defaultProvider) {
      return null
    }
    return this.getProvider(this.defaultProvider)
  }

  /**
   * Auto-discover providers from environment variables
   */
  autoDiscover(): string[] {
    const discovered: string[] = []

    // Check for API keys in environment
    const envMappings: Record<string, string> = {
      OPENAI_API_KEY: "openai",
      ANTHROPIC_API_KEY: "anthropic",
      GEMINI_API_KEY: "google",
      GOOGLE_API_KEY: "google",
      GOOGLE_GENAI_API_KEY: "google",
      GROQ_API_KEY: "groq",
      OPENROUTER_API_KEY: "openrouter",
    }

    for (const [envKey, providerId] of Object.entries(envMappings)) {
      if (process.env[envKey] && this.factories.has(providerId)) {
        discovered.push(providerId)
      }
    }

    // Set first discovered as default if none set
    if (discovered.length > 0 && !this.defaultProvider) {
      this.defaultProvider = discovered[0]
    }

    return discovered
  }

  /**
   * Get all models from all active providers
   */
  async listAllModels(): Promise<Map<string, Model[]>> {
    const models = new Map<string, Model[]>()
    for (const [id, provider] of this.providers) {
      try {
        const providerModels = await provider.listModels()
        models.set(id, providerModels)
      } catch (error) {
        console.error(`Failed to list models for ${id}:`, error)
        models.set(id, [])
      }
    }
    return models
  }

  /**
   * Clear all cached providers
   */
  clear(): void {
    this.providers.clear()
  }
}

// Global registry instance
export const providerRegistry = new ProviderRegistry()

// Export class for testing
export { ProviderRegistry }
