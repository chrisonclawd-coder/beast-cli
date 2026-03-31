/**
 * Beast CLI — Provider Registry
 *
 * Auto-discovery and management of LLM providers.
 * Inspired by OpenCode's modular provider system.
 */
import type { Provider, ProviderConfig, Model } from "./types";
type ProviderFactory = (config: ProviderConfig) => Provider;
declare class ProviderRegistry {
    private providers;
    private factories;
    private defaultProvider;
    /**
     * Register a provider factory
     */
    registerFactory(id: string, factory: ProviderFactory): void;
    /**
     * Get or create a provider instance
     */
    getProvider(id: string, config?: ProviderConfig): Provider;
    /**
     * List all registered provider factories
     */
    listAvailable(): string[];
    /**
     * List all instantiated providers
     */
    listActive(): string[];
    /**
     * Set the default provider
     */
    setDefault(id: string): void;
    /**
     * Get the default provider
     */
    getDefault(): Provider | null;
    /**
     * Auto-discover providers from environment variables
     */
    autoDiscover(): string[];
    /**
     * Get all models from all active providers
     */
    listAllModels(): Promise<Map<string, Model[]>>;
    /**
     * Clear all cached providers
     */
    clear(): void;
}
export declare const providerRegistry: ProviderRegistry;
export { ProviderRegistry };
