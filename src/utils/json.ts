/**
 * Beast CLI — Safe JSON Utilities
 * 
 * Safe parsing and stringifying with error handling.
 * Inspired by all major CLI tools.
 */

/**
 * Result type for safe operations
 */
export type SafeResult<T> = 
  | { ok: true; value: T }
  | { ok: false; error: Error }

/**
 * Safely parse JSON string
 */
export function safeJsonParse<T = unknown>(json: string): SafeResult<T> {
  try {
    const value = JSON.parse(json) as T
    return { ok: true, value }
  } catch (error) {
    return { 
      ok: false, 
      error: error instanceof Error ? error : new Error(String(error))
    }
  }
}

/**
 * Safely stringify value to JSON
 */
export function safeJsonStringify(
  value: unknown,
  replacer?: (key: string, value: unknown) => unknown,
  space?: string | number
): SafeResult<string> {
  try {
    const json = JSON.stringify(value, replacer as (key: string, value: unknown) => unknown, space)
    return { ok: true, value: json }
  } catch (error) {
    return { 
      ok: false, 
      error: error instanceof Error ? error : new Error(String(error))
    }
  }
}

/**
 * Try to parse JSON, return default on failure
 */
export function tryJsonParse<T>(json: string, defaultValue: T): T {
  const result = safeJsonParse<T>(json)
  return result.ok ? result.value : defaultValue
}

/**
 * Try to stringify, return fallback on failure
 */
export function tryJsonStringify(
  value: unknown,
  fallback: string = "{}",
  space?: string | number
): string {
  const result = safeJsonStringify(value, undefined, space)
  return result.ok ? result.value : fallback
}

/**
 * Check if a string is valid JSON
 */
export function isValidJson(json: string): boolean {
  try {
    JSON.parse(json)
    return true
  } catch {
    return false
  }
}

/**
 * Deep clone using JSON
 */
export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/**
 * Safe JSON stringify that handles circular references
 */
export function stringifySafe(
  value: unknown,
  space?: string | number
): string {
  const seen = new WeakSet()
  
  const replacer = (key: string, val: unknown): unknown => {
    if (typeof val === "object" && val !== null) {
      if (seen.has(val)) {
        return "[Circular]"
      }
      seen.add(val)
    }
    return val
  }
  
  return JSON.stringify(value, replacer, space)
}

/**
 * Pretty print JSON
 */
export function prettyPrint(value: unknown, indent: number = 2): string {
  return JSON.stringify(value, null, indent)
}

/**
 * Parse JSON with reviver
 */
export function parseWithReviver<T = unknown>(
  json: string,
  reviver: (key: string, value: unknown) => unknown
): SafeResult<T> {
  try {
    const value = JSON.parse(json, reviver) as T
    return { ok: true, value }
  } catch (error) {
    return { 
      ok: false, 
      error: error instanceof Error ? error : new Error(String(error))
    }
  }
}
