/**
 * Beast CLI — Feature Flags
 * 
 * Enable/disable features per project.
 * Inspired by OpenCode's feature flag system.
 */

import * as fs from "fs/promises"
import * as path from "path"

export type FeatureFlag = 
  | "vim"
  | "voice"
  | "webSearch"
  | "autoCompact"
  | "sandbox"
  | "cloud"
  | "swarm"
  | "hooks"
  | "skills"
  | "mcp"

export interface FeatureFlagsConfig {
  projectRoot: string
  configPath?: string
}

export type FeatureFlags = Record<FeatureFlag, boolean>

// Default feature flags
export const DEFAULT_FLAGS: FeatureFlags = {
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
}

/**
 * Feature Flag Manager
 */
export class FeatureFlagManager {
  private projectRoot: string
  private configPath: string
  private flags: FeatureFlags
  private overrides: Map<FeatureFlag, boolean> = new Map()

  constructor(config: FeatureFlagsConfig) {
    this.projectRoot = config.projectRoot
    this.configPath = config.configPath || path.join(this.projectRoot, ".beast", "features.json")
    this.flags = { ...DEFAULT_FLAGS }
  }

  /**
   * Load feature flags from config
   */
  async load(): Promise<FeatureFlags> {
    try {
      const content = await fs.readFile(this.configPath, "utf-8")
      const parsed = JSON.parse(content)
      
      // Validate and merge with defaults
      for (const key of Object.keys(DEFAULT_FLAGS)) {
        if (typeof parsed[key] === "boolean") {
          this.flags[key as FeatureFlag] = parsed[key]
        }
      }
    } catch {
      // Config doesn't exist - use defaults
    }

    return this.getFlags()
  }

  /**
   * Save feature flags to config
   */
  async save(): Promise<void> {
    const dir = path.dirname(this.configPath)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(this.configPath, JSON.stringify(this.flags, null, 2))
  }

  /**
   * Get all feature flags
   */
  getFlags(): FeatureFlags {
    return { ...this.flags }
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(feature: FeatureFlag): boolean {
    // Check overrides first
    if (this.overrides.has(feature)) {
      return this.overrides.get(feature)!
    }
    return this.flags[feature] ?? DEFAULT_FLAGS[feature]
  }

  /**
   * Enable a feature
   */
  async enable(feature: FeatureFlag): Promise<void> {
    this.flags[feature] = true
    await this.save()
  }

  /**
   * Disable a feature
   */
  async disable(feature: FeatureFlag): Promise<void> {
    this.flags[feature] = false
    await this.save()
  }

  /**
   * Set a feature flag (without persisting)
   */
  set(feature: FeatureFlag, enabled: boolean): void {
    this.flags[feature] = enabled
  }

  /**
   * Set a temporary override (not persisted)
   */
  setOverride(feature: FeatureFlag, enabled: boolean): void {
    this.overrides.set(feature, enabled)
  }

  /**
   * Clear an override
   */
  clearOverride(feature: FeatureFlag): void {
    this.overrides.delete(feature)
  }

  /**
   * Clear all overrides
   */
  clearAllOverrides(): void {
    this.overrides.clear()
  }

  /**
   * Toggle a feature
   */
  async toggle(feature: FeatureFlag): Promise<boolean> {
    const newValue = !this.isEnabled(feature)
    this.flags[feature] = newValue
    await this.save()
    return newValue
  }

  /**
   * Reset to defaults
   */
  async reset(): Promise<void> {
    this.flags = { ...DEFAULT_FLAGS }
    this.overrides.clear()
    await this.save()
  }

  /**
   * Check if config exists
   */
  async exists(): Promise<boolean> {
    try {
      await fs.access(this.configPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get available features with descriptions
   */
  static getFeatureDescriptions(): Record<FeatureFlag, string> {
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
    }
  }

  /**
   * Parse feature flag from string
   */
  static parseFeatureFlag(value: string): FeatureFlag | null {
    if (value in DEFAULT_FLAGS) {
      return value as FeatureFlag
    }
    return null
  }
}

/**
 * Create a feature flag manager
 */
export function createFeatureFlagManager(projectRoot: string): FeatureFlagManager {
  return new FeatureFlagManager({ projectRoot })
}

// Global feature flag manager
let globalFeatureFlags: FeatureFlagManager | null = null

export function getFeatureFlags(projectRoot?: string): FeatureFlagManager {
  if (!globalFeatureFlags || projectRoot) {
    globalFeatureFlags = createFeatureFlagManager(projectRoot || process.cwd())
  }
  return globalFeatureFlags
}
