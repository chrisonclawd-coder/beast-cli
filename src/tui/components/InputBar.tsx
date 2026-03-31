/**
 * Beast CLI — Input Component
 * 
 * Handles user input with vim mode support.
 */

import React, { useState, useCallback } from "react"
import { Box, Text } from "ink"
import TextInput from "ink-text-input"
import type { TUIState, TUIConfig } from "../types"

interface InputBarProps {
  onSubmit: (input: string) => void
  state: TUIState
  config: TUIConfig
  placeholder?: string
}

export function InputBar({ onSubmit, state, config, placeholder }: InputBarProps) {
  const [input, setInput] = useState("")
  const [vimMode, setVimMode] = useState<"normal" | "insert">(
    config.vimMode ? "normal" : "insert"
  )
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const handleSubmit = useCallback((value: string) => {
    if (!value.trim()) return
    
    // Add to history
    setHistory(prev => [...prev, value])
    setHistoryIndex(-1)
    
    onSubmit(value)
    setInput("")
  }, [onSubmit])

  const handleVimKey = useCallback((key: string) => {
    if (!config.vimMode) return false
    
    switch (key) {
      case "escape":
        if (vimMode === "insert") {
          setVimMode("normal")
          return true
        }
        break
      case "i":
        if (vimMode === "normal") {
          setVimMode("insert")
          return true
        }
        break
      case "k":
        if (vimMode === "normal" && history.length > 0) {
          const newIndex = Math.min(historyIndex + 1, history.length - 1)
          setHistoryIndex(newIndex)
          setInput(history[history.length - 1 - newIndex] || "")
          return true
        }
        break
      case "j":
        if (vimMode === "normal" && historyIndex > 0) {
          const newIndex = historyIndex - 1
          setHistoryIndex(newIndex)
          setInput(history[history.length - 1 - newIndex] || "")
          return true
        }
        break
    }
    return false
  }, [config.vimMode, vimMode, history, historyIndex])

  const getStatusIndicator = () => {
    switch (state) {
      case "thinking":
        return <Text color="yellow">● Thinking...</Text>
      case "streaming":
        return <Text color="cyan">● Streaming...</Text>
      case "tool_call":
        return <Text color="blue">● Running tool...</Text>
      case "waiting_input":
        return <Text color="magenta">● Waiting for input...</Text>
      default:
        return null
    }
  }

  const isDisabled = state === "thinking" || state === "tool_call"
  const showInput = vimMode === "insert" || !config.vimMode

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="gray" padding={1}>
      {/* Status bar */}
      <Box justifyContent="space-between">
        {getStatusIndicator()}
        {config.vimMode && (
          <Box>
            <Text dimColor>-- </Text>
            <Text color={vimMode === "insert" ? "green" : "blue"}>
              {vimMode.toUpperCase()}
            </Text>
            <Text dimColor> --</Text>
          </Box>
        )}
      </Box>

      {/* Input area */}
      <Box marginTop={1}>
        <Text bold color="green">❯ </Text>
        {showInput ? (
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder={isDisabled ? "Waiting..." : (placeholder || "Type your message...")}
            showCursor={!isDisabled}
          />
        ) : (
          <Text dimColor>-- Press 'i' to insert, 'k/j' for history --</Text>
        )}
      </Box>

      {/* Help text */}
      {state === "idle" && (
        <Box marginTop={1}>
          <Text dimColor>
            {config.vimMode 
              ? "[i]nsert [Esc]normal [k/j]history" 
              : "Enter to send, Ctrl+C to exit"}
          </Text>
        </Box>
      )}
    </Box>
  )
}
