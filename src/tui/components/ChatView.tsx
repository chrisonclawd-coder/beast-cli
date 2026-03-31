/**
 * Beast CLI — Chat View Component
 * 
 * Renders the message history with streaming support.
 */

import React from "react"
import { Box, Text } from "ink"
import type { ChatMessage, TUIConfig } from "../types"

interface ChatViewProps {
  messages: ChatMessage[]
  config: TUIConfig
  maxVisible?: number
}

export function ChatView({ messages, config, maxVisible = 50 }: ChatViewProps) {
  // Show only last N messages to prevent overflow
  const visibleMessages = messages.slice(-maxVisible)

  return (
    <Box flexDirection="column" padding={1}>
      {visibleMessages.map((msg) => (
        <MessageView 
          key={msg.id} 
          message={msg} 
          config={config}
        />
      ))}
    </Box>
  )
}

interface MessageViewProps {
  message: ChatMessage
  config: TUIConfig
}

function MessageView({ message, config }: MessageViewProps) {
  const roleColor = getRoleColor(message.role)
  const roleLabel = getRoleLabel(message.role)
  const timestamp = config.showTimestamps 
    ? `[${message.timestamp.toLocaleTimeString()}] ` 
    : ""

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text bold color={roleColor}>
          {timestamp}{roleLabel}
        </Text>
        {message.tokens && config.showTokens && (
          <Text dimColor>
            {" "}({message.tokens.input}i/{message.tokens.output}o)
          </Text>
        )}
        {message.streaming && (
          <Text color="cyan"> ●</Text>
        )}
      </Box>
      
      <Box marginLeft={2} flexDirection="column">
        <ContentRenderer 
          content={message.content} 
          compact={config.compactMode}
        />
        
        {config.showToolCalls && message.toolCalls && message.toolCalls.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            {message.toolCalls.map((tc, i) => (
              <ToolCallView key={i} toolCall={tc} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  )
}

interface ContentRendererProps {
  content: string
  compact?: boolean
}

function ContentRenderer({ content, compact }: ContentRendererProps) {
  // Basic content rendering - can be enhanced with markdown support
  const lines = content.split("\n")
  const maxLines = compact ? 10 : lines.length
  const displayLines = lines.slice(0, maxLines)
  const hasMore = lines.length > maxLines

  return (
    <Box flexDirection="column">
      {displayLines.map((line, i) => (
        <Text key={i} wrap="wrap">
          {line || " "}
        </Text>
      ))}
      {hasMore && (
        <Text dimColor>
          ... ({lines.length - maxLines} more lines)
        </Text>
      )}
    </Box>
  )
}

interface ToolCallViewProps {
  toolCall: {
    tool: string
    params: Record<string, unknown>
    result?: { success: boolean; content: string }
  }
}

function ToolCallView({ toolCall }: ToolCallViewProps) {
  const statusColor = toolCall.result?.success ? "green" : 
                      toolCall.result ? "red" : "yellow"
  const statusIcon = toolCall.result?.success ? "✓" : 
                     toolCall.result ? "✗" : "○"

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={statusColor}>{statusIcon} </Text>
        <Text bold>{toolCall.tool}</Text>
      </Box>
      <Box marginLeft={2}>
        <Text dimColor>
          {JSON.stringify(toolCall.params).slice(0, 60)}
          {JSON.stringify(toolCall.params).length > 60 && "..."}
        </Text>
      </Box>
    </Box>
  )
}

function getRoleColor(role: string): string {
  switch (role) {
    case "user": return "green"
    case "assistant": return "blue"
    case "system": return "gray"
    default: return "white"
  }
}

function getRoleLabel(role: string): string {
  switch (role) {
    case "user": return "You"
    case "assistant": return "Beast"
    case "system": return "System"
    default: return role
  }
}
