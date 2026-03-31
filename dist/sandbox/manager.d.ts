/**
 * Beast CLI — Sandbox Configuration
 *
 * OS-level isolation configuration for secure tool execution.
 * Inspired by Claude Code's sandbox system.
 */
export type SandboxBackend = "none" | "docker" | "bwrap" | "nsjail" | "firejail";
export interface SandboxConfig {
    enabled: boolean;
    backend: SandboxBackend;
    allowedPaths: string[];
    deniedPaths: string[];
    readOnlyPaths: string[];
    networkAccess: boolean;
    maxMemoryMB: number;
    maxCpuPercent: number;
    timeoutMs: number;
    envWhitelist: string[];
    userId?: number;
    groupId?: number;
}
export interface SandboxOptions {
    command: string;
    args: string[];
    cwd: string;
    env?: Record<string, string>;
    stdin?: string;
    timeout?: number;
}
export interface SandboxResult {
    exitCode: number;
    stdout: string;
    stderr: string;
    timedOut: boolean;
}
export declare const DEFAULT_SANDBOX_CONFIG: SandboxConfig;
/**
 * Sandbox Manager - handles secure command execution
 */
export declare class SandboxManager {
    private config;
    private projectRoot;
    constructor(config: Partial<SandboxConfig>, projectRoot: string);
    /**
     * Get current config
     */
    getConfig(): SandboxConfig;
    /**
     * Update config
     */
    updateConfig(updates: Partial<SandboxConfig>): void;
    /**
     * Execute a command in the sandbox
     */
    execute(options: SandboxOptions): Promise<SandboxResult>;
    /**
     * Execute directly (no sandbox)
     */
    private executeDirect;
    /**
     * Execute in Docker container
     */
    private executeDocker;
    /**
     * Build Docker network arguments
     */
    private buildDockerNetworkArgs;
    /**
     * Execute with bubblewrap (bwrap)
     */
    private executeBwrap;
    /**
     * Build bwrap path arguments
     */
    private buildBwrapPathArgs;
    /**
     * Execute with firejail
     */
    private executeFirejail;
    /**
     * Execute with nsjail
     */
    private executeNsjail;
    /**
     * Check if a backend is available
     */
    static checkBackend(backend: SandboxBackend): Promise<boolean>;
    /**
     * Get available backends
     */
    static getAvailableBackends(): Promise<SandboxBackend[]>;
}
/**
 * Create a sandbox manager
 */
export declare function createSandboxManager(config?: Partial<SandboxConfig>, projectRoot?: string): SandboxManager;
export declare function getSandboxManager(projectRoot?: string): SandboxManager;
