/**
 * Beast CLI — MCP Discovery
 * 
 * Discovers tools, resources, and prompts from MCP servers.
 */

import type { MCPTool, MCPResource, MCPPrompt } from "./types"
import { MCPConnection } from "./connection"
import { createLogger } from "../utils"

const logger = createLogger({ prefix: "mcp:discovery" })

export interface DiscoveredTool extends MCPTool {}

export interface DiscoveredResource extends MCPResource {}

/**
 * MCP Discovery
 * 
 * Discovers available capabilities from an MCP server.
 */
export class MCPDiscovery {
  /**
   * Discover tools from a connection
   */
  async discoverTools(connection: MCPConnection): Promise<MCPTool[]> {
    try {
      const result = await connection.sendRequest("tools/list", {}) as {
        tools: Array<{
          name: string
          description?: string
          inputSchema: Record<string, unknown>
        }>
      }

      const tools: MCPTool[] = (result.tools || []).map(tool => ({
        name: tool.name,
        description: tool.description || "",
        inputSchema: tool.inputSchema,
        serverName: "", // Will be set by caller
      }))

      logger.debug(`Discovered ${tools.length} tools`)
      return tools
    } catch (error) {
      logger.error(`Failed to discover tools: ${error}`)
      return []
    }
  }

  /**
   * Discover resources from a connection
   */
  async discoverResources(connection: MCPConnection): Promise<MCPResource[]> {
    try {
      const result = await connection.sendRequest("resources/list", {}) as {
        resources: Array<{
          uri: string
          name: string
          description?: string
          mimeType?: string
        }>
      }

      const resources: MCPResource[] = (result.resources || []).map(resource => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
        serverName: "", // Will be set by caller
      }))

      logger.debug(`Discovered ${resources.length} resources`)
      return resources
    } catch (error) {
      logger.error(`Failed to discover resources: ${error}`)
      return []
    }
  }

  /**
   * Discover prompts from a connection
   */
  async discoverPrompts(connection: MCPConnection): Promise<MCPPrompt[]> {
    try {
      const result = await connection.sendRequest("prompts/list", {}) as {
        prompts: Array<{
          name: string
          description?: string
          arguments?: Array<{
            name: string
            description?: string
            required?: boolean
          }>
        }>
      }

      const prompts: MCPPrompt[] = (result.prompts || []).map(prompt => ({
        name: prompt.name,
        description: prompt.description,
        arguments: prompt.arguments,
        serverName: "", // Will be set by caller
      }))

      logger.debug(`Discovered ${prompts.length} prompts`)
      return prompts
    } catch (error) {
      logger.error(`Failed to discover prompts: ${error}`)
      return []
    }
  }

  /**
   * Discover all capabilities
   */
  async discoverAll(connection: MCPConnection): Promise<{
    tools: MCPTool[]
    resources: MCPResource[]
    prompts: MCPPrompt[]
  }> {
    const [tools, resources, prompts] = await Promise.all([
      this.discoverTools(connection),
      this.discoverResources(connection),
      this.discoverPrompts(connection),
    ])

    return { tools, resources, prompts }
  }
}
