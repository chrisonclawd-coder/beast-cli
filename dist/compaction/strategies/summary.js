/**
 * Beast CLI — Summary Compaction Strategy
 *
 * Summarizes older messages to reduce context size.
 * Inspired by Claude Code's summarization approach.
 */
import { createLogger } from "../../utils";
const logger = createLogger({ prefix: "compaction:summary" });
const DEFAULT_SUMMARY_PROMPT = `Summarize the following conversation, preserving:
1. Key decisions and their rationale
2. Important context and constraints
3. Any unresolved questions or issues

Be concise but comprehensive. Focus on information that would be needed to continue the conversation effectively.`;
/**
 * Summary Compactor
 *
 * Replaces older messages with a summary.
 */
export class SummaryCompactor {
    name = "summary";
    options;
    constructor(options = {}) {
        this.options = {
            prompt: DEFAULT_SUMMARY_PROMPT,
            maxLength: 2000,
            ...options,
        };
    }
    async compact(messages, config) {
        const originalCount = messages.length;
        // Determine split point
        const keepCount = config.keepRecent;
        const toCompact = messages.slice(0, -keepCount);
        const toKeep = messages.slice(-keepCount);
        if (toCompact.length === 0) {
            logger.debug("No messages to compact");
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
        // Generate summary (in real implementation, would call LLM)
        const summary = await this.generateSummary(toCompact);
        // Create summary message
        const summaryMessage = {
            role: "system",
            content: `[Conversation Summary]\n${summary}`,
        };
        // Combine summary with kept messages
        const compacted = [summaryMessage, ...toKeep];
        // Estimate tokens saved
        const originalTokens = this.estimateTokens(toCompact);
        const summaryTokens = this.estimateTokens([summaryMessage]);
        const tokensSaved = Math.max(0, originalTokens - summaryTokens);
        const result = {
            originalCount,
            compactedCount: compacted.length,
            removedCount: toCompact.length - 1, // -1 because summary replaces them
            keptCount: toKeep.length,
            summary,
            tokensSaved,
            timestamp: new Date(),
        };
        logger.debug(`Summarized ${toCompact.length} messages into summary (${tokensSaved} tokens saved)`);
        return { messages: compacted, result };
    }
    /**
     * Generate a summary of messages
     *
     * In a real implementation, this would call an LLM.
     * For now, we create a simple extractive summary.
     */
    async generateSummary(messages) {
        // Simple extractive summary - take key points
        const points = [];
        for (const msg of messages) {
            if (msg.role === "system") {
                // Preserve system message info
                points.push(`System: ${this.truncate(msg.content, 200)}`);
            }
            else if (msg.role === "user") {
                // Extract key user requests
                const sentences = msg.content.split(/[.!?]+/).filter(s => s.trim());
                if (sentences.length > 0) {
                    points.push(`User asked: ${this.truncate(sentences[0], 150)}`);
                }
            }
            else if (msg.role === "assistant") {
                // Extract key assistant responses
                const sentences = msg.content.split(/[.!?]+/).filter(s => s.trim());
                if (sentences.length > 0) {
                    const key = sentences.find(s => s.includes("decided") ||
                        s.includes("created") ||
                        s.includes("updated") ||
                        s.includes("fixed"));
                    if (key) {
                        points.push(`Assistant: ${this.truncate(key, 150)}`);
                    }
                }
            }
        }
        // Limit summary length
        const summary = points.slice(-20).join("\n");
        return this.truncate(summary, this.options.maxLength ?? 2000);
    }
    /**
     * Truncate string to max length
     */
    truncate(str, maxLength) {
        if (str.length <= maxLength)
            return str;
        return str.slice(0, maxLength - 3) + "...";
    }
    /**
     * Estimate token count
     */
    estimateTokens(messages) {
        let totalChars = 0;
        for (const msg of messages) {
            totalChars += msg.content.length;
        }
        return Math.ceil(totalChars / 4);
    }
}
//# sourceMappingURL=summary.js.map