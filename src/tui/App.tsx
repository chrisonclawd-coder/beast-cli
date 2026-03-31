/**
 * Beast CLI — Main TUI App
 * 
 * The main Ink application for Beast CLI.
 */

import React, { useState, useEffect, useCallback } from "react"
import { Box, Text, useApp, useInput } from "ink"
import Spinner from "ink-spinner"
import { ChatView } from "./components/ChatView"
import { InputBar } from "./components/InputBar"
import type { ChatMessage, TUIConfig, TUIState } from "./types"
import type { Message, ResponseChunk, Provider } from "../providers/types"
import type { Tool } from "../tools/types"

interface BeastAppProps {
  provider: Provider
  model: string
  tools: Tool[]
  systemPrompt?: string
  config: TUIConfig
  onExit?: () => void
}

export function BeastApp({ 
  provider, 
  model, 
  tools, 
  systemPrompt, 
  config,
  onExit 
}: BeastAppProps) {
  const { exit } = useApp()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [state, setState] = useState<TUIState>("idle")
  const [tokenUsage, setTokenUsage] = useState({ input: 0, output: 0 })
  const [error, setError] = useState<string | null>(null)
  const [currentTool, setCurrentTool] = useState<string | null>(null)

  // Generate unique message IDs
  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  // Handle user input submission
  const handleSubmit = useCallback(async (input: string) => {
    if (state !== "idle") return

    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setState("thinking")
    setError(null)

    try {
      // Build conversation history
      const conversation: Message[] = [
        ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
        ...messages.map(m => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
        { role: "user" as const, content: input },
      ]

      // Create assistant message placeholder
      const assistantId = generateId()
      setMessages(prev => [...prev, {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        streaming: true,
      }])

      setState("streaming")

      // Stream response
      let fullContent = ""
      for await (const chunk of provider.stream(conversation, {
        model,
        tools: tools.map(t => ({
          name: t.name,
          description: t.description,
          parameters: {},
        })),
      })) {
        switch (chunk.type) {
          case "text":
            fullContent += chunk.content || ""
            setMessages(prev => prev.map(m => 
              m.id === assistantId 
                ? { ...m, content: fullContent }
                : m
            ))
            break

          case "tool_call":
            setState("tool_call")
            setCurrentTool(chunk.toolCall?.name || null)
            // Tool call handling would go here
            break

          case "done":
            if (chunk.usage) {
              setTokenUsage(prev => ({
                input: prev.input + chunk.usage!.inputTokens,
                output: prev.output + chunk.usage!.outputTokens,
              }))
              setMessages(prev => prev.map(m => 
                m.id === assistantId 
                  ? { 
                      ...m, 
                      streaming: false,
                      tokens: { 
                        input: chunk.usage!.inputTokens, 
                        output: chunk.usage!.outputTokens 
                      }
                    }
                  : m
              ))
            }
            break
        }
      }

      setState("idle")
      setCurrentTool(null)

    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      setState("idle")
      
      // Remove the failed assistant message
      setMessages(prev => prev.filter(m => !m.streaming))
    }
  }, [state, messages, provider, model, tools, systemPrompt])

  // Handle global key input
  useInput((input, key) => {
    if (key.escape && state === "idle") {
      exit()
      onExit?.()
    }
    
    if (input === "c" && key.ctrl) {
      exit()
      onExit?.()
    }
  })

  // Status bar
  const StatusBar = () => (
    <Box 
      justifyContent="space-between" 
      borderStyle="single" 
      borderColor="blue"
      padding={1}
    >
      <Box>
        <Text bold color="blue">🦁 Beast</Text>
        <Text dimColor> | {model}</Text>
      </Box>
      <Box>
        <Text dimColor>
          Tokens: {tokenUsage.input}i/{tokenUsage.output}o
        </Text>
      </Box>
    </Box>
  )

  // Error display
  const ErrorDisplay = () => error ? (
    <Box borderStyle="double" borderColor="red" padding={1}>
      <Text color="red">Error: {error}</Text>
    </Box>
  ) : null

  return (
    <Box flexDirection="column" height="100%">
      <StatusBar />
      
      <Box flexGrow={1} flexDirection="column" overflow="hidden">
        <ChatView 
          messages={messages} 
          config={config}
        />
        <ErrorDisplay />
      </Box>

      <InputBar
        onSubmit={handleSubmit}
        state={state}
        config={config}
        placeholder="Ask the Beast..."
      />
    </Box>
  )
}
