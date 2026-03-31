/**
 * Beast CLI — Compaction Manager
 * 
 * Manages conversation context compaction.
 * Inspired by Claude Code's auto-compaction.
 */

import type { Message } from "../providers/types"
import type { 
  CompactionConfig, 
  CompactionResult, 
  CompactionStrategy,
  Compactor 
} from "./types"
import { SummaryCompactor } from "./strategies/summary"
import { SlidingWindowCompactor } from "./strategies/sliding-window"
import { createLogger } from "../utils"

const logger = createLogger({ prefix: "compaction" })

const DEFAULT_CONFIG: CompactionConfig = {
  maxMessages: 100,
  maxTokens: 100000,
  strategy: "summary",
  keepRecent: 10,
  minCompact: 20,
  autoCompact: true,
}

/**
 * Compaction Manager
 */
export class CompactionManager {
  private config: CompactionConfig
  private compactors: Map<CompactionStrategy, Compactor>
  private lastCompaction: CompactionResult | null = null

  constructor(config: Partial<CompactionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.compactors = new Map()
    
    // Register default compactors
    this.registerCompactor("summary", new SummaryCompactor())
    this.registerCompactor("sliding-window", new SlidingWindowCompactor())
  }

  /**
   * Register a compaction strategy
   */
  registerCompactor(strategy: CompactionStrategy, compactor: Compactor): void {
    this.compactors.set(strategy, compactor)
  }

  /**
   * Check if compaction is needed
   */
  needsCompaction(messages: Message[], estimatedTokens?: number): boolean {
    if (!this.config.autoCompact) {
      return false
    }

    const messageCount = messages.length
    const tokenCount = estimatedTokens ?? this.estimateTokens(messages)

    const overMessageLimit = messageCount > this.config.maxMessages
    const overTokenLimit = tokenCount > this.config.maxTokens
    const enoughToCompact = messageCount >= this.config.minCompact

    return (overMessageLimit || overTokenLimit) && enoughToCompact
  }

  /**
   * Compact messages
   */
  async compact(messages: Message[]): Promise<{ messages: Message[]; result: CompactionResult }> {
    const compactor = this.compactors.get(this.config.strategy)
    
    if (!compactor) {
      logger.warn(`Unknown compaction strategy: ${this.config.strategy}, using sliding-window`)
      const fallback = this.compactors.get("sliding-window")
      if (!fallback) {
        throw new Error("No compactor available")
      }
      return fallback.compact(messages, this.config)
    }

    const result = await compactor.compact(messages, this.config)
    this.lastCompaction = result.result
    
    logger.info(
      `Compacted ${result.result.originalCount} → ${result.result.compactedCount} messages ` +
      `(${result.result.tokensSaved} tokens saved)`
    )

    return result
  }

  /**
   * Estimate token count for messages
   */
  estimateTokens(messages: Message[]): number {
    // Rough estimate: ~4 characters per token
    let totalChars = 0
    for (const msg of messages) {
      totalChars += msg.content.length
      if (msg.toolCalls) {
        for (const tc of msg.toolCalls) {
          totalChars += tc.name.length
          totalChars += JSON.stringify(tc.arguments).length
        }
      }
    }
    return Math.ceil(totalChars / 4)
  }

  /**
   * Get compaction stats
   */
  getStats(): {
    config: CompactionConfig
    lastCompaction: CompactionResult | null
  } {
    return {
      config: { ...this.config },
      lastCompaction: this.lastCompaction,
    }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<CompactionConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * Get current configuration
   */
  getConfig(): CompactionConfig {
    return { ...this.config }
  }
}

/**
 * Create a compaction manager
 */
export function createCompactionManager(config?: Partial<CompactionConfig>): CompactionManager {
  return new CompactionManager(config)
}
