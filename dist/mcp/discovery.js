/**
 * Beast CLI — MCP Discovery
 *
 * Discovers tools, resources, and prompts from MCP servers.
 */
import { createLogger } from "../utils";
const logger = createLogger({ prefix: "mcp:discovery" });
/**
 * MCP Discovery
 *
 * Discovers available capabilities from an MCP server.
 */
export class MCPDiscovery {
    /**
     * Discover tools from a connection
     */
    async discoverTools(connection) {
        try {
            const result = await connection.sendRequest("tools/list", {});
            const tools = (result.tools || []).map(tool => ({
                name: tool.name,
                description: tool.description || "",
                inputSchema: tool.inputSchema,
                serverName: "", // Will be set by caller
            }));
            logger.debug(`Discovered ${tools.length} tools`);
            return tools;
        }
        catch (error) {
            logger.error(`Failed to discover tools: ${error}`);
            return [];
        }
    }
    /**
     * Discover resources from a connection
     */
    async discoverResources(connection) {
        try {
            const result = await connection.sendRequest("resources/list", {});
            const resources = (result.resources || []).map(resource => ({
                uri: resource.uri,
                name: resource.name,
                description: resource.description,
                mimeType: resource.mimeType,
                serverName: "", // Will be set by caller
            }));
            logger.debug(`Discovered ${resources.length} resources`);
            return resources;
        }
        catch (error) {
            logger.error(`Failed to discover resources: ${error}`);
            return [];
        }
    }
    /**
     * Discover prompts from a connection
     */
    async discoverPrompts(connection) {
        try {
            const result = await connection.sendRequest("prompts/list", {});
            const prompts = (result.prompts || []).map(prompt => ({
                name: prompt.name,
                description: prompt.description,
                arguments: prompt.arguments,
                serverName: "", // Will be set by caller
            }));
            logger.debug(`Discovered ${prompts.length} prompts`);
            return prompts;
        }
        catch (error) {
            logger.error(`Failed to discover prompts: ${error}`);
            return [];
        }
    }
    /**
     * Discover all capabilities
     */
    async discoverAll(connection) {
        const [tools, resources, prompts] = await Promise.all([
            this.discoverTools(connection),
            this.discoverResources(connection),
            this.discoverPrompts(connection),
        ]);
        return { tools, resources, prompts };
    }
}
//# sourceMappingURL=discovery.js.map