/**
 * Beast CLI — Timer Utility
 *
 * Simple timer for measuring elapsed time.
 * Inspired by Claude Code and Gemini CLI.
 */
/**
 * Timer class for measuring elapsed time
 */
export declare class Timer {
    private startTime;
    private endTime;
    private _paused;
    private _pausedAt;
    private _totalPaused;
    constructor();
    /**
     * Get elapsed time in milliseconds
     */
    elapsed(): number;
    /**
     * Stop the timer and return elapsed time
     */
    stop(): number;
    /**
     * Reset the timer
     */
    reset(): void;
    /**
     * Pause the timer
     */
    pause(): void;
    /**
     * Resume the timer
     */
    resume(): void;
    /**
     * Check if timer is paused
     */
    isPaused(): boolean;
    /**
     * Check if timer is stopped
     */
    isStopped(): boolean;
    /**
     * Get start time
     */
    getStartTime(): number;
    /**
     * Format elapsed time as human-readable string
     */
    format(): string;
}
/**
 * Time a synchronous function
 */
export declare function timed<T>(fn: () => T): {
    result: T;
    elapsed: number;
};
/**
 * Time an async function
 */
export declare function timeAsync<T>(fn: () => Promise<T>): Promise<{
    result: T;
    elapsed: number;
}>;
/**
 * Create a timeout promise
 */
export declare function timeout<T>(ms: number, value?: T): Promise<T>;
/**
 * Create a deferred promise (like jQuery.Deferred)
 */
export declare function deferred<T = void>(): {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
};
/**
 * Sleep for a given number of milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
