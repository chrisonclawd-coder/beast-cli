/**
 * Beast CLI — Safe JSON Utilities
 *
 * Safe parsing and stringifying with error handling.
 * Inspired by all major CLI tools.
 */
/**
 * Safely parse JSON string
 */
export function safeJsonParse(json) {
    try {
        const value = JSON.parse(json);
        return { ok: true, value };
    }
    catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error : new Error(String(error))
        };
    }
}
/**
 * Safely stringify value to JSON
 */
export function safeJsonStringify(value, replacer, space) {
    try {
        const json = JSON.stringify(value, replacer, space);
        return { ok: true, value: json };
    }
    catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error : new Error(String(error))
        };
    }
}
/**
 * Try to parse JSON, return default on failure
 */
export function tryJsonParse(json, defaultValue) {
    const result = safeJsonParse(json);
    return result.ok ? result.value : defaultValue;
}
/**
 * Try to stringify, return fallback on failure
 */
export function tryJsonStringify(value, fallback = "{}", space) {
    const result = safeJsonStringify(value, undefined, space);
    return result.ok ? result.value : fallback;
}
/**
 * Check if a string is valid JSON
 */
export function isValidJson(json) {
    try {
        JSON.parse(json);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Deep clone using JSON
 */
export function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}
/**
 * Safe JSON stringify that handles circular references
 */
export function stringifySafe(value, space) {
    const seen = new WeakSet();
    const replacer = (key, val) => {
        if (typeof val === "object" && val !== null) {
            if (seen.has(val)) {
                return "[Circular]";
            }
            seen.add(val);
        }
        return val;
    };
    return JSON.stringify(value, replacer, space);
}
/**
 * Pretty print JSON
 */
export function prettyPrint(value, indent = 2) {
    return JSON.stringify(value, null, indent);
}
/**
 * Parse JSON with reviver
 */
export function parseWithReviver(json, reviver) {
    try {
        const value = JSON.parse(json, reviver);
        return { ok: true, value };
    }
    catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error : new Error(String(error))
        };
    }
}
//# sourceMappingURL=json.js.map