/**
 * Beast CLI — MCP Types
 * 
 * Type definitions for Model Context Protocol.
 */

export type TransportType = "stdio" | "sse" | "websocket"

export interface MCPServerConfig {
  /** Server name/identifier */
  name: string
  
  /** Transport type */
  transport: TransportType
  
  /** Command to run (for stdio) */
  command?: string
  
  /** Arguments for command */
  args?: string[]
  
  /** Environment variables */
  env?: Record<string, string>
  
  /** URL (for SSE/websocket) */
  url?: string
  
  /** Headers for HTTP connections */
  headers?: Record<string, string>
  
  /** Connection timeout in ms */
  timeout?: number
}

export interface MCPClientConfig {
  /** Servers to connect to */
  servers: MCPServerConfig[]
  
  /** Auto-discover tools/resources on connect */
  autoDiscover: boolean
  
  /** Cache discovered items */
  cache: boolean
  
  /** Default timeout for requests */
  defaultTimeout: number
}

export interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  serverName: string
}

export interface MCPResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
  serverName: string
}

export interface MCPPrompt {
  name: string
  description?: string
  arguments?: Array<{
    name: string
    description?: string
    required?: boolean
  }>
  serverName: string
}

export interface MCPMessage {
  jsonrpc: "2.0"
  id?: number | string
  method?: string
  params?: Record<string, unknown>
  result?: unknown
  error?: {
    code: number
    message: string
    data?: unknown
  }
}

export interface ToolCallResult {
  content: Array<{
    type: "text" | "image" | "resource"
    text?: string
    data?: string
    mimeType?: string
  }>
  isError?: boolean
}

export interface ResourceReadResult {
  contents: Array<{
    uri: string
    mimeType?: string
    text?: string
    blob?: string
  }>
}
