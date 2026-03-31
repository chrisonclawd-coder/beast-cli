/**
 * Beast CLI — Logger
 *
 * Structured logging with levels and colors.
 * Inspired by all major CLI tools.
 */
export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    SILENT = 4
}
interface LoggerConfig {
    level: LogLevel;
    prefix?: string;
    colorize: boolean;
    timestamp: boolean;
}
export declare class Logger {
    private config;
    constructor(config?: Partial<LoggerConfig>);
    private formatMessage;
    private shouldLog;
    setLevel(level: LogLevel): void;
    debug(...args: unknown[]): void;
    info(...args: unknown[]): void;
    warn(...args: unknown[]): void;
    error(...args: unknown[]): void;
    log(...args: unknown[]): void;
    child(prefix: string): Logger;
    success(...args: unknown[]): void;
    fail(...args: unknown[]): void;
    group(label: string): void;
    groupEnd(): void;
}
export declare const logger: Logger;
export declare function createLogger(config?: Partial<LoggerConfig>): Logger;
export {};
