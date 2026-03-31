/**
 * Beast CLI — Sliding Window Compaction Strategy
 *
 * Keeps only recent messages, discarding older ones.
 * Simple but effective for many use cases.
 */
import type { Message } from "../../providers/types";
import type { CompactionConfig, CompactionResult, Compactor } from "../types";
export interface SlidingWindowOptions {
    /** Whether to preserve system messages */
    preserveSystem?: boolean;
}
/**
 * Sliding Window Compactor
 *
 * Simple strategy that keeps only the N most recent messages.
 */
export declare class SlidingWindowCompactor implements Compactor {
    readonly name = "sliding-window";
    private options;
    constructor(options?: SlidingWindowOptions);
    compact(messages: Message[], config: CompactionConfig): Promise<{
        messages: Message[];
        result: CompactionResult;
    }>;
    /**
     * Estimate token count
     */
    private estimateTokens;
}
