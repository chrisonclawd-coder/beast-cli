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
  private startTime: number
  private endTime: number | null = null
  private _paused: boolean = false
  private _pausedAt: number = 0
  private _totalPaused: number = 0

  constructor() {
    this.startTime = Date.now()
  }

  /**
   * Get elapsed time in milliseconds
   */
  elapsed(): number {
    if (this._paused) {
      return this._pausedAt - this.startTime - this._totalPaused
    }
    
    if (this.endTime !== null) {
      return this.endTime - this.startTime - this._totalPaused
    }
    
    return Date.now() - this.startTime - this._totalPaused
  }

  /**
   * Stop the timer and return elapsed time
   */
  stop(): number {
    if (this.endTime === null) {
      this.endTime = Date.now()
    }
    return this.elapsed()
  }

  /**
   * Reset the timer
   */
  reset(): void {
    this.startTime = Date.now()
    this.endTime = null
    this._paused = false
    this._pausedAt = 0
    this._totalPaused = 0
  }

  /**
   * Pause the timer
   */
  pause(): void {
    if (!this._paused && this.endTime === null) {
      this._paused = true
      this._pausedAt = Date.now()
    }
  }

  /**
   * Resume the timer
   */
  resume(): void {
    if (this._paused) {
      this._totalPaused += Date.now() - this._pausedAt
      this._paused = false
      this._pausedAt = 0
    }
  }

  /**
   * Check if timer is paused
   */
  isPaused(): boolean {
    return this._paused
  }

  /**
   * Check if timer is stopped
   */
  isStopped(): boolean {
    return this.endTime !== null
  }

  /**
   * Get start time
   */
  getStartTime(): number {
    return this.startTime
  }

  /**
   * Format elapsed time as human-readable string
   */
  format(): string {
    const ms = this.elapsed()
    
    if (ms < 1000) {
      return `${ms}ms`
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`
    } else {
      const minutes = Math.floor(ms / 60000)
      const seconds = Math.floor((ms % 60000) / 1000)
      return `${minutes}m ${seconds}s`
    }
  }
}

/**
 * Time a synchronous function
 */
export function timed<T>(fn: () => T): { result: T; elapsed: number } {
  const timer = new Timer()
  const result = fn()
  return { result, elapsed: timer.stop() }
}

/**
 * Time an async function
 */
export async function timeAsync<T>(
  fn: () => Promise<T>
): Promise<{ result: T; elapsed: number }> {
  const timer = new Timer()
  const result = await fn()
  return { result, elapsed: timer.stop() }
}

/**
 * Create a timeout promise
 */
export function timeout<T>(ms: number, value?: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value as T), ms))
}

/**
 * Create a deferred promise (like jQuery.Deferred)
 */
export function deferred<T = void>(): {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
} {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  
  return { promise, resolve, reject }
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
