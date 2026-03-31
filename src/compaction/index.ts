/**
 * Beast CLI — Compaction Module
 * 
 * Compress conversation context when it exceeds a threshold.
 * Inspired by Claude Code's auto-compaction feature.
 */

export { 
  CompactionManager, 
  createCompactionManager,
} from "./manager"

export {
  type CompactionConfig,
  type CompactionResult,
  type CompactionStrategy,
  type Compactor,
  type CompactionMessage,
} from "./types"

export { 
  SummaryCompactor,
  type SummaryOptions,
} from "./strategies/summary"

export { 
  SlidingWindowCompactor,
  type SlidingWindowOptions,
} from "./strategies/sliding-window"
