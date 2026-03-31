/**
 * Beast CLI — Compaction Module
 *
 * Compress conversation context when it exceeds a threshold.
 * Inspired by Claude Code's auto-compaction feature.
 */
export { CompactionManager, createCompactionManager, } from "./manager";
export { SummaryCompactor, } from "./strategies/summary";
export { SlidingWindowCompactor, } from "./strategies/sliding-window";
//# sourceMappingURL=index.js.map