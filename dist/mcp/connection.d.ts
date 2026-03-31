/**
 * Beast CLI — MCP Connection
 *
 * Manages a single MCP server connection.
 */
import type { MCPServerConfig, ToolCallResult, ResourceReadResult } from "./types";
import { EventEmitter } from "events";
export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error";
/**
 * MCP Connection
 *
 * Handles communication with a single MCP server.
 */
export declare class MCPConnection extends EventEmitter {
    private config;
    private status;
    private process;
    private messageId;
    private pendingRequests;
    private buffer;
    constructor(config: MCPServerConfig);
    /**
     * Connect to the server
     */
    connect(): Promise<void>;
    /**
     * Connect via stdio
     */
    private connectStdio;
    /**
     * Connect via SSE (placeholder)
     */
    private connectSSE;
    /**
     * Initialize the connection
     */
    private initialize;
    /**
     * Handle incoming data
     */
    private handleData;
    /**
     * Handle a single message
     */
    private handleMessage;
    /**
     * Send a request
     */
    sendRequest(method: string, params: Record<string, unknown>): Promise<unknown>;
    /**
     * Send a notification
     */
    sendNotification(method: string, params: Record<string, unknown>): void;
    /**
     * Send a message
     */
    private sendMessage;
    /**
     * Call a tool
     */
    callTool(name: string, args: Record<string, unknown>): Promise<ToolCallResult>;
    /**
     * Read a resource
     */
    readResource(uri: string): Promise<ResourceReadResult>;
    /**
     * Get a prompt
     */
    getPrompt(name: string, args?: Record<string, unknown>): Promise<unknown>;
    /**
     * Get connection status
     */
    getStatus(): ConnectionStatus;
    /**
     * Disconnect
     */
    disconnect(): Promise<void>;
}
