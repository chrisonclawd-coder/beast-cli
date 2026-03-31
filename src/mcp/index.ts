/**
 * Beast CLI — MCP (Model Context Protocol) Module
 * 
 * Client for connecting to MCP servers.
 * Inspired by Claude Code and Gemini CLI MCP support.
 */

export { 
  MCPClient,
  createMCPClient,
} from "./client"

export { 
  MCPConnection,
  type ConnectionStatus,
} from "./connection"

export {
  MCPDiscovery,
  type DiscoveredTool,
  type DiscoveredResource,
} from "./discovery"

export {
  type MCPClientConfig,
  type MCPServerConfig,
  type MCPTool,
  type MCPResource,
  type MCPPrompt,
  type MCPMessage,
  type TransportType,
  type ToolCallResult,
  type ResourceReadResult,
} from "./types"
