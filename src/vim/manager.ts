/**
 * Beast CLI — Vim Mode Manager
 * 
 * Manages vim-like modal editing.
 * Inspired by OpenCode's vim mode.
 */

import { createLogger } from "../utils"

const logger = createLogger({ prefix: "vim" })

export type VimMode = "normal" | "insert" | "visual" | "command"

export interface VimState {
  mode: VimMode
  cursorPosition: number
  visualStart?: number
  commandBuffer: string
  searchQuery?: string
  lastSearchDirection?: "forward" | "backward"
  register: string
  recordingMacro: boolean
  macroBuffer: string[]
}

export interface KeyBinding {
  key: string
  mode: VimMode | VimMode[]
  action: string
  description?: string
}

export interface VimConfig {
  enabled: boolean
  defaultMode: VimMode
  showModeIndicator: boolean
  hjklNavigation: boolean
  escapeToNormal: boolean
}

const DEFAULT_CONFIG: VimConfig = {
  enabled: true,
  defaultMode: "normal",
  showModeIndicator: true,
  hjklNavigation: true,
  escapeToNormal: true,
}

const DEFAULT_STATE: VimState = {
  mode: "normal",
  cursorPosition: 0,
  commandBuffer: "",
  register: "",
  recordingMacro: false,
  macroBuffer: [],
}

/**
 * Vim Mode Manager
 */
export class VimModeManager {
  private state: VimState
  private config: VimConfig
  private bindings: Map<string, KeyBinding>
  private modeHistory: VimMode[] = []

  constructor(config: Partial<VimConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.state = { ...DEFAULT_STATE }
    this.bindings = new Map()
    
    this.setupDefaultBindings()
  }

  /**
   * Set up default vim keybindings
   */
  private setupDefaultBindings(): void {
    // Normal mode bindings
    this.registerBinding({
      key: "i",
      mode: "normal",
      action: "enterInsert",
      description: "Enter insert mode",
    })
    
    this.registerBinding({
      key: "a",
      mode: "normal",
      action: "append",
      description: "Append after cursor",
    })
    
    this.registerBinding({
      key: "A",
      mode: "normal",
      action: "appendEnd",
      description: "Append at end of line",
    })
    
    this.registerBinding({
      key: "o",
      mode: "normal",
      action: "openBelow",
      description: "Open line below",
    })
    
    this.registerBinding({
      key: "O",
      mode: "normal",
      action: "openAbove",
      description: "Open line above",
    })
    
    this.registerBinding({
      key: "dd",
      mode: "normal",
      action: "deleteLine",
      description: "Delete current line",
    })
    
    this.registerBinding({
      key: "yy",
      mode: "normal",
      action: "yankLine",
      description: "Yank current line",
    })
    
    this.registerBinding({
      key: "p",
      mode: "normal",
      action: "paste",
      description: "Paste after cursor",
    })
    
    this.registerBinding({
      key: "P",
      mode: "normal",
      action: "pasteBefore",
      description: "Paste before cursor",
    })
    
    this.registerBinding({
      key: "u",
      mode: "normal",
      action: "undo",
      description: "Undo",
    })
    
    this.registerBinding({
      key: "/",
      mode: "normal",
      action: "searchForward",
      description: "Search forward",
    })
    
    this.registerBinding({
      key: "?",
      mode: "normal",
      action: "searchBackward",
      description: "Search backward",
    })
    
    this.registerBinding({
      key: "n",
      mode: "normal",
      action: "nextMatch",
      description: "Next search match",
    })
    
    this.registerBinding({
      key: "N",
      mode: "normal",
      action: "prevMatch",
      description: "Previous search match",
    })
    
    this.registerBinding({
      key: "v",
      mode: "normal",
      action: "enterVisual",
      description: "Enter visual mode",
    })
    
    this.registerBinding({
      key: ":",
      mode: "normal",
      action: "enterCommand",
      description: "Enter command mode",
    })
    
    // HJKL navigation
    if (this.config.hjklNavigation) {
      this.registerBinding({ key: "h", mode: "normal", action: "moveLeft" })
      this.registerBinding({ key: "j", mode: "normal", action: "moveDown" })
      this.registerBinding({ key: "k", mode: "normal", action: "moveUp" })
      this.registerBinding({ key: "l", mode: "normal", action: "moveRight" })
      
      // Visual mode navigation too
      this.registerBinding({ key: "h", mode: "visual", action: "moveLeft" })
      this.registerBinding({ key: "j", mode: "visual", action: "moveDown" })
      this.registerBinding({ key: "k", mode: "visual", action: "moveUp" })
      this.registerBinding({ key: "l", mode: "visual", action: "moveRight" })
    }
    
    // Escape to normal mode
    if (this.config.escapeToNormal) {
      this.registerBinding({ key: "escape", mode: ["insert", "visual", "command"], action: "enterNormal" })
    }
  }

