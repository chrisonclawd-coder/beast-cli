/**
 * Beast CLI — Hooks Executor
 *
 * Execute hooks on various events.
 * Inspired by Claude Code's hooks system.
 */
import type { Hook, HookEvent, HookContext } from "./types";
export interface HookExecutorConfig {
    projectRoot: string;
    timeout: number;
    enabled: boolean;
    env?: Record<string, string>;
}
export interface HookResult {
    hook: Hook;
    success: boolean;
    output: string;
    durationMs: number;
    error?: string;
}
/**
 * Hook Executor - runs hook commands on events
 */
export declare class HookExecutor {
    private config;
    private hooks;
    private runningHooks;
    constructor(config: HookExecutorConfig);
    /**
     * Register hooks from config
     */
    register(hooks: Record<string, string[]>): void;
    /**
     * Add a single hook
     */
    addHook(hook: Hook): void;
    /**
     * Remove a hook
     */
    removeHook(event: HookEvent, command: string): boolean;
    /**
     * Execute all hooks for an event
     */
    execute(event: HookEvent, context?: Partial<HookContext>): Promise<HookResult[]>;
    /**
     * Execute a single hook command
     */
    private executeHook;
    /**
     * Run a shell command
     */
    private runCommand;
    /**
     * Evaluate a hook condition
     */
    private evaluateCondition;
    /**
     * Get all registered hooks
     */
    getHooks(event?: HookEvent): Hook[];
    /**
     * Clear all hooks
     */
    clear(): void;
}
/**
 * Create a hook executor
 */
export declare function createHookExecutor(projectRoot: string, options?: Partial<HookExecutorConfig>): HookExecutor;
export declare function getHookExecutor(projectRoot?: string): HookExecutor;
