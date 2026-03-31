/**
 * Beast CLI — Feature Flags
 *
 * Enable/disable features per project.
 * Inspired by OpenCode's feature flag system.
 */
export type FeatureFlag = "vim" | "voice" | "webSearch" | "autoCompact" | "sandbox" | "cloud" | "swarm" | "hooks" | "skills" | "mcp";
export interface FeatureFlagsConfig {
    projectRoot: string;
    configPath?: string;
}
export type FeatureFlags = Record<FeatureFlag, boolean>;
export declare const DEFAULT_FLAGS: FeatureFlags;
/**
 * Feature Flag Manager
 */
export declare class FeatureFlagManager {
    private projectRoot;
    private configPath;
    private flags;
    private overrides;
    constructor(config: FeatureFlagsConfig);
    /**
     * Load feature flags from config
     */
    load(): Promise<FeatureFlags>;
    /**
     * Save feature flags to config
     */
    save(): Promise<void>;
    /**
     * Get all feature flags
     */
    getFlags(): FeatureFlags;
    /**
     * Check if a feature is enabled
     */
    isEnabled(feature: FeatureFlag): boolean;
    /**
     * Enable a feature
     */
    enable(feature: FeatureFlag): Promise<void>;
    /**
     * Disable a feature
     */
    disable(feature: FeatureFlag): Promise<void>;
    /**
     * Set a feature flag (without persisting)
     */
    set(feature: FeatureFlag, enabled: boolean): void;
    /**
     * Set a temporary override (not persisted)
     */
    setOverride(feature: FeatureFlag, enabled: boolean): void;
    /**
     * Clear an override
     */
    clearOverride(feature: FeatureFlag): void;
    /**
     * Clear all overrides
     */
    clearAllOverrides(): void;
    /**
     * Toggle a feature
     */
    toggle(feature: FeatureFlag): Promise<boolean>;
    /**
     * Reset to defaults
     */
    reset(): Promise<void>;
    /**
     * Check if config exists
     */
    exists(): Promise<boolean>;
    /**
     * Get available features with descriptions
     */
    static getFeatureDescriptions(): Record<FeatureFlag, string>;
    /**
     * Parse feature flag from string
     */
    static parseFeatureFlag(value: string): FeatureFlag | null;
}
/**
 * Create a feature flag manager
 */
export declare function createFeatureFlagManager(projectRoot: string): FeatureFlagManager;
export declare function getFeatureFlags(projectRoot?: string): FeatureFlagManager;
