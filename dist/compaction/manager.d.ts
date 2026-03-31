/**
 * Beast CLI — Compaction Manager
 *
 * Manages conversation context compaction.
 * Inspired by Claude Code's auto-compaction.
 */
import type { Message } from "../providers/types";
import type { CompactionConfig, CompactionResult, CompactionStrategy, Compactor } from "./types";
/**
 * Compaction Manager
 */
export declare class CompactionManager {
    private config;
    private compactors;
    private lastCompaction;
    constructor(config?: Partial<CompactionConfig>);
    /**
     * Register a compaction strategy
     */
    registerCompactor(strategy: CompactionStrategy, compactor: Compactor): void;
    /**
     * Check if compaction is needed
     */
    needsCompaction(messages: Message[], estimatedTokens?: number): boolean;
    /**
     * Compact messages
     */
    compact(messages: Message[]): Promise<{
        messages: Message[];
        result: CompactionResult;
    }>;
    /**
     * Estimate token count for messages
     */
    estimateTokens(messages: Message[]): number;
    /**
     * Get compaction stats
     */
    getStats(): {
        config: CompactionConfig;
        lastCompaction: CompactionResult | null;
    };
    /**
     * Update configuration
     */
    updateConfig(updates: Partial<CompactionConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): CompactionConfig;
}
/**
 * Create a compaction manager
 */
export declare function createCompactionManager(config?: Partial<CompactionConfig>): CompactionManager;
