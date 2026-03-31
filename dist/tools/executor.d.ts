/**
 * Beast CLI — Tool Executor
 *
 * Executes tools with permission checks.
 * Inspired by OpenCode's permission system + Claude Code's tool execution.
 */
import type { Tool, ToolResult, Permission } from "./types";
export type ToolPermission = Permission;
export interface ExecutorConfig {
    permissions: Map<string, ToolPermission>;
    defaultPermission: ToolPermission;
    onPermissionRequest?: (tool: string, params: Record<string, unknown>) => Promise<boolean>;
}
export interface ExecutionResult {
    tool: string;
    result: ToolResult;
    durationMs: number;
    permission: "granted" | "denied" | "auto";
}
export interface SimplifiedToolContext {
    workingDir?: string;
    sessionId?: string;
}
/**
 * Tool Executor - runs tools with permission checks
 */
export declare class ToolExecutor {
    private tools;
    private config;
    constructor(config?: Partial<ExecutorConfig>);
    /**
     * Register a tool
     */
    registerTool(tool: Tool): void;
    /**
     * Register multiple tools
     */
    registerTools(tools: Tool[]): void;
    /**
     * Get all registered tools
     */
    getTools(): Tool[];
    /**
     * Get tool definitions for LLM (JSON Schema format)
     */
    getToolDefinitions(): Array<{
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    }>;
    /**
     * Check if a tool is registered
     */
    hasTool(name: string): boolean;
    /**
     * Execute a tool with permission check
     */
    execute(toolName: string, params: Record<string, unknown>, context?: SimplifiedToolContext): Promise<ExecutionResult>;
    /**
     * Check permission for a tool
     */
    private checkPermission;
    /**
     * Set permission for a tool
     */
    setPermission(toolName: string, permission: ToolPermission): void;
    /**
     * Set default permission
     */
    setDefaultPermission(permission: ToolPermission): void;
    /**
     * Clear all permissions
     */
    clearPermissions(): void;
}
export declare const toolExecutor: ToolExecutor;
