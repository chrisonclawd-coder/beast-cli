/**
 * Beast CLI — Execute Agent
 *
 * Agent that can execute tasks with full tool access.
 * Inspired by OpenCode's agent loop.
 */
import type { Provider, Message, ToolCall } from "../providers/types";
import type { ToolExecutor, ExecutionResult } from "../tools/executor";
export interface ExecuteAgentConfig {
    provider: Provider;
    model?: string;
    tools: ToolExecutor;
    systemPrompt?: string;
    maxIterations?: number;
    onToken?: (token: string) => void;
    onToolCall?: (tool: string, params: Record<string, unknown>) => void;
    onToolResult?: (result: ExecutionResult) => void;
    workingDir?: string;
}
export interface AgentResponse {
    content: string;
    toolCalls?: ToolCall[];
    iterations: number;
    totalTokens: {
        input: number;
        output: number;
    };
}
/**
 * Execute Agent - Full tool access agent
 */
export declare class ExecuteAgent {
    private provider;
    private model;
    private tools;
    private systemPrompt;
    private maxIterations;
    private messages;
    private onToken?;
    private onToolCall?;
    private onToolResult?;
    private workingDir;
    private totalInputTokens;
    private totalOutputTokens;
    constructor(config: ExecuteAgentConfig);
    /**
     * Run the agent with a task
     */
    run(task: string): Promise<AgentResponse>;
    /**
     * Continue the conversation
     */
    continueConversation(message: string): Promise<AgentResponse>;
    /**
     * Get conversation history
     */
    getMessages(): Message[];
    /**
     * Clear conversation history
     */
    clearHistory(): void;
}
