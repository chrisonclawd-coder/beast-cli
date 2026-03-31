/**
 * Beast CLI — Tools Index
 *
 * Exports all tool-related modules.
 */
export { ToolExecutor, toolExecutor } from "./executor";
export { builtinTools, readFileTool, writeFileTool, editFileTool, bashTool, globTool, grepTool } from "./builtin";
// Import and register
import { toolExecutor } from "./executor";
import { builtinTools } from "./builtin";
// Register built-in tools
toolExecutor.registerTools(builtinTools);
//# sourceMappingURL=index.js.map