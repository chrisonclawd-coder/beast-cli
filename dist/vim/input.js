/**
 * Beast CLI — Vim Input Handler
 *
 * Handles input processing for vim mode.
 */
import { createLogger } from "../utils";
const logger = createLogger({ prefix: "vim:input" });
/**
 * Vim Input Handler
 *
 * Processes keyboard input and maps to vim actions.
 */
export class VimInputHandler {
    vimManager;
    actionHandlers;
    constructor(vimManager) {
        this.vimManager = vimManager;
        this.actionHandlers = new Map();
        this.setupDefaultHandlers();
    }
    /**
     * Set up default action handlers
     */
    setupDefaultHandlers() {
        // Mode switching
        this.registerHandler("enterInsert", () => {
            this.vimManager.setMode("insert");
        });
        this.registerHandler("enterNormal", () => {
            this.vimManager.setMode("normal");
        });
        this.registerHandler("enterVisual", () => {
            const state = this.vimManager.getState();
            this.vimManager.updateState({
                visualStart: state.cursorPosition,
            });
            this.vimManager.setMode("visual");
        });
        this.registerHandler("enterCommand", () => {
            this.vimManager.setMode("command");
        });
        // Cursor movement
        this.registerHandler("moveLeft", () => {
            const state = this.vimManager.getState();
            this.vimManager.updateState({
                cursorPosition: Math.max(0, state.cursorPosition - 1),
            });
        });
        this.registerHandler("moveRight", () => {
            const state = this.vimManager.getState();
            this.vimManager.updateState({
                cursorPosition: state.cursorPosition + 1,
            });
        });
        this.registerHandler("moveUp", () => {
            // Handled by TUI layer
        });
        this.registerHandler("moveDown", () => {
            // Handled by TUI layer
        });
        // Search
        this.registerHandler("searchForward", () => {
            this.vimManager.updateState({
                searchQuery: "",
                lastSearchDirection: "forward",
            });
        });
        this.registerHandler("searchBackward", () => {
            this.vimManager.updateState({
                searchQuery: "",
                lastSearchDirection: "backward",
            });
        });
        // Edit operations (handled by TUI layer)
        this.registerHandler("deleteLine", () => { });
        this.registerHandler("yankLine", () => { });
        this.registerHandler("paste", () => { });
        this.registerHandler("pasteBefore", () => { });
        this.registerHandler("undo", () => { });
        this.registerHandler("append", () => {
            const state = this.vimManager.getState();
            this.vimManager.updateState({
                cursorPosition: state.cursorPosition + 1,
            });
            this.vimManager.setMode("insert");
        });
        this.registerHandler("appendEnd", () => {
            this.vimManager.setMode("insert");
        });
        this.registerHandler("openBelow", () => {
            this.vimManager.setMode("insert");
        });
        this.registerHandler("openAbove", () => {
            this.vimManager.setMode("insert");
        });
    }
    /**
     * Register an action handler
     */
    registerHandler(action, handler) {
        this.actionHandlers.set(action, handler);
    }
    /**
     * Handle input
     */
    handleInput(input, key) {
        const mode = this.vimManager.getMode();
        // In insert mode, pass through to TUI
        if (mode === "insert") {
            // Check for escape
            if (key.name === "escape") {
                const { action } = this.vimManager.handleKey("escape");
                this.executeAction(action);
                return true;
            }
            return false; // Let TUI handle it
        }
        // Get key name
        let keyName = key.name || input;
        // Normalize key names
        if (keyName === "\x1b" || keyName === "\u001b") {
            keyName = "escape";
        }
        // Handle the key
        const { action, handled } = this.vimManager.handleKey(keyName);
        if (handled) {
            this.executeAction(action);
            return true;
        }
        return false;
    }
    /**
     * Execute an action
     */
    executeAction(action) {
        const handler = this.actionHandlers.get(action);
        if (handler) {
            handler();
        }
        else {
            logger.debug(`No handler for action: ${action}`);
        }
    }
    /**
     * Get vim manager
     */
    getVimManager() {
        return this.vimManager;
    }
}
//# sourceMappingURL=input.js.map