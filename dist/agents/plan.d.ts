/**
 * Beast CLI — Plan Agent
 *
 * Read-only agent for planning and analysis.
 * Inspired by Claude Code's plan mode.
 */
import type { Provider, Message } from "../providers/types";
export interface PlanAgentConfig {
    provider: Provider;
    model?: string;
    systemPrompt?: string;
    onToken?: (token: string) => void;
    workingDir?: string;
}
export interface PlanResponse {
    content: string;
    tokens: {
        input: number;
        output: number;
    };
}
/**
 * Plan Agent - Read-only analysis agent
 */
export declare class PlanAgent {
    private provider;
    private model;
    private systemPrompt;
    private messages;
    private onToken?;
    private workingDir;
    constructor(config: PlanAgentConfig);
    /**
     * Analyze a task and create a plan
     */
    plan(task: string): Promise<PlanResponse>;
    /**
     * Ask a follow-up question
     */
    ask(question: string): Promise<PlanResponse>;
    /**
     * Get conversation history
     */
    getMessages(): Message[];
    /**
     * Clear history
     */
    clearHistory(): void;
}
