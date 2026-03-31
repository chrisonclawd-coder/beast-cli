/**
 * Beast CLI — Compaction Types
 */
import type { Message } from "../providers/types";
/**
 * Compaction strategy type
 */
export type CompactionStrategy = "summary" | "sliding-window" | "hybrid";
/**
 * Compaction configuration
 */
export interface CompactionConfig {
    /** Maximum messages before compaction triggers */
    maxMessages: number;
    /** Maximum tokens before compaction triggers */
    maxTokens: number;
    /** Compaction strategy to use */
    strategy: CompactionStrategy;
    /** Number of recent messages to always keep */
    keepRecent: number;
    /** Minimum messages to compact (don't compact if below this) */
    minCompact: number;
    /** Enable automatic compaction */
    autoCompact: boolean;
    /** Custom summarization prompt */
    summaryPrompt?: string;
}
/**
 * Result of a compaction operation
 */
export interface CompactionResult {
    /** Original message count */
    originalCount: number;
    /** Compacted message count */
    compactedCount: number;
    /** Number of messages removed */
    removedCount: number;
    /** Number of messages kept intact */
    keptCount: number;
    /** Summary message (if summary strategy) */
    summary?: string;
    /** Tokens saved (estimated) */
    tokensSaved: number;
    /** Timestamp of compaction */
    timestamp: Date;
}
/**
 * Interface for compaction strategies
 */
export interface Compactor {
    readonly name: string;
    compact(messages: Message[], config: CompactionConfig): Promise<{
        messages: Message[];
        result: CompactionResult;
    }>;
}
/**
 * Message with metadata for compaction
 */
export interface CompactionMessage extends Message {
    id: string;
    timestamp?: Date;
    tokenCount?: number;
    important?: boolean;
}
