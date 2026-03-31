/**
 * Beast CLI — Plan Agent
 * 
 * Read-only agent for planning and analysis.
 * Inspired by Claude Code's plan mode.
 */

import type { Provider, Message } from "../providers/types"

export interface PlanAgentConfig {
  provider: Provider
  model?: string
  systemPrompt?: string
  onToken?: (token: string) => void
  workingDir?: string
}

export interface PlanResponse {
  content: string
  tokens: { input: number; output: number }
}

/**
 * Plan Agent - Read-only analysis agent
 */
export class PlanAgent {
  private provider: Provider
  private model: string
  private systemPrompt: string
  private messages: Message[] = []
  private onToken?: (token: string) => void
  private workingDir: string

  constructor(config: PlanAgentConfig) {
    this.provider = config.provider
    this.model = config.model || "gpt-4.1"
    this.systemPrompt = config.systemPrompt || getPlanSystemPrompt()
    this.onToken = config.onToken
    this.workingDir = config.workingDir || process.cwd()
  }

  /**
   * Analyze a task and create a plan
   */
  async plan(task: string): Promise<PlanResponse> {
    this.messages = []

    this.messages.push({
      role: "user",
      content: `Please analyze and create a plan for the following task. Do NOT make any changes - only analyze and plan.\n\nTask: ${task}`,
    })

    let inputTokens = 0
    let outputTokens = 0

    const stream = this.provider.stream(this.messages, {
      model: this.model,
      systemPrompt: this.systemPrompt,
      maxTokens: 8192,
    })

    let content = ""

    for await (const chunk of stream) {
      if (chunk.type === "text" && chunk.content !== undefined) {
        content += chunk.content
        if (chunk.content) {
          this.onToken?.(chunk.content)
        }
      } else if (chunk.type === "done" && chunk.usage) {
        inputTokens = chunk.usage.inputTokens
        outputTokens = chunk.usage.outputTokens
      }
    }

    this.messages.push({
      role: "assistant",
      content,
    })

    return {
      content,
      tokens: { input: inputTokens, output: outputTokens },
    }
  }

  /**
   * Ask a follow-up question
   */
  async ask(question: string): Promise<PlanResponse> {
    this.messages.push({
      role: "user",
      content: question,
    })

    let inputTokens = 0
    let outputTokens = 0

    const stream = this.provider.stream(this.messages, {
      model: this.model,
      systemPrompt: this.systemPrompt,
      maxTokens: 8192,
    })

    let content = ""

    for await (const chunk of stream) {
      if (chunk.type === "text" && chunk.content !== undefined) {
        content += chunk.content
        if (chunk.content) {
          this.onToken?.(chunk.content)
        }
      } else if (chunk.type === "done" && chunk.usage) {
        inputTokens = chunk.usage.inputTokens
        outputTokens = chunk.usage.outputTokens
      }
    }

    this.messages.push({
      role: "assistant",
      content,
    })

    return {
      content,
      tokens: { input: inputTokens, output: outputTokens },
    }
  }

  /**
   * Get conversation history
   */
  getMessages(): Message[] {
    return [...this.messages]
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.messages = []
  }
}

/**
 * System prompt for plan mode
 */
function getPlanSystemPrompt(): string {
  return `You are an AI assistant in PLAN MODE. Your job is to analyze tasks and create detailed implementation plans.

IMPORTANT: You are in READ-ONLY mode. You cannot:
- Make changes to files
- Execute commands
- Modify anything

Your role is to:
1. Analyze the task thoroughly
2. Identify all files that need to be created or modified
3. Create a step-by-step implementation plan
4. Identify potential issues or edge cases
5. Suggest the best approach

Format your response as:
## Analysis
[Brief analysis of what needs to be done]

## Files to Create/Modify
- path/to/file.ts - [what changes]
- path/to/other.ts - [what changes]

## Implementation Steps
1. [First step]
2. [Second step]
...

## Potential Issues
- [Issue 1]
- [Issue 2]

## Recommendation
[Your recommendation for the best approach]`
}