  /**
   * Register a keybinding
   */
  registerBinding(binding: KeyBinding): void {
    const modes = Array.isArray(binding.mode) ? binding.mode : [binding.mode]
    for (const mode of modes) {
      const key = `${mode}:${binding.key}`
      this.bindings.set(key, binding)
    }
  }

  /**
   * Handle a keypress
   */
  handleKey(key: string): { action: string; handled: boolean } {
    const { mode } = this.state
    const keyWithMode = `${mode}:${key}`
    
    const binding = this.bindings.get(keyWithMode)
    
    if (binding) {
      logger.debug(`Key "${key}" in ${mode} mode → ${binding.action}`)
      return { action: binding.action, handled: true }
    }
    
    // Check for multi-key sequences in command buffer
    const bufferKey = `${mode}:${this.state.commandBuffer}${key}`
    const bufferedBinding = this.bindings.get(bufferKey)
    
    if (bufferedBinding) {
      this.state.commandBuffer = ""
      logger.debug(`Key sequence "${bufferKey}" → ${bufferedBinding.action}`)
      return { action: bufferedBinding.action, handled: true }
    }
    
    // Accumulate command buffer for multi-key sequences
    if (this.state.commandBuffer.length > 0) {
      // Check if any binding starts with this sequence
      let hasPartial = false
      for (const [bindingKey] of this.bindings) {
        if (bindingKey.startsWith(bufferKey)) {
          hasPartial = true
          break
        }
      }
      
      if (hasPartial) {
        this.state.commandBuffer += key
        return { action: "accumulate", handled: true }
      }
      
      // No match, clear buffer
      this.state.commandBuffer = ""
    }
    
    // Start new command buffer for keys like 'd', 'y', etc.
    if (mode === "normal" && (key === "d" || key === "y" || key === "c")) {
      this.state.commandBuffer = key
      return { action: "accumulate", handled: true }
    }
    
    return { action: "noop", handled: false }
  }

  /**
   * Switch to a different mode
   */
  setMode(mode: VimMode): void {
    if (this.state.mode !== mode) {
      this.modeHistory.push(this.state.mode)
      this.state.mode = mode
      this.state.commandBuffer = ""
      logger.debug(`Mode changed: ${mode}`)
    }
  }

  /**
   * Get current mode
   */
  getMode(): VimMode {
    return this.state.mode
  }

  /**
   * Get current state
   */
  getState(): VimState {
    return { ...this.state }
  }

  /**
   * Update state
   */
  updateState(updates: Partial<VimState>): void {
    this.state = { ...this.state, ...updates }
  }

  /**
   * Get mode indicator string
   */
  getModeIndicator(): string {
    if (!this.config.showModeIndicator) return ""
    
    const indicators: Record<VimMode, string> = {
      normal: "NORMAL",
      insert: "INSERT",
      visual: "VISUAL",
      command: "COMMAND",
    }
    
    return indicators[this.state.mode]
  }

  /**
   * Get config
   */
  getConfig(): VimConfig {
    return { ...this.config }
  }

  /**
   * Update config
   */
  updateConfig(updates: Partial<VimConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * Reset to default state
   */
  reset(): void {
    this.state = { ...DEFAULT_STATE, mode: this.config.defaultMode }
    this.modeHistory = []
  }

  /**
   * Go to previous mode
   */
  previousMode(): void {
    if (this.modeHistory.length > 0) {
      const prev = this.modeHistory.pop()
      if (prev) {
        this.state.mode = prev
      }
    }
  }
}
