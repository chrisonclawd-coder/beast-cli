/**
 * Beast CLI — Vim Mode Manager
 *
 * Manages vim-like modal editing.
 * Inspired by OpenCode's vim mode.
 */
export type VimMode = "normal" | "insert" | "visual" | "command";
export interface VimState {
    mode: VimMode;
    cursorPosition: number;
    visualStart?: number;
    commandBuffer: string;
    searchQuery?: string;
    lastSearchDirection?: "forward" | "backward";
    register: string;
    recordingMacro: boolean;
    macroBuffer: string[];
}
export interface KeyBinding {
    key: string;
    mode: VimMode | VimMode[];
    action: string;
    description?: string;
}
export interface VimConfig {
    enabled: boolean;
    defaultMode: VimMode;
    showModeIndicator: boolean;
    hjklNavigation: boolean;
    escapeToNormal: boolean;
}
/**
 * Vim Mode Manager
 */
export declare class VimModeManager {
    private state;
    private config;
    private bindings;
    private modeHistory;
    constructor(config?: Partial<VimConfig>);
    /**
     * Set up default vim keybindings
     */
    private setupDefaultBindings;
    /**
     * Register a keybinding
     */
    registerBinding(binding: KeyBinding): void;
    /**
     * Handle a keypress
     */
    handleKey(key: string): {
        action: string;
        handled: boolean;
    };
    /**
     * Switch to a different mode
     */
    setMode(mode: VimMode): void;
    /**
     * Get current mode
     */
    getMode(): VimMode;
    /**
     * Get current state
     */
    getState(): VimState;
    /**
     * Update state
     */
    updateState(updates: Partial<VimState>): void;
    /**
     * Get mode indicator string
     */
    getModeIndicator(): string;
    /**
     * Get config
     */
    getConfig(): VimConfig;
    /**
     * Update config
     */
    updateConfig(updates: Partial<VimConfig>): void;
    /**
     * Reset to default state
     */
    reset(): void;
    /**
     * Go to previous mode
     */
    previousMode(): void;
}
