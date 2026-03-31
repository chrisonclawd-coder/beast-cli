/**
 * Beast CLI — Tools Index
 * 
 * Exports all tool-related modules.
 */

export type { Tool, ToolResult, Permission } from "./types"
export { ToolExecutor, toolExecutor, type ExecutorConfig, type ExecutionResult, type SimplifiedToolContext, type ToolPermission } from "./executor"
export { builtinTools, readFileTool, writeFileTool, editFileTool, bashTool, globTool, grepTool } from "./builtin"

// Import and register
import { toolExecutor } from "./executor"
import { builtinTools } from "./builtin"

// Register built-in tools
toolExecutor.registerTools(builtinTools)
