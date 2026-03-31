/**
 * Beast CLI — Sliding Window Compaction Strategy
 * 
 * Keeps only recent messages, discarding older ones.
 * Simple but effective for many use cases.
 */

import type { Message } from "../../providers/types"
import type { CompactionConfig, CompactionResult, Compactor } from "../types"
import { createLogger } from "../../utils"

const logger = createLogger({ prefix: "compaction:sliding-window" })

export interface SlidingWindowOptions {
  /** Whether to preserve system messages */
  preserveSystem?: boolean
}

/**
 * Sliding Window Compactor
 * 
 * Simple strategy that keeps only the N most recent messages.
 */
export class SlidingWindowCompactor implements Compactor {
  readonly name = "sliding-window"
  private options: SlidingWindowOptions

  constructor(options: SlidingWindowOptions = {}) {
    this.options = {
      preserveSystem: true,
      ...options,
    }
  }

  async compact(
    messages: Message[],
    config: CompactionConfig
  ): Promise<{ messages: Message[]; result: CompactionResult }> {
    const originalCount = messages.length
    
    // If under limit, no compaction needed
    if (originalCount <= config.maxMessages) {
      return {
        messages,
        result: {
          originalCount,
          compactedCount: originalCount,
          removedCount: 0,
          keptCount: originalCount,
          tokensSaved: 0,
          timestamp: new Date(),
        },
      }
    }

    // Extract system messages if preserving
    const systemMessages: Message[] = []
    const nonSystemMessages: Message[] = []
    
    if (this.options.preserveSystem) {
      for (const msg of messages) {
        if (msg.role === "system") {
          systemMessages.push(msg)
        } else {
          nonSystemMessages.push(msg)
        }
      }
    } else {
      nonSystemMessages.push(...messages)
    }

    // Calculate how many messages to keep
    const maxNonSystem = config.maxMessages - systemMessages.length
    const keptNonSystem = nonSystemMessages.slice(-maxNonSystem)
    
    // Combine system + kept messages
    const compacted = [...systemMessages, ...keptNonSystem]
    
    // Calculate tokens saved
    const removedCount = originalCount - compacted.length
    const tokensSaved = this.estimateTokens(messages) - this.estimateTokens(compacted)

    const result: CompactionResult = {
      originalCount,
      compactedCount: compacted.length,
      removedCount,
      keptCount: compacted.length,
      tokensSaved,
      timestamp: new Date(),
    }

    logger.debug(
      `Sliding window: kept ${compacted.length}/${originalCount} messages ` +
      `(${removedCount} removed, ${tokensSaved} tokens saved)`
    )

    return { messages: compacted, result }
  }

  /**
   * Estimate token count
   */
  private estimateTokens(messages: Message[]): number {
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
}
