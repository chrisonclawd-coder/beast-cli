/**
 * Beast CLI — Agent System
 *
 * Three agent modes: Plan, Execute, Swarm.
 * Inspired by OpenCode's dual-agent + Claude Code's swarm.
 */
import type { Message, Provider } from "../providers/types";
import type { Tool, ToolResult } from "../tools/types";
export type AgentMode = "plan" | "execute" | "swarm";
export interface AgentConfig {
    mode: AgentMode;
    provider: Provider;
    model: string;
    tools: Tool[];
    systemPrompt: string;
    maxIterations: number;
}
export interface AgentResult {
    content: string;
    toolCalls: ToolCallRecord[];
    iterations: number;
    tokensUsed: {
        input: number;
        output: number;
    };
    durationMs: number;
}
export interface ToolCallRecord {
    tool: string;
    params: Record<string, unknown>;
    result: ToolResult;
    timestamp: number;
}
export interface SwarmTask {
    id: string;
    description: string;
    agentId: string;
    status: "pending" | "running" | "done" | "failed";
    result?: string;
    branch?: string;
}
export interface SwarmConfig {
    maxTeammates: number;
    isolation: "worktree" | "directory";
    mergeStrategy: "auto" | "manual";
}
export interface Agent {
    readonly mode: AgentMode;
    run(task: string, context?: AgentContext): Promise<AgentResult>;
    stop(): void;
    isActive(): boolean;
}
export interface AgentContext {
    messages: Message[];
    workingDir: string;
    files?: string[];
    previousResults?: AgentResult[];
}
