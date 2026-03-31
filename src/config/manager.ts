/**
 * Beast CLI — Config Management
 * 
 * Load and save configuration from .beast/config.json
 * Inspired by Gemini CLI's config system.
 */

import * as fs from "fs/promises"
import * as path from "path"
import { z } from "zod"

// Permission type
export type Permission = "auto" | "ask" | "deny"

// Config schema
const BeastConfigSchema = z.object({
  provider: z.enum(["openai", "anthropic", "google"]).optional(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  
  systemPrompt: z.string().optional(),
  
  permissions: z.record(z.enum(["auto", "ask", "deny"])).optional(),
  defaultPermission: z.enum(["auto", "ask", "deny"]).default("ask"),
  
  maxIterations: z.number().default(50),
  maxTokens: z.number().default(8192),
  
  features: z.object({
    vim: z.boolean().default(false),
    autoCompact: z.boolean().default(false),
    webSearch: z.boolean().default(false),
    voice: z.boolean().default(false),
    sandbox: z.boolean().default(false),
    cloud: z.boolean().default(false),
    featureFlags: z.record(z.string(), z.boolean()).optional(),
    plugins: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    hooks: z.record(z.string(), z.array(z.string())).optional(),
  }).optional(),

  workingDir: z.string().optional(),
  
  git: z.object({
    enabled: z.boolean().default(true),
    autoCommit: z.boolean().default(true),
    commitMessage: z.string().optional(),
  }).optional(),

  session: z.object({
    storage: z.enum(["git", "file", "memory"]).default("git"),
    resume: z.boolean().default(true),
  }).optional(),
})

export type BeastConfig = z.infer<typeof BeastConfigSchema>

export { BeastConfigSchema }

const DEFAULT_CONFIG: Partial<BeastConfig> = {
  provider: "openai",
  defaultPermission: "ask",
  maxIterations: 50,
  maxTokens: 8192,
  features: {
    vim: false,
    autoCompact: false,
    webSearch: false,
    voice: false,
    sandbox: false,
    cloud: false,
  },
  git: {
    enabled: true,
    autoCommit: true,
  },
  session: {
    storage: "git",
    resume: true,
  },
}

/**
 * Config Manager - handles loading and saving config
 */
export class ConfigManager {
  private configPath: string
  private config: BeastConfig
  private projectRoot: string

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd()
    this.configPath = path.join(this.projectRoot, ".beast", "config.json")
    this.config = { ...DEFAULT_CONFIG } as BeastConfig
  }

  /**
   * Load config from file
   */
  async load(): Promise<BeastConfig> {
    try {
      const content = await fs.readFile(this.configPath, "utf-8")
      const parsed = JSON.parse(content)
      const validated = BeastConfigSchema.parse(parsed)
      this.config = { ...DEFAULT_CONFIG, ...validated }
      return this.config
    } catch (error) {
      // Config doesn't exist or is invalid - use defaults
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        console.warn(`Invalid config file: ${error}`)
      }
      return this.config
    }
  }

  /**
   * Save config to file
   */
  async save(): Promise<void> {
    const dir = path.dirname(this.configPath)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2))
  }

  /**
   * Get current config
   */
  get(): BeastConfig {
    return { ...this.config }
  }

  /**
   * Update config
   */
  async update(updates: Partial<BeastConfig>): Promise<BeastConfig> {
    this.config = { ...this.config, ...updates }
    await this.save()
    return this.config
  }

  /**
   * Reset config to defaults
   */
  async reset(): Promise<void> {
    this.config = { ...DEFAULT_CONFIG } as BeastConfig
    await this.save()
  }

  /**
   * Get config file path
   */
  getConfigPath(): string {
    return this.configPath
  }

  /**
   * Check if config file exists
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
   * Set a specific config value
   */
  set<K extends keyof BeastConfig>(key: K, value: BeastConfig[K]): void {
    this.config[key] = value
  }

  /**
   * Get a specific config value
   */
  getProp<K extends keyof BeastConfig>(key: K): BeastConfig[K] {
    return this.config[key]
  }
}

// Global config instance
let globalConfig: ConfigManager | null = null

export function getConfig(projectRoot?: string): ConfigManager {
  if (!globalConfig || (projectRoot && globalConfig.getConfigPath() !== path.join(projectRoot, ".beast", "config.json"))) {
    globalConfig = new ConfigManager(projectRoot)
  }
  return globalConfig
}

export function setConfig(config: Partial<BeastConfig>): void {
  if (globalConfig) {
    Object.assign(globalConfig.get(), config)
  }
}
