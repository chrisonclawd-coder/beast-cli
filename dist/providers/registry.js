/**
 * Beast CLI — Provider Registry
 *
 * Auto-discovery and management of LLM providers.
 * Inspired by OpenCode's modular provider system.
 */
// Registry stores all available providers
class ProviderRegistry {
    providers = new Map();
    factories = new Map();
    defaultProvider = null;
    /**
     * Register a provider factory
     */
    registerFactory(id, factory) {
        this.factories.set(id, factory);
    }
    /**
     * Get or create a provider instance
     */
    getProvider(id, config) {
        // Return cached instance if exists and no new config
        if (this.providers.has(id) && !config) {
            return this.providers.get(id);
        }
        const factory = this.factories.get(id);
        if (!factory) {
            throw new Error(`Unknown provider: ${id}. Available: ${this.listAvailable().join(", ")}`);
        }
        const provider = factory(config || {});
        this.providers.set(id, provider);
        return provider;
    }
    /**
     * List all registered provider factories
     */
    listAvailable() {
        return Array.from(this.factories.keys());
    }
    /**
     * List all instantiated providers
     */
    listActive() {
        return Array.from(this.providers.keys());
    }
    /**
     * Set the default provider
     */
    setDefault(id) {
        if (!this.factories.has(id)) {
            throw new Error(`Cannot set unknown provider as default: ${id}`);
        }
        this.defaultProvider = id;
    }
    /**
     * Get the default provider
     */
    getDefault() {
        if (!this.defaultProvider) {
            return null;
        }
        return this.getProvider(this.defaultProvider);
    }
    /**
     * Auto-discover providers from environment variables
     */
    autoDiscover() {
        const discovered = [];
        // Check for API keys in environment
        const envMappings = {
            OPENAI_API_KEY: "openai",
            ANTHROPIC_API_KEY: "anthropic",
            GEMINI_API_KEY: "google",
            GOOGLE_API_KEY: "google",
            GOOGLE_GENAI_API_KEY: "google",
            GROQ_API_KEY: "groq",
            OPENROUTER_API_KEY: "openrouter",
        };
        for (const [envKey, providerId] of Object.entries(envMappings)) {
            if (process.env[envKey] && this.factories.has(providerId)) {
                discovered.push(providerId);
            }
        }
        // Set first discovered as default if none set
        if (discovered.length > 0 && !this.defaultProvider) {
            this.defaultProvider = discovered[0];
        }
        return discovered;
    }
    /**
     * Get all models from all active providers
     */
    async listAllModels() {
        const models = new Map();
        for (const [id, provider] of this.providers) {
            try {
                const providerModels = await provider.listModels();
                models.set(id, providerModels);
            }
            catch (error) {
                console.error(`Failed to list models for ${id}:`, error);
                models.set(id, []);
            }
        }
        return models;
    }
    /**
     * Clear all cached providers
     */
    clear() {
        this.providers.clear();
    }
}
// Global registry instance
export const providerRegistry = new ProviderRegistry();
// Export class for testing
export { ProviderRegistry };
//# sourceMappingURL=registry.js.map