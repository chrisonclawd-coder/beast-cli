/**
 * Beast CLI — Summary Compaction Strategy
 *
 * Summarizes older messages to reduce context size.
 * Inspired by Claude Code's summarization approach.
 */
import type { Message } from "../../providers/types";
import type { CompactionConfig, CompactionResult, Compactor } from "../types";
export interface SummaryOptions {
    /** Custom summarization prompt */
    prompt?: string;
    /** Maximum length of summary */
    maxLength?: number;
}
/**
 * Summary Compactor
 *
 * Replaces older messages with a summary.
 */
export declare class SummaryCompactor implements Compactor {
    readonly name = "summary";
    private options;
    constructor(options?: SummaryOptions);
    compact(messages: Message[], config: CompactionConfig): Promise<{
        messages: Message[];
        result: CompactionResult;
    }>;
    /**
     * Generate a summary of messages
     *
     * In a real implementation, this would call an LLM.
     * For now, we create a simple extractive summary.
     */
    private generateSummary;
    /**
     * Truncate string to max length
     */
    private truncate;
    /**
     * Estimate token count
     */
    private estimateTokens;
}
