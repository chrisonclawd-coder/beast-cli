/**
 * Beast CLI — Timer Utility
 *
 * Simple timer for measuring elapsed time.
 * Inspired by Claude Code and Gemini CLI.
 */
/**
 * Timer class for measuring elapsed time
 */
export class Timer {
    startTime;
    endTime = null;
    _paused = false;
    _pausedAt = 0;
    _totalPaused = 0;
    constructor() {
        this.startTime = Date.now();
    }
    /**
     * Get elapsed time in milliseconds
     */
    elapsed() {
        if (this._paused) {
            return this._pausedAt - this.startTime - this._totalPaused;
        }
        if (this.endTime !== null) {
            return this.endTime - this.startTime - this._totalPaused;
        }
        return Date.now() - this.startTime - this._totalPaused;
    }
    /**
     * Stop the timer and return elapsed time
     */
    stop() {
        if (this.endTime === null) {
            this.endTime = Date.now();
        }
        return this.elapsed();
    }
    /**
     * Reset the timer
     */
    reset() {
        this.startTime = Date.now();
        this.endTime = null;
        this._paused = false;
        this._pausedAt = 0;
        this._totalPaused = 0;
    }
    /**
     * Pause the timer
     */
    pause() {
        if (!this._paused && this.endTime === null) {
            this._paused = true;
            this._pausedAt = Date.now();
        }
    }
    /**
     * Resume the timer
     */
    resume() {
        if (this._paused) {
            this._totalPaused += Date.now() - this._pausedAt;
            this._paused = false;
            this._pausedAt = 0;
        }
    }
    /**
     * Check if timer is paused
     */
    isPaused() {
        return this._paused;
    }
    /**
     * Check if timer is stopped
     */
    isStopped() {
        return this.endTime !== null;
    }
    /**
     * Get start time
     */
    getStartTime() {
        return this.startTime;
    }
    /**
     * Format elapsed time as human-readable string
     */
    format() {
        const ms = this.elapsed();
        if (ms < 1000) {
            return `${ms}ms`;
        }
        else if (ms < 60000) {
            return `${(ms / 1000).toFixed(2)}s`;
        }
        else {
            const minutes = Math.floor(ms / 60000);
            const seconds = Math.floor((ms % 60000) / 1000);
            return `${minutes}m ${seconds}s`;
        }
    }
}
/**
 * Time a synchronous function
 */
export function timed(fn) {
    const timer = new Timer();
    const result = fn();
    return { result, elapsed: timer.stop() };
}
/**
 * Time an async function
 */
export async function timeAsync(fn) {
    const timer = new Timer();
    const result = await fn();
    return { result, elapsed: timer.stop() };
}
/**
 * Create a timeout promise
 */
export function timeout(ms, value) {
    return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
/**
 * Create a deferred promise (like jQuery.Deferred)
 */
export function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}
/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=timer.js.map