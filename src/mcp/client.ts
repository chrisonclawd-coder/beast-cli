/**
 * Beast CLI — MCP Client
 * 
 * Main client for connecting to MCP servers.
 */

import type { 
  MCPClientConfig, 
  MCPServerConfig, 
  MCPTool, 
  MCPResource,
  MCPPrompt,
  ToolCallResult,
  ResourceReadResult,
} from "./types"
import { MCPConnection, type ConnectionStatus } from "./connection"
import { MCPDiscovery } from "./discovery"
import { createLogger } from "../utils"

const logger = createLogger({ prefix: "mcp" })

const DEFAULT_CONFIG: Partial<MCPClientConfig> = {
  autoDiscover: true,
  cache: true,
  defaultTimeout: 30000,
}

/**
 * MCP Client
 * 
 * Manages connections to MCP servers.
 */
export class MCPClient {
  private config: MCPClientConfig
  private connections: Map<string, MCPConnection>
  private discovery: MCPDiscovery
  private tools: Map<string, MCPTool>
  private resources: Map<string, MCPResource>
  private prompts: Map<string, MCPPrompt>

  constructor(config: Partial<MCPClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config } as MCPClientConfig
    this.connections = new Map()
    this.discovery = new MCPDiscovery()
    this.tools = new Map()
    this.resources = new Map()
    this.prompts = new Map()
  }

  /**
   * Connect to a server
   */
  async connect(serverConfig: MCPServerConfig): Promise<void> {
    if (this.connections.has(serverConfig.name)) {
      logger.warn(`Already connected to ${serverConfig.name}`)
      return
    }

    logger.info(`Connecting to MCP server: ${serverConfig.name}`)
    
    const connection = new MCPConnection(serverConfig)
    await connection.connect()
    
    this.connections.set(serverConfig.name, connection)
    
    // Auto-discover if enabled
    if (this.config.autoDiscover) {
      await this.discoverServer(serverConfig.name)
    }
    
    logger.info(`Connected to ${serverConfig.name}`)
  }

  /**
   * Disconnect from a server
   */
  async disconnect(serverName: string): Promise<void> {
    const connection = this.connections.get(serverName)
    if (!connection) {
      logger.warn(`Not connected to ${serverName}`)
      return
    }

    await connection.disconnect()
    this.connections.delete(serverName)
    
    // Remove discovered items
    for (const [key, tool] of this.tools) {
      if (tool.serverName === serverName) {
        this.tools.delete(key)
      }
    }
    for (const [key, resource] of this.resources) {
      if (resource.serverName === serverName) {
        this.resources.delete(key)
      }
    }
    for (const [key, prompt] of this.prompts) {
      if (prompt.serverName === serverName) {
        this.prompts.delete(key)
      }
    }
    
    logger.info(`Disconnected from ${serverName}`)
  }

  /**
   * Connect to all configured servers
   */
  async connectAll(): Promise<void> {
    const promises = this.config.servers.map(config => 
      this.connect(config).catch(err => {
        logger.error(`Failed to connect to ${config.name}: ${err}`)
      })
    )
    await Promise.all(promises)
  }

  /**
   * Disconnect from all servers
   */
  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.connections.keys()).map(name => 
      this.disconnect(name)
    )
    await Promise.all(promises)
  }

  /**
   * Discover tools and resources from a server
   */
  private async discoverServer(serverName: string): Promise<void> {
    const connection = this.connections.get(serverName)
    if (!connection) return

    try {
      // Discover tools
      const tools = await this.discovery.discoverTools(connection)
      for (const tool of tools) {
        this.tools.set(`${serverName}:${tool.name}`, tool)
      }
      
      // Discover resources
      const resources = await this.discovery.discoverResources(connection)
      for (const resource of resources) {
        this.resources.set(`${serverName}:${resource.uri}`, resource)
      }
      
      // Discover prompts
      const prompts = await this.discovery.discoverPrompts(connection)
      for (const prompt of prompts) {
        this.prompts.set(`${serverName}:${prompt.name}`, prompt)
      }
      
      logger.debug(
        `Discovered from ${serverName}: ${tools.length} tools, ` +
        `${resources.length} resources, ${prompts.length} prompts`
      )
    } catch (error) {
      logger.error(`Discovery failed for ${serverName}: ${error}`)
    }
  }

  /**
   * Call a tool
   */
  async callTool(
    serverName: string,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<ToolCallResult> {
    const connection = this.connections.get(serverName)
    if (!connection) {
      throw new Error(`Not connected to ${serverName}`)
    }

    logger.debug(`Calling tool ${toolName} on ${serverName}`)
    
    return connection.callTool(toolName, args)
  }

  /**
   * Read a resource
   */
  async readResource(
    serverName: string,
    uri: string
  ): Promise<ResourceReadResult> {
    const connection = this.connections.get(serverName)
    if (!connection) {
      throw new Error(`Not connected to ${serverName}`)
    }

    logger.debug(`Reading resource ${uri} from ${serverName}`)
    
    return connection.readResource(uri)
  }

  /**
   * Get a prompt
   */
  async getPrompt(
    serverName: string,
    promptName: string,
    args?: Record<string, unknown>
  ): Promise<unknown> {
    const connection = this.connections.get(serverName)
    if (!connection) {
      throw new Error(`Not connected to ${serverName}`)
    }

    return connection.getPrompt(promptName, args)
  }

  /**
   * Get all discovered tools
   */
  getTools(): MCPTool[] {
    return Array.from(this.tools.values())
  }

  /**
   * Get all discovered resources
   */
  getResources(): MCPResource[] {
    return Array.from(this.resources.values())
  }

  /**
   * Get all discovered prompts
   */
  getPrompts(): MCPPrompt[] {
    return Array.from(this.prompts.values())
  }

  /**
   * Get connection status
   */
  getStatus(): Map<string, ConnectionStatus> {
    const status = new Map<string, ConnectionStatus>()
    for (const [name, connection] of this.connections) {
      status.set(name, connection.getStatus())
    }
    return status
  }

  /**
   * Check if connected to a server
   */
  isConnected(serverName: string): boolean {
    const connection = this.connections.get(serverName)
    return connection?.getStatus() === "connected"
  }
}

/**
 * Create an MCP client
 */
export function createMCPClient(config?: Partial<MCPClientConfig>): MCPClient {
  return new MCPClient(config)
}
