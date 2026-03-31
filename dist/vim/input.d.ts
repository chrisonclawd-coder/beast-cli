/**
 * Beast CLI — Vim Input Handler
 *
 * Handles input processing for vim mode.
 */
import { VimModeManager } from "./manager";
export interface InputHandler {
    handleInput(input: string, key: {
        name?: string;
        ctrl?: boolean;
        meta?: boolean;
        shift?: boolean;
    }): boolean;
}
/**
 * Vim Input Handler
 *
 * Processes keyboard input and maps to vim actions.
 */
export declare class VimInputHandler implements InputHandler {
    private vimManager;
    private actionHandlers;
    constructor(vimManager: VimModeManager);
    /**
     * Set up default action handlers
     */
    private setupDefaultHandlers;
    /**
     * Register an action handler
     */
    registerHandler(action: string, handler: () => void): void;
    /**
     * Handle input
     */
    handleInput(input: string, key: {
        name?: string;
        ctrl?: boolean;
        meta?: boolean;
        shift?: boolean;
    }): boolean;
    /**
     * Execute an action
     */
    private executeAction;
    /**
     * Get vim manager
     */
    getVimManager(): VimModeManager;
}
