/**
 * Beast CLI — Feature Flags
 *
 * Enable/disable features per project.
 * Inspired by OpenCode's feature flag system.
 */
import * as fs from "fs/promises";
import * as path from "path";
// Default feature flags
export const DEFAULT_FLAGS = {
    vim: false,
    voice: false,
    webSearch: false,
    autoCompact: false,
    sandbox: false,
    cloud: false,
    swarm: false,
    hooks: true,
    skills: true,
    mcp: false,
};
/**
 * Feature Flag Manager
 */
export class FeatureFlagManager {
    projectRoot;
    configPath;
    flags;
    overrides = new Map();
    constructor(config) {
        this.projectRoot = config.projectRoot;
        this.configPath = config.configPath || path.join(this.projectRoot, ".beast", "features.json");
        this.flags = { ...DEFAULT_FLAGS };
    }
    /**
     * Load feature flags from config
     */
    async load() {
        try {
            const content = await fs.readFile(this.configPath, "utf-8");
            const parsed = JSON.parse(content);
            // Validate and merge with defaults
            for (const key of Object.keys(DEFAULT_FLAGS)) {
                if (typeof parsed[key] === "boolean") {
                    this.flags[key] = parsed[key];
                }
            }
        }
        catch {
            // Config doesn't exist - use defaults
        }
        return this.getFlags();
    }
    /**
     * Save feature flags to config
     */
    async save() {
        const dir = path.dirname(this.configPath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(this.configPath, JSON.stringify(this.flags, null, 2));
    }
    /**
     * Get all feature flags
     */
    getFlags() {
        return { ...this.flags };
    }
    /**
     * Check if a feature is enabled
     */
    isEnabled(feature) {
        // Check overrides first
        if (this.overrides.has(feature)) {
            return this.overrides.get(feature);
        }
        return this.flags[feature] ?? DEFAULT_FLAGS[feature];
    }
    /**
     * Enable a feature
     */
    async enable(feature) {
        this.flags[feature] = true;
        await this.save();
    }
    /**
     * Disable a feature
     */
    async disable(feature) {
        this.flags[feature] = false;
        await this.save();
    }
    /**
     * Set a feature flag (without persisting)
     */
    set(feature, enabled) {
        this.flags[feature] = enabled;
    }
    /**
     * Set a temporary override (not persisted)
     */
    setOverride(feature, enabled) {
        this.overrides.set(feature, enabled);
    }
    /**
     * Clear an override
     */
    clearOverride(feature) {
        this.overrides.delete(feature);
    }
    /**
     * Clear all overrides
     */
    clearAllOverrides() {
        this.overrides.clear();
    }
    /**
     * Toggle a feature
     */
    async toggle(feature) {
        const newValue = !this.isEnabled(feature);
        this.flags[feature] = newValue;
        await this.save();
        return newValue;
    }
    /**
     * Reset to defaults
     */
    async reset() {
        this.flags = { ...DEFAULT_FLAGS };
        this.overrides.clear();
        await this.save();
    }
    /**
     * Check if config exists
     */
    async exists() {
        try {
            await fs.access(this.configPath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get available features with descriptions
     */
    static getFeatureDescriptions() {
        return {
            vim: "Vim-style keybindings in the TUI",
            voice: "Voice input support (push-to-talk)",
            webSearch: "Web search integration",
            autoCompact: "Automatic context compaction",
            sandbox: "OS-level sandboxing for tool execution",
            cloud: "Cloud delegation for heavy tasks",
            swarm: "Multi-agent swarm mode",
            hooks: "Event hooks system",
            skills: "Skills loading from .beast/skills/",
            mcp: "Model Context Protocol client",
        };
    }
    /**
     * Parse feature flag from string
     */
    static parseFeatureFlag(value) {
        if (value in DEFAULT_FLAGS) {
            return value;
        }
        return null;
    }
}
/**
 * Create a feature flag manager
 */
export function createFeatureFlagManager(projectRoot) {
    return new FeatureFlagManager({ projectRoot });
}
// Global feature flag manager
let globalFeatureFlags = null;
export function getFeatureFlags(projectRoot) {
    if (!globalFeatureFlags || projectRoot) {
        globalFeatureFlags = createFeatureFlagManager(projectRoot || process.cwd());
    }
    return globalFeatureFlags;
}
//# sourceMappingURL=flags.js.map