/**
 * Beast CLI — Utils Module
 * 
 * Common utilities used across the codebase.
 * Inspired by Claude Code, Gemini CLI, and OpenCode.
 */

export { Logger, LogLevel, createLogger, logger } from "./logger"
export { formatTokens, formatTime, formatPath, formatBytes, formatDuration } from "./format"
export { Timer, timed, timeAsync } from "./timer"
export { safeJsonParse, safeJsonStringify, tryJsonParse } from "./json"
