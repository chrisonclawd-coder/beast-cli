/**
 * Beast CLI — Logger
 *
 * Structured logging with levels and colors.
 * Inspired by all major CLI tools.
 */
import * as util from "util";
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["SILENT"] = 4] = "SILENT";
})(LogLevel || (LogLevel = {}));
// ANSI color codes
const colors = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    bgBlack: "\x1b[40m",
    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgBlue: "\x1b[44m",
    bgMagenta: "\x1b[45m",
    bgCyan: "\x1b[46m",
    bgWhite: "\x1b[47m",
};
const levelColors = {
    [LogLevel.DEBUG]: colors.dim,
    [LogLevel.INFO]: colors.blue,
    [LogLevel.WARN]: colors.yellow,
    [LogLevel.ERROR]: colors.red,
    [LogLevel.SILENT]: "",
};
const levelLabels = {
    [LogLevel.DEBUG]: "DEBUG",
    [LogLevel.INFO]: "INFO",
    [LogLevel.WARN]: "WARN",
    [LogLevel.ERROR]: "ERROR",
    [LogLevel.SILENT]: "",
};
export class Logger {
    config;
    constructor(config = {}) {
        this.config = {
            level: config.level ?? LogLevel.INFO,
            prefix: config.prefix,
            colorize: config.colorize ?? true,
            timestamp: config.timestamp ?? false,
        };
    }
    formatMessage(level, ...args) {
        const parts = [];
        // Timestamp
        if (this.config.timestamp) {
            const ts = new Date().toISOString();
            parts.push(this.config.colorize ? `${colors.dim}${ts}${colors.reset}` : ts);
        }
        // Level
        const label = levelLabels[level];
        if (label) {
            if (this.config.colorize) {
                parts.push(`${levelColors[level]}${label}${colors.reset}`);
            }
            else {
                parts.push(label);
            }
        }
        // Prefix
        if (this.config.prefix) {
            if (this.config.colorize) {
                parts.push(`${colors.cyan}${this.config.prefix}${colors.reset}`);
            }
            else {
                parts.push(this.config.prefix);
            }
        }
        // Message
        const message = args
            .map(arg => typeof arg === "string"
            ? arg
            : util.inspect(arg, { colors: this.config.colorize, depth: 4 }))
            .join(" ");
        parts.push(message);
        return parts.join(" ");
    }
    shouldLog(level) {
        return level >= this.config.level;
    }
    setLevel(level) {
        this.config.level = level;
    }
    debug(...args) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.debug(this.formatMessage(LogLevel.DEBUG, ...args));
        }
    }
    info(...args) {
        if (this.shouldLog(LogLevel.INFO)) {
            console.info(this.formatMessage(LogLevel.INFO, ...args));
        }
    }
    warn(...args) {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.formatMessage(LogLevel.WARN, ...args));
        }
    }
    error(...args) {
        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(this.formatMessage(LogLevel.ERROR, ...args));
        }
    }
    log(...args) {
        this.info(...args);
    }
    // Create a child logger with a prefix
    child(prefix) {
        return new Logger({
            ...this.config,
            prefix: this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix,
        });
    }
    // Convenience methods for common patterns
    success(...args) {
        if (this.config.colorize) {
            this.info(`${colors.green}✓${colors.reset}`, ...args);
        }
        else {
            this.info("✓", ...args);
        }
    }
    fail(...args) {
        if (this.config.colorize) {
            this.error(`${colors.red}✗${colors.reset}`, ...args);
        }
        else {
            this.error("✗", ...args);
        }
    }
    // Group logging for structured output
    group(label) {
        console.group?.(label);
    }
    groupEnd() {
        console.groupEnd?.();
    }
}
// Default logger instance
export const logger = new Logger();
// Factory function for custom loggers
export function createLogger(config = {}) {
    return new Logger(config);
}
//# sourceMappingURL=logger.js.map