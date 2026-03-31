/**
 * Beast CLI — Hooks Types
 *
 * Types for the hooks system.
 */
export type HookEvent = "beforeToolCall" | "afterToolCall" | "beforeFileWrite" | "afterFileWrite" | "beforeBash" | "afterBash" | "onSessionStart" | "onSessionEnd" | "onCompaction" | "onError";
export interface Hook {
    event: HookEvent;
    command: string;
    condition?: string;
    timeout?: number;
}
export interface HookContext {
    event: HookEvent;
    tool?: string;
    params?: Record<string, unknown>;
    result?: unknown;
    session?: string;
    timestamp: number;
}
