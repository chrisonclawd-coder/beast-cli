/**
 * Beast CLI — Safe JSON Utilities
 *
 * Safe parsing and stringifying with error handling.
 * Inspired by all major CLI tools.
 */
/**
 * Result type for safe operations
 */
export type SafeResult<T> = {
    ok: true;
    value: T;
} | {
    ok: false;
    error: Error;
};
/**
 * Safely parse JSON string
 */
export declare function safeJsonParse<T = unknown>(json: string): SafeResult<T>;
/**
 * Safely stringify value to JSON
 */
export declare function safeJsonStringify(value: unknown, replacer?: (key: string, value: unknown) => unknown, space?: string | number): SafeResult<string>;
/**
 * Try to parse JSON, return default on failure
 */
export declare function tryJsonParse<T>(json: string, defaultValue: T): T;
/**
 * Try to stringify, return fallback on failure
 */
export declare function tryJsonStringify(value: unknown, fallback?: string, space?: string | number): string;
/**
 * Check if a string is valid JSON
 */
export declare function isValidJson(json: string): boolean;
/**
 * Deep clone using JSON
 */
export declare function deepClone<T>(value: T): T;
/**
 * Safe JSON stringify that handles circular references
 */
export declare function stringifySafe(value: unknown, space?: string | number): string;
/**
 * Pretty print JSON
 */
export declare function prettyPrint(value: unknown, indent?: number): string;
/**
 * Parse JSON with reviver
 */
export declare function parseWithReviver<T = unknown>(json: string, reviver: (key: string, value: unknown) => unknown): SafeResult<T>;
