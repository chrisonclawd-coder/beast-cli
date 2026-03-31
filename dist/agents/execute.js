/**
 * Beast CLI — Execute Agent
 *
 * Agent that can execute tasks with full tool access.
 * Inspired by OpenCode's agent loop.
 */
/**
 * Execute Agent - Full tool access agent
 */
export class ExecuteAgent {
    provider;
    model;
    tools;
    systemPrompt;
    maxIterations;
    messages = [];
    onToken;
    onToolCall;
    onToolResult;
    workingDir;
    totalInputTokens = 0;
    totalOutputTokens = 0;
    constructor(config) {
        this.provider = config.provider;
        this.model = config.model || "gpt-4.1";
        this.tools = config.tools;
        this.systemPrompt = config.systemPrompt || getDefaultSystemPrompt();
        this.maxIterations = config.maxIterations || 50;
        this.onToken = config.onToken;
        this.onToolCall = config.onToolCall;
        this.onToolResult = config.onToolResult;
        this.workingDir = config.workingDir || process.cwd();
    }
    /**
     * Run the agent with a task
     */
    async run(task) {
        this.messages = [];
        this.totalInputTokens = 0;
        this.totalOutputTokens = 0;
        // Add user message
        this.messages.push({
            role: "user",
            content: task,
        });
        let iterations = 0;
        let lastContent = "";
        let lastToolCalls;
        while (iterations < this.maxIterations) {
            iterations++;
            // Get tool definitions for provider
            const toolDefs = this.tools.getToolDefinitions().map((t) => ({
                name: t.name,
                description: t.description,
                parameters: t.parameters,
            }));
            // Call provider with streaming
            const stream = this.provider.stream(this.messages, {
                model: this.model,
                systemPrompt: this.systemPrompt,
                tools: toolDefs,
                maxTokens: 8192,
            });
            let content = "";
            const toolCalls = [];
            let inputTokens = 0;
            let outputTokens = 0;
            for await (const chunk of stream) {
                if (chunk.type === "text" && chunk.content !== undefined) {
                    content += chunk.content;
                    if (chunk.content) {
                        this.onToken?.(chunk.content);
                    }
                }
                else if (chunk.type === "tool_call" && chunk.toolCall) {
                    toolCalls.push(chunk.toolCall);
                }
                else if (chunk.type === "done" && chunk.usage) {
                    inputTokens = chunk.usage.inputTokens;
                    outputTokens = chunk.usage.outputTokens;
                }
            }
            this.totalInputTokens += inputTokens;
            this.totalOutputTokens += outputTokens;
            // Add assistant message
            const assistantMessage = {
                role: "assistant",
                content,
            };
            if (toolCalls.length > 0) {
                assistantMessage.toolCalls = toolCalls;
            }
            this.messages.push(assistantMessage);
            lastContent = content;
            lastToolCalls = toolCalls.length > 0 ? toolCalls : undefined;
            // If no tool calls, we're done
            if (toolCalls.length === 0) {
                break;
            }
            // Execute tool calls
            for (const tc of toolCalls) {
                this.onToolCall?.(tc.name, tc.arguments);
                const result = await this.tools.execute(tc.name, tc.arguments, {
                    workingDir: this.workingDir,
                });
                this.onToolResult?.(result);
                // Add tool result message
                this.messages.push({
                    role: "tool",
                    content: result.result.success
                        ? result.result.content
                        : `Error: ${result.result.error}`,
                    toolCallId: tc.id,
                });
            }
        }
        return {
            content: lastContent,
            toolCalls: lastToolCalls,
            iterations,
            totalTokens: {
                input: this.totalInputTokens,
                output: this.totalOutputTokens,
            },
        };
    }
    /**
     * Continue the conversation
     */
    async continueConversation(message) {
        this.messages.push({
            role: "user",
            content: message,
        });
        // Same loop as run()
        let iterations = 0;
        let lastContent = "";
        let lastToolCalls;
        while (iterations < this.maxIterations) {
            iterations++;
            const toolDefs = this.tools.getToolDefinitions().map((t) => ({
                name: t.name,
                description: t.description,
                parameters: t.parameters,
            }));
            const stream = this.provider.stream(this.messages, {
                model: this.model,
                systemPrompt: this.systemPrompt,
                tools: toolDefs,
                maxTokens: 8192,
            });
            let content = "";
            const toolCalls = [];
            let inputTokens = 0;
            let outputTokens = 0;
            for await (const chunk of stream) {
                if (chunk.type === "text" && chunk.content !== undefined) {
                    content += chunk.content;
                    if (chunk.content) {
                        this.onToken?.(chunk.content);
                    }
                }
                else if (chunk.type === "tool_call" && chunk.toolCall) {
                    toolCalls.push(chunk.toolCall);
                }
                else if (chunk.type === "done" && chunk.usage) {
                    inputTokens = chunk.usage.inputTokens;
                    outputTokens = chunk.usage.outputTokens;
                }
            }
            this.totalInputTokens += inputTokens;
            this.totalOutputTokens += outputTokens;
            const assistantMessage = {
                role: "assistant",
                content,
            };
            if (toolCalls.length > 0) {
                assistantMessage.toolCalls = toolCalls;
            }
            this.messages.push(assistantMessage);
            lastContent = content;
            lastToolCalls = toolCalls.length > 0 ? toolCalls : undefined;
            if (toolCalls.length === 0) {
                break;
            }
            for (const tc of toolCalls) {
                this.onToolCall?.(tc.name, tc.arguments);
                const result = await this.tools.execute(tc.name, tc.arguments, {
                    workingDir: this.workingDir,
                });
                this.onToolResult?.(result);
                this.messages.push({
                    role: "tool",
                    content: result.result.success
                        ? result.result.content
                        : `Error: ${result.result.error}`,
                    toolCallId: tc.id,
                });
            }
        }
        return {
            content: lastContent,
            toolCalls: lastToolCalls,
            iterations,
            totalTokens: {
                input: this.totalInputTokens,
                output: this.totalOutputTokens,
            },
        };
    }
    /**
     * Get conversation history
     */
    getMessages() {
        return [...this.messages];
    }
    /**
     * Clear conversation history
     */
    clearHistory() {
        this.messages = [];
        this.totalInputTokens = 0;
        this.totalOutputTokens = 0;
    }
}
/**
 * Default system prompt for execute agent
 */
function getDefaultSystemPrompt() {
    return `You are a powerful AI coding assistant with access to tools for file operations and shell commands.

You can:
- Read, write, and edit files
- Execute shell commands
- Search for files and patterns

Always:
- Be helpful and efficient
- Explain what you're doing
- Handle errors gracefully
- Ask for clarification when needed

When making changes:
- Show the user what you're going to change
- Make minimal, targeted edits
- Verify your changes work correctly`;
}
//# sourceMappingURL=execute.js.map