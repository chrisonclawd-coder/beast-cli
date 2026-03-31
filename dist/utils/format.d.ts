/**
 * Beast CLI — Formatting Utilities
 *
 * Helpers for formatting tokens, time, paths, etc.
 * Inspired by Claude Code and Gemini CLI.
 */
/**
 * Format token count for display
 */
export declare function formatTokens(tokens: number): string;
/**
 * Format time for display (relative or absolute)
 */
export declare function formatTime(date: Date | number, style?: "relative" | "time" | "datetime"): string;
/**
 * Format file path for display (truncate middle)
 */
export declare function formatPath(path: string, maxLength?: number): string;
/**
 * Format bytes for display
 */
export declare function formatBytes(bytes: number): string;
/**
 * Format duration in milliseconds to human-readable
 */
export declare function formatDuration(ms: number): string;
/**
 * Format a number with commas
 */
export declare function formatNumber(n: number): string;
/**
 * Format a percentage
 */
export declare function formatPercent(value: number, total: number): string;
/**
 * Truncate string with ellipsis
 */
export declare function truncate(str: string, maxLength: number): string;
/**
 * Pad string to fixed width
 */
export declare function pad(str: string, width: number, align?: "left" | "right" | "center"): string;
