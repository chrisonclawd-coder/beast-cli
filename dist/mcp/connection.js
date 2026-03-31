/**
 * Beast CLI — MCP Connection
 *
 * Manages a single MCP server connection.
 */
import { createLogger } from "../utils";
import * as childProcess from "child_process";
import { EventEmitter } from "events";
const logger = createLogger({ prefix: "mcp:connection" });
/**
 * MCP Connection
 *
 * Handles communication with a single MCP server.
 */
export class MCPConnection extends EventEmitter {
    config;
    status = "disconnected";
    process = null;
    messageId = 0;
    pendingRequests = new Map();
    buffer = "";
    constructor(config) {
        super();
        this.config = config;
    }
    /**
     * Connect to the server
     */
    async connect() {
        if (this.status !== "disconnected") {
            throw new Error(`Already ${this.status}`);
        }
        this.status = "connecting";
        try {
            if (this.config.transport === "stdio") {
                await this.connectStdio();
            }
            else if (this.config.transport === "sse") {
                await this.connectSSE();
            }
            else {
                throw new Error(`Unsupported transport: ${this.config.transport}`);
            }
            // Initialize the connection
            await this.initialize();
            this.status = "connected";
            this.emit("connected");
        }
        catch (error) {
            this.status = "error";
            throw error;
        }
    }
    /**
     * Connect via stdio
     */
    async connectStdio() {
        if (!this.config.command) {
            throw new Error("Command required for stdio transport");
        }
        this.process = childProcess.spawn(this.config.command, this.config.args || [], {
            env: { ...process.env, ...this.config.env },
            stdio: ["pipe", "pipe", "pipe"],
        });
        if (!this.process.stdout || !this.process.stdin) {
            throw new Error("Failed to create stdio streams");
        }
        // Handle stdout
        this.process.stdout.on("data", (data) => {
            this.handleData(data.toString());
        });
        // Handle stderr
        this.process.stderr?.on("data", (data) => {
            logger.debug(`[${this.config.name} stderr] ${data.toString()}`);
        });
        // Handle exit
        this.process.on("exit", (code) => {
            logger.debug(`Process exited with code ${code}`);
            this.status = "disconnected";
            this.emit("disconnected");
        });
        // Handle error
        this.process.on("error", (error) => {
            logger.error(`Process error: ${error}`);
            this.status = "error";
            this.emit("error", error);
        });
    }
    /**
     * Connect via SSE (placeholder)
     */
    async connectSSE() {
        if (!this.config.url) {
            throw new Error("URL required for SSE transport");
        }
        // SSE implementation would go here
        // For now, throw not implemented
        throw new Error("SSE transport not yet implemented");
    }
    /**
     * Initialize the connection
     */
    async initialize() {
        await this.sendRequest("initialize", {
            protocolVersion: "2024-11-05",
            capabilities: {
                tools: {},
                resources: {},
                prompts: {},
            },
            clientInfo: {
                name: "beast-cli",
                version: "0.1.0",
            },
        });
        // Send initialized notification
        this.sendNotification("notifications/initialized", {});
    }
    /**
     * Handle incoming data
     */
    handleData(data) {
        this.buffer += data;
        // Process complete messages
        const lines = this.buffer.split("\n");
        this.buffer = lines.pop() || "";
        for (const line of lines) {
            if (line.trim()) {
                this.handleMessage(line);
            }
        }
    }
    /**
     * Handle a single message
     */
    handleMessage(line) {
        try {
            const message = JSON.parse(line);
            if (message.id !== undefined) {
                // Response to a request
                const pending = this.pendingRequests.get(message.id);
                if (pending) {
                    this.pendingRequests.delete(message.id);
                    if (message.error) {
                        pending.reject(new Error(message.error.message));
                    }
                    else {
                        pending.resolve(message.result);
                    }
                }
            }
            else if (message.method) {
                // Notification from server
                this.emit("notification", message.method, message.params);
            }
        }
        catch (error) {
            logger.error(`Failed to parse message: ${error}`);
        }
    }
    /**
     * Send a request
     */
    async sendRequest(method, params) {
        return new Promise((resolve, reject) => {
            const id = ++this.messageId;
            const message = {
                jsonrpc: "2.0",
                id,
                method,
                params,
            };
            this.pendingRequests.set(id, { resolve, reject });
            this.sendMessage(message);
            // Timeout
            const timeout = this.config.timeout || 30000;
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error(`Request timed out: ${method}`));
                }
            }, timeout);
        });
    }
    /**
     * Send a notification
     */
    sendNotification(method, params) {
        const message = {
            jsonrpc: "2.0",
            method,
            params,
        };
        this.sendMessage(message);
    }
    /**
     * Send a message
     */
    sendMessage(message) {
        const line = JSON.stringify(message) + "\n";
        if (this.config.transport === "stdio" && this.process?.stdin) {
            this.process.stdin.write(line);
        }
    }
    /**
     * Call a tool
     */
    async callTool(name, args) {
        const result = await this.sendRequest("tools/call", {
            name,
            arguments: args,
        });
        return result;
    }
    /**
     * Read a resource
     */
    async readResource(uri) {
        const result = await this.sendRequest("resources/read", { uri });
        return result;
    }
    /**
     * Get a prompt
     */
    async getPrompt(name, args) {
        return this.sendRequest("prompts/get", {
            name,
            arguments: args,
        });
    }
    /**
     * Get connection status
     */
    getStatus() {
        return this.status;
    }
    /**
     * Disconnect
     */
    async disconnect() {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
        this.status = "disconnected";
        this.emit("disconnected");
    }
}
//# sourceMappingURL=connection.js.map