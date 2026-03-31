/**
 * Beast CLI — Formatting Utilities
 *
 * Helpers for formatting tokens, time, paths, etc.
 * Inspired by Claude Code and Gemini CLI.
 */
/**
 * Format token count for display
 */
export function formatTokens(tokens) {
    if (tokens < 1000) {
        return tokens.toString();
    }
    else if (tokens < 1_000_000) {
        return `${(tokens / 1000).toFixed(1)}K`;
    }
    else {
        return `${(tokens / 1_000_000).toFixed(2)}M`;
    }
}
/**
 * Format time for display (relative or absolute)
 */
export function formatTime(date, style = "time") {
    const d = typeof date === "number" ? new Date(date) : date;
    if (style === "relative") {
        const now = Date.now();
        const diff = now - d.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (seconds < 60)
            return "just now";
        if (minutes < 60)
            return `${minutes}m ago`;
        if (hours < 24)
            return `${hours}h ago`;
        if (days < 7)
            return `${days}d ago`;
        return d.toLocaleDateString();
    }
    if (style === "time") {
        return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleString();
}
/**
 * Format file path for display (truncate middle)
 */
export function formatPath(path, maxLength = 50) {
    if (path.length <= maxLength)
        return path;
    // Try to keep the filename and show partial path
    const parts = path.split("/");
    const filename = parts[parts.length - 1];
    if (filename.length >= maxLength - 3) {
        return "..." + filename.slice(-(maxLength - 3));
    }
    const remaining = maxLength - filename.length - 4; // 4 for ".../"
    const start = path.slice(0, Math.floor(remaining / 2));
    const end = path.slice(-Math.ceil(remaining / 2) - filename.length - 1);
    return `${start}.../${filename}`;
}
/**
 * Format bytes for display
 */
export function formatBytes(bytes) {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let unitIndex = 0;
    let value = bytes;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex++;
    }
    return `${value.toFixed(1)} ${units[unitIndex]}`;
}
/**
 * Format duration in milliseconds to human-readable
 */
export function formatDuration(ms) {
    if (ms < 1000)
        return `${ms}ms`;
    if (ms < 60000)
        return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) {
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
    }
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
}
/**
 * Format a number with commas
 */
export function formatNumber(n) {
    return n.toLocaleString();
}
/**
 * Format a percentage
 */
export function formatPercent(value, total) {
    if (total === 0)
        return "0%";
    return `${((value / total) * 100).toFixed(1)}%`;
}
/**
 * Truncate string with ellipsis
 */
export function truncate(str, maxLength) {
    if (str.length <= maxLength)
        return str;
    return str.slice(0, maxLength - 3) + "...";
}
/**
 * Pad string to fixed width
 */
export function pad(str, width, align = "left") {
    if (str.length >= width)
        return str;
    if (align === "right") {
        return str.padStart(width);
    }
    else if (align === "center") {
        const left = Math.floor((width - str.length) / 2);
        return " ".repeat(left) + str + " ".repeat(width - str.length - left);
    }
    return str.padEnd(width);
}
//# sourceMappingURL=format.js.map