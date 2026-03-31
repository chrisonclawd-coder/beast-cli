/**
 * Beast CLI — MCP Discovery
 *
 * Discovers tools, resources, and prompts from MCP servers.
 */
import type { MCPTool, MCPResource, MCPPrompt } from "./types";
import { MCPConnection } from "./connection";
export interface DiscoveredTool extends MCPTool {
}
export interface DiscoveredResource extends MCPResource {
}
/**
 * MCP Discovery
 *
 * Discovers available capabilities from an MCP server.
 */
export declare class MCPDiscovery {
    /**
     * Discover tools from a connection
     */
    discoverTools(connection: MCPConnection): Promise<MCPTool[]>;
    /**
     * Discover resources from a connection
     */
    discoverResources(connection: MCPConnection): Promise<MCPResource[]>;
    /**
     * Discover prompts from a connection
     */
    discoverPrompts(connection: MCPConnection): Promise<MCPPrompt[]>;
    /**
     * Discover all capabilities
     */
    discoverAll(connection: MCPConnection): Promise<{
        tools: MCPTool[];
        resources: MCPResource[];
        prompts: MCPPrompt[];
    }>;
}
