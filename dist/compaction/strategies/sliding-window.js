/**
 * Beast CLI — Sliding Window Compaction Strategy
 *
 * Keeps only recent messages, discarding older ones.
 * Simple but effective for many use cases.
 */
import { createLogger } from "../../utils";
const logger = createLogger({ prefix: "compaction:sliding-window" });
/**
 * Sliding Window Compactor
 *
 * Simple strategy that keeps only the N most recent messages.
 */
export class SlidingWindowCompactor {
    name = "sliding-window";
    options;
    constructor(options = {}) {
        this.options = {
            preserveSystem: true,
            ...options,
        };
    }
    async compact(messages, config) {
        const originalCount = messages.length;
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
            };
        }
        // Extract system messages if preserving
        const systemMessages = [];
        const nonSystemMessages = [];
        if (this.options.preserveSystem) {
            for (const msg of messages) {
                if (msg.role === "system") {
                    systemMessages.push(msg);
                }
                else {
                    nonSystemMessages.push(msg);
                }
            }
        }
        else {
            nonSystemMessages.push(...messages);
        }
        // Calculate how many messages to keep
        const maxNonSystem = config.maxMessages - systemMessages.length;
        const keptNonSystem = nonSystemMessages.slice(-maxNonSystem);
        // Combine system + kept messages
        const compacted = [...systemMessages, ...keptNonSystem];
        // Calculate tokens saved
        const removedCount = originalCount - compacted.length;
        const tokensSaved = this.estimateTokens(messages) - this.estimateTokens(compacted);
        const result = {
            originalCount,
            compactedCount: compacted.length,
            removedCount,
            keptCount: compacted.length,
            tokensSaved,
            timestamp: new Date(),
        };
        logger.debug(`Sliding window: kept ${compacted.length}/${originalCount} messages ` +
            `(${removedCount} removed, ${tokensSaved} tokens saved)`);
        return { messages: compacted, result };
    }
    /**
     * Estimate token count
     */
    estimateTokens(messages) {
        let totalChars = 0;
        for (const msg of messages) {
            totalChars += msg.content.length;
            if (msg.toolCalls) {
                for (const tc of msg.toolCalls) {
                    totalChars += tc.name.length;
                    totalChars += JSON.stringify(tc.arguments).length;
                }
            }
        }
        return Math.ceil(totalChars / 4);
    }
}
//# sourceMappingURL=sliding-window.js.map