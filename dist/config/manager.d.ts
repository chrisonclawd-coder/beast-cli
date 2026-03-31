/**
 * Beast CLI — Config Management
 *
 * Load and save configuration from .beast/config.json
 * Inspired by Gemini CLI's config system.
 */
import { z } from "zod";
export type Permission = "auto" | "ask" | "deny";
declare const BeastConfigSchema: z.ZodObject<{
    provider: z.ZodOptional<z.ZodEnum<["openai", "anthropic", "google"]>>;
    model: z.ZodOptional<z.ZodString>;
    apiKey: z.ZodOptional<z.ZodString>;
    baseUrl: z.ZodOptional<z.ZodString>;
    systemPrompt: z.ZodOptional<z.ZodString>;
    permissions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["auto", "ask", "deny"]>>>;
    defaultPermission: z.ZodDefault<z.ZodEnum<["auto", "ask", "deny"]>>;
    maxIterations: z.ZodDefault<z.ZodNumber>;
    maxTokens: z.ZodDefault<z.ZodNumber>;
    features: z.ZodOptional<z.ZodObject<{
        vim: z.ZodDefault<z.ZodBoolean>;
        autoCompact: z.ZodDefault<z.ZodBoolean>;
        webSearch: z.ZodDefault<z.ZodBoolean>;
        voice: z.ZodDefault<z.ZodBoolean>;
        sandbox: z.ZodDefault<z.ZodBoolean>;
        cloud: z.ZodDefault<z.ZodBoolean>;
        featureFlags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodBoolean>>;
        plugins: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        hooks: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>>;
    }, "strip", z.ZodTypeAny, {
        vim: boolean;
        autoCompact: boolean;
        webSearch: boolean;
        voice: boolean;
        sandbox: boolean;
        cloud: boolean;
        featureFlags?: Record<string, boolean> | undefined;
        plugins?: string[] | undefined;
        skills?: string[] | undefined;
        hooks?: Record<string, string[]> | undefined;
    }, {
        vim?: boolean | undefined;
        autoCompact?: boolean | undefined;
        webSearch?: boolean | undefined;
        voice?: boolean | undefined;
        sandbox?: boolean | undefined;
        cloud?: boolean | undefined;
        featureFlags?: Record<string, boolean> | undefined;
        plugins?: string[] | undefined;
        skills?: string[] | undefined;
        hooks?: Record<string, string[]> | undefined;
    }>>;
    workingDir: z.ZodOptional<z.ZodString>;
    git: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        autoCommit: z.ZodDefault<z.ZodBoolean>;
        commitMessage: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        autoCommit: boolean;
        commitMessage?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        autoCommit?: boolean | undefined;
        commitMessage?: string | undefined;
    }>>;
    session: z.ZodOptional<z.ZodObject<{
        storage: z.ZodDefault<z.ZodEnum<["git", "file", "memory"]>>;
        resume: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        storage: "git" | "file" | "memory";
        resume: boolean;
    }, {
        storage?: "git" | "file" | "memory" | undefined;
        resume?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    defaultPermission: "auto" | "ask" | "deny";
    maxTokens: number;
    maxIterations: number;
    apiKey?: string | undefined;
    baseUrl?: string | undefined;
    model?: string | undefined;
    provider?: "openai" | "anthropic" | "google" | undefined;
    permissions?: Record<string, "auto" | "ask" | "deny"> | undefined;
    systemPrompt?: string | undefined;
    features?: {
        vim: boolean;
        autoCompact: boolean;
        webSearch: boolean;
        voice: boolean;
        sandbox: boolean;
        cloud: boolean;
        featureFlags?: Record<string, boolean> | undefined;
        plugins?: string[] | undefined;
        skills?: string[] | undefined;
        hooks?: Record<string, string[]> | undefined;
    } | undefined;
    workingDir?: string | undefined;
    git?: {
        enabled: boolean;
        autoCommit: boolean;
        commitMessage?: string | undefined;
    } | undefined;
    session?: {
        storage: "git" | "file" | "memory";
        resume: boolean;
    } | undefined;
}, {
    apiKey?: string | undefined;
    baseUrl?: string | undefined;
    model?: string | undefined;
    provider?: "openai" | "anthropic" | "google" | undefined;
    permissions?: Record<string, "auto" | "ask" | "deny"> | undefined;
    defaultPermission?: "auto" | "ask" | "deny" | undefined;
    maxTokens?: number | undefined;
    systemPrompt?: string | undefined;
    maxIterations?: number | undefined;
    features?: {
        vim?: boolean | undefined;
        autoCompact?: boolean | undefined;
        webSearch?: boolean | undefined;
        voice?: boolean | undefined;
        sandbox?: boolean | undefined;
        cloud?: boolean | undefined;
        featureFlags?: Record<string, boolean> | undefined;
        plugins?: string[] | undefined;
        skills?: string[] | undefined;
        hooks?: Record<string, string[]> | undefined;
    } | undefined;
    workingDir?: string | undefined;
    git?: {
        enabled?: boolean | undefined;
        autoCommit?: boolean | undefined;
        commitMessage?: string | undefined;
    } | undefined;
    session?: {
        storage?: "git" | "file" | "memory" | undefined;
        resume?: boolean | undefined;
    } | undefined;
}>;
export type BeastConfig = z.infer<typeof BeastConfigSchema>;
export { BeastConfigSchema };
/**
 * Config Manager - handles loading and saving config
 */
export declare class ConfigManager {
    private configPath;
    private config;
    private projectRoot;
    constructor(projectRoot?: string);
    /**
     * Load config from file
     */
    load(): Promise<BeastConfig>;
    /**
     * Save config to file
     */
    save(): Promise<void>;
    /**
     * Get current config
     */
    get(): BeastConfig;
    /**
     * Update config
     */
    update(updates: Partial<BeastConfig>): Promise<BeastConfig>;
    /**
     * Reset config to defaults
     */
    reset(): Promise<void>;
    /**
     * Get config file path
     */
    getConfigPath(): string;
    /**
     * Check if config file exists
     */
    exists(): Promise<boolean>;
    /**
     * Set a specific config value
     */
    set<K extends keyof BeastConfig>(key: K, value: BeastConfig[K]): void;
    /**
     * Get a specific config value
     */
    getProp<K extends keyof BeastConfig>(key: K): BeastConfig[K];
}
export declare function getConfig(projectRoot?: string): ConfigManager;
export declare function setConfig(config: Partial<BeastConfig>): void;
