/**
 * Beast CLI — MCP Client
 *
 * Main client for connecting to MCP servers.
 */
import type { MCPClientConfig, MCPServerConfig, MCPTool, MCPResource, MCPPrompt, ToolCallResult, ResourceReadResult } from "./types";
import { type ConnectionStatus } from "./connection";
/**
 * MCP Client
 *
 * Manages connections to MCP servers.
 */
export declare class MCPClient {
    private config;
    private connections;
    private discovery;
    private tools;
    private resources;
    private prompts;
    constructor(config?: Partial<MCPClientConfig>);
    /**
     * Connect to a server
     */
    connect(serverConfig: MCPServerConfig): Promise<void>;
    /**
     * Disconnect from a server
     */
    disconnect(serverName: string): Promise<void>;
    /**
     * Connect to all configured servers
     */
    connectAll(): Promise<void>;
    /**
     * Disconnect from all servers
     */
    disconnectAll(): Promise<void>;
    /**
     * Discover tools and resources from a server
     */
    private discoverServer;
    /**
     * Call a tool
     */
    callTool(serverName: string, toolName: string, args: Record<string, unknown>): Promise<ToolCallResult>;
    /**
     * Read a resource
     */
    readResource(serverName: string, uri: string): Promise<ResourceReadResult>;
    /**
     * Get a prompt
     */
    getPrompt(serverName: string, promptName: string, args?: Record<string, unknown>): Promise<unknown>;
    /**
     * Get all discovered tools
     */
    getTools(): MCPTool[];
    /**
     * Get all discovered resources
     */
    getResources(): MCPResource[];
    /**
     * Get all discovered prompts
     */
    getPrompts(): MCPPrompt[];
    /**
     * Get connection status
     */
    getStatus(): Map<string, ConnectionStatus>;
    /**
     * Check if connected to a server
     */
    isConnected(serverName: string): boolean;
}
/**
 * Create an MCP client
 */
export declare function createMCPClient(config?: Partial<MCPClientConfig>): MCPClient;
