/**
 * Beast CLI — Entry Point
 */

import * as readline from "readline"
import * as path from "path"
import { BeastApp } from "../app"
import { SwarmCoordinator, SwarmCoordinatorConfig } from "../agents/swarm"
import { ExecuteAgent } from "../agents/execute"
import { ToolExecutor } from "../tools/executor"
import { builtinTools } from "../tools/builtin"
import { logger } from "../utils/logger"
import { formatTokens } from "../utils/format"

import type { Message } from "../providers/types"
import type { Agent, AgentResult } from "../agents/types"

const args = process.argv.slice(2)
const command = args[0] ?? "chat"

async function main() {
  const commands: Record<string, () => Promise<void>> = {
    init: cmdInit,
    chat: cmdChat,
    config: cmdConfig,
    features: cmdFeatures,
    resume: cmdResume,
    swarm: cmdSwarm,
    subagent: cmdSubagent,
    cloud: () => { console.log("🦁 Cloud coming soon"); return Promise.resolve() },
    mcp: () => { console.log("🦁 MCP coming soon"); return Promise.resolve() },
    help: cmdHelp,
    "--help": cmdHelp,
    "-h": cmdHelp,
  }

  const handler = commands[command]
  if (!handler) {
    console.error(`Unknown command: ${command}. Run 'beast help' for usage.`)
    process.exit(1)
  }
  await handler()
}

async function cmdInit() {
  const dir = args[1] || process.cwd()
  const { createInitCommand } = require("./init")
  await createInitCommand(dir)
  console.log(`🦁 Beast initialized in ${dir}`)
}

async function cmdChat() {
  const app = new BeastApp({ projectRoot: process.cwd() })
  await app.init()

  const active = app.providers.listActive()
  if (active.length === 0) {
    console.error("No providers available. Set API keys:")
    console.error("  export OPENAI_API_KEY=...")
    console.error("  export ANTHROPIC_API_KEY=...")
    console.error("  export GOOGLE_API_KEY=...")
    process.exit(1)
  }

  const providerId = args[1] || active[0]
  const modelId = args[2] || "default"
  app.setActiveProvider(providerId, modelId)

  console.log(`🦁 Beast CLI — ${providerId}/${modelId}`)
  console.log("Type your message. Ctrl+C to exit. /help for commands.\n")

  const messages: Message[] = []
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  const prompt = () => { rl.setPrompt("You> "); rl.prompt() }

  rl.on("line", async (line) => {
    const input = line.trim()
    if (!input) { prompt(); return }

    if (input.startsWith("/")) {
      await handleSlash(input, app, messages)
      prompt()
      return
    }

    messages.push({ role: "user", content: input })

    try {
      let fullResponse = ""
      process.stdout.write("Beast> ")

      for await (const chunk of app.chat(messages)) {
        if (chunk.type === "text" && chunk.content) {
          process.stdout.write(chunk.content)
          fullResponse += chunk.content
        } else if (chunk.type === "done") {
          process.stdout.write("\n")
          if (chunk.usage) {
            console.log(`  [${formatTokens(chunk.usage.inputTokens + chunk.usage.outputTokens)} tokens]`)
          }
        }
      }

      messages.push({ role: "assistant", content: fullResponse })

      if (messages.length > 50) {
        const { messages: compacted } = await app.compactor.compact(messages)
        messages.length = 0
        messages.push(...compacted)
        console.log("  [Auto-compacted]")
      }
    } catch (err: any) {
      console.error(`\nError: ${err.message}`)
    }
    prompt()
  })

  rl.on("close", () => { console.log("\n🦁 Bye!"); process.exit(0) })
  prompt()
}

async function cmdConfig() {
  const app = new BeastApp({ projectRoot: process.cwd() })
  await app.config.load()
  const key = args[1]
  const value = args[2]

  if (!key) {
    console.log(JSON.stringify(app.config.get(), null, 2))
  } else if (value) {
    const cfg = app.config.get() as any
    cfg[key] = value
    await app.config.save()
    console.log(`Set ${key} = ${value}`)
  } else {
    const cfg = app.config.get() as any
    console.log(cfg[key] ?? "(not set)")
  }
}

async function cmdFeatures() {
  const app = new BeastApp({ projectRoot: process.cwd() })
  await app.features.load()
  const subcmd = args[1]

  if (subcmd === "enable" && args[2]) {
    await app.features.enable(args[2] as any)
    console.log(`Enabled: ${args[2]}`)
  } else if (subcmd === "disable" && args[2]) {
    await app.features.disable(args[2] as any)
    console.log(`Disabled: ${args[2]}`)
  } else {
    const flags = app.features.getFlags()
    for (const [name, enabled] of Object.entries(flags)) {
      console.log(`  ${enabled ? "✅" : "⬜"} ${name}`)
    }
  }
}

async function cmdResume() {
  const app = new BeastApp({ projectRoot: process.cwd() })
  const sessionId = args[1]

  if (sessionId) {
    const cp = await app.resume.loadCheckpoint(sessionId)
    if (!cp) { console.error(`Session not found: ${sessionId}`); process.exit(1) }
    console.log(`Session ${sessionId}: ${cp.messages.length} messages, ${cp.totalTokens} tokens`)
  } else {
    const checkpoints = await app.resume.listCheckpoints()
    if (checkpoints.length === 0) {
      console.log("No saved sessions")
    } else {
      for (const cp of checkpoints.slice(0, 10)) {
        const date = new Date(cp.timestamp).toLocaleString()
        console.log(`  ${cp.id.slice(0, 8)}  ${date}  ${cp.messages.length} msgs`)
      }
    }
  }
}

// Parse swarm/subagent CLI args
interface SwarmArgs {
  task: string
  agents: number
  isolation: "worktree" | "directory"
  merge: "auto" | "manual"
  provider: string
  model: string
}

function parseSwarmArgs(): SwarmArgs {
  const taskIndex = args.findIndex(a => !a.startsWith("-"))
  const task = taskIndex >= 1 ? args[taskIndex] : ""
  
  const getFlag = (name: string, defaultValue: string): string => {
    const idx = args.indexOf(name)
    return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : defaultValue
  }

  return {
    task,
    agents: parseInt(getFlag("--agents", "2"), 10),
    isolation: getFlag("--isolation", "worktree") as "worktree" | "directory",
    merge: getFlag("--merge", "manual") as "auto" | "manual",
    provider: getFlag("--provider", ""),
    model: getFlag("--model", "default"),
  }
}

// Spinner animation
const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
let spinnerIdx = 0
function spinner(): string {
  const frame = spinnerFrames[spinnerIdx]
  spinnerIdx = (spinnerIdx + 1) % spinnerFrames.length
  return frame
}

// Format duration
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}

async function cmdSwarm() {
  const parsed = parseSwarmArgs()
  
  if (!parsed.task) {
    console.log(`
🐜 Beast Swarm - Parallel Agent Execution

Usage: beast swarm "<task>" [options]

Options:
  --agents <n>      Number of parallel agents (default: 2)
  --isolation <mode> Isolation mode: worktree | directory (default: worktree)
  --merge <strategy> Merge strategy: auto | manual (default: manual)
  --provider <name> Provider to use (default: auto-detect)
  --model <name>    Model to use (default: default)

Examples:
  beast swarm "fix all type errors" --agents 3
  beast swarm "add tests for all modules" --agents 2 --isolation worktree
  beast swarm "refactor to use async/await" --merge auto
`)
    process.exit(0)
  }

  const projectRoot = process.cwd()
  
  // Initialize app to get provider registry
  const app = new BeastApp({ projectRoot })
  await app.init()

  const active = app.providers.listActive()
  if (active.length === 0) {
    console.error("No providers available. Set API keys:")
    console.error("  export OPENAI_API_KEY=...")
    console.error("  export ANTHROPIC_API_KEY=...")
    console.error("  export GOOGLE_API_KEY=...")
    process.exit(1)
  }

  const providerId = parsed.provider || active[0]
  const modelId = parsed.model
  app.setActiveProvider(providerId, modelId)
  const provider = app.getActiveProvider()

  console.log(`\n🐜 Starting swarm with ${parsed.agents} agent(s)...`)
  console.log(`   Task: "${parsed.task}"`)
  console.log(`   Provider: ${providerId}/${modelId}`)
  console.log(`   Isolation: ${parsed.isolation}`)
  console.log(`   Merge: ${parsed.merge}`)
  console.log("")

  // Create swarm coordinator
  const swarmConfig: SwarmCoordinatorConfig = {
    projectRoot,
    maxTeammates: parsed.agents,
    isolation: parsed.isolation,
    mergeStrategy: parsed.merge,
  }
  const coordinator = new SwarmCoordinator(swarmConfig)

  // Track agent status
  const agentStatus: Array<{
    id: string
    task: string
    status: string
    startTime: number
    endTime?: number
    filesChanged: number
    result?: string
    error?: string
  }> = []

  // Divide the task into subtasks for each agent
  const subtasks = divideTask(parsed.task, parsed.agents)

  // Create tasks and agents
  for (let i = 0; i < parsed.agents; i++) {
    const subtask = subtasks[i] || `Agent ${i + 1}: ${parsed.task}`
    
    // Create tool executor for this agent
    const agentTools = new ToolExecutor()
    agentTools.registerTools(builtinTools)
    agentTools.setDefaultPermission("auto")

    // Create ExecuteAgent wrapper that matches Agent interface
    const executeAgent = new ExecuteAgent({
      provider,
      model: modelId,
      tools: agentTools,
      systemPrompt: getSwarmAgentPrompt(projectRoot, i + 1, parsed.agents),
      maxIterations: 50,
      workingDir: projectRoot,
    })

    // Create swarm task
    const task = await coordinator.createTask(subtask)
    
    // Create Agent interface wrapper
    const agentWrapper: Agent = {
      mode: "execute" as const,
      run: async (taskDesc: string) => {
        const startTime = Date.now()
        try {
          const result = await executeAgent.run(taskDesc)
          return {
            content: result.content,
            toolCalls: [],
            iterations: result.iterations,
            tokensUsed: result.totalTokens,
            durationMs: Date.now() - startTime,
          }
        } catch (err: any) {
          return {
            content: "",
            toolCalls: [],
            iterations: 0,
            tokensUsed: { input: 0, output: 0 },
            durationMs: Date.now() - startTime,
            error: err.message,
          }
        }
      },
      stop: () => { /* no-op */ },
      isActive: () => true,
    }

    coordinator.assignAgent(task.id, agentWrapper)
    
    agentStatus.push({
      id: task.id,
      task: subtask,
      status: "pending",
      startTime: 0,
      filesChanged: 0,
    })
  }

  // Run all tasks with live status updates
  const statusInterval = setInterval(() => {
    // Clear previous line and show status
    process.stdout.write("\r\x1b[K")
    
    const statusLine = agentStatus.map((a, i) => {
      const icon = a.status === "running" ? spinner() : 
                   a.status === "done" ? "✓" : 
                   a.status === "failed" ? "✗" : "○"
      return `Agent ${i + 1}: ${icon} ${a.status}`
    }).join("  ")
    
    process.stdout.write(`   ${statusLine}`)
  }, 100)

  // Update status when tasks start
  const originalRunTask = coordinator.runTask.bind(coordinator)
  coordinator.runTask = async (taskId: string) => {
    const status = agentStatus.find(a => a.id === taskId)
    if (status) {
      status.status = "running"
      status.startTime = Date.now()
    }
    try {
      const result = await originalRunTask(taskId)
      if (status) {
        status.status = "done"
        status.endTime = Date.now()
        status.result = result.content?.slice(0, 100)
      }
      return result
    } catch (err: any) {
      if (status) {
        status.status = "failed"
        status.endTime = Date.now()
        status.error = err.message
      }
      throw err
    }
  }

  try {
    // Run all agents in parallel
    await coordinator.runAll()
  } finally {
    clearInterval(statusInterval)
    process.stdout.write("\r\x1b[K")
  }

  // Show results
  console.log("\n🐜 Swarm Results (" + parsed.agents + " agents)")
  
  let totalFiles = 0
  for (let i = 0; i < agentStatus.length; i++) {
    const a = agentStatus[i]
    const duration = a.endTime && a.startTime ? formatDuration(a.endTime - a.startTime) : "N/A"
    const icon = a.status === "done" ? "✓" : a.status === "failed" ? "✗" : "?"
    const prefix = i === agentStatus.length - 1 ? "└──" : "├──"
    
    console.log(`${prefix} Agent ${i + 1}: "${a.task.slice(0, 40)}${a.task.length > 40 ? '...' : ''}" ${icon} (${duration})`)
    if (a.error) {
      console.log(`    Error: ${a.error}`)
    }
    totalFiles += a.filesChanged
  }

  console.log("")
  
  if (parsed.merge === "auto") {
    console.log("Auto-merging results...")
    for (const a of agentStatus) {
      if (a.status === "done") {
        await coordinator.mergeResults(a.id)
      }
    }
    console.log("✓ Merged all results to main branch")
  } else {
    console.log(`Total: ${totalFiles} files changed across ${parsed.agents} branches`)
    console.log("Use 'beast swarm merge' to merge results (not implemented yet).")
  }

  // Cleanup
  await coordinator.cleanup()
}

// Divide a task into subtasks for multiple agents
function divideTask(task: string, numAgents: number): string[] {
  // Simple task division strategies
  // In a real implementation, this would analyze the codebase and create intelligent divisions
  
  if (numAgents <= 1) {
    return [task]
  }

  // For now, create variations of the task for each agent
  const subtasks: string[] = []
  
  // Common prefixes for task division
  const prefixes = [
    "Focus on the first half of the codebase: ",
    "Focus on the second half of the codebase: ",
    "Focus on core modules: ",
    "Focus on utility modules: ",
    "Focus on test files: ",
    "Focus on configuration files: ",
  ]

  for (let i = 0; i < numAgents; i++) {
    if (i < prefixes.length) {
      subtasks.push(`${prefixes[i]}${task}`)
    } else {
      subtasks.push(`Agent ${i + 1}: ${task}`)
    }
  }

  return subtasks
}

// System prompt for swarm agents
function getSwarmAgentPrompt(projectRoot: string, agentNum: number, totalAgents: number): string {
  return `You are Agent ${agentNum} of ${totalAgents} in a swarm of parallel AI coding agents.

Working directory: ${projectRoot}

Your role:
- Work on your assigned task independently
- Make targeted, minimal changes
- Do not conflict with other agents (they are working in parallel)
- Focus on your specific area of responsibility

When making changes:
- Be efficient and focused
- Test your changes if possible
- Document what you changed

Work independently and report your results clearly.`
}

async function cmdSubagent() {
  const taskIndex = args.findIndex(a => !a.startsWith("-"))
  const task = taskIndex >= 1 ? args[taskIndex] : ""
  
  const getFlag = (name: string, defaultValue: string): string => {
    const idx = args.indexOf(name)
    return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : defaultValue
  }

  const providerOverride = getFlag("--provider", "")
  const modelId = getFlag("--model", "default")

  if (!task) {
    console.log(`
🤖 Beast Subagent - Single Task Delegation

Usage: beast subagent "<task>" [options]

Options:
  --provider <name> Provider to use (default: auto-detect)
  --model <name>    Model to use (default: default)

Examples:
  beast subagent "write unit tests for src/providers/"
  beast subagent "add JSDoc comments to all public functions"
  beast subagent "refactor the config module" --provider anthropic
`)
    process.exit(0)
  }

  const projectRoot = process.cwd()
  
  // Initialize app
  const app = new BeastApp({ projectRoot })
  await app.init()

  const active = app.providers.listActive()
  if (active.length === 0) {
    console.error("No providers available. Set API keys:")
    console.error("  export OPENAI_API_KEY=...")
    console.error("  export ANTHROPIC_API_KEY=...")
    process.exit(1)
  }

  const providerId = providerOverride || active[0]
  app.setActiveProvider(providerId, modelId)
  const provider = app.getActiveProvider()

  console.log(`\n🤖 Starting subagent...`)
  console.log(`   Task: "${task}"`)
  console.log(`   Provider: ${providerId}/${modelId}`)
  console.log("")

  // Create tool executor
  const agentTools = new ToolExecutor()
  agentTools.registerTools(builtinTools)
  agentTools.setDefaultPermission("auto")

  // Create agent
  const agent = new ExecuteAgent({
    provider,
    model: modelId,
    tools: agentTools,
    systemPrompt: `You are a focused AI coding agent working on a specific task.

Working directory: ${projectRoot}

Complete the task efficiently and report what you did.`,
    maxIterations: 50,
    workingDir: projectRoot,
  })

  // Run with spinner
  const startTime = Date.now()
  let spinnerInterval = setInterval(() => {
    process.stdout.write(`\r   ${spinner()} Working...`)
  }, 100)

  try {
    const result = await agent.run(task)
    clearInterval(spinnerInterval)
    
    const duration = formatDuration(Date.now() - startTime)
    
    process.stdout.write("\r\x1b[K")
    console.log(`\n✓ Task completed (${duration})`)
    console.log(`  Tokens: ${formatTokens(result.totalTokens.input + result.totalTokens.output)}`)
    console.log(`  Iterations: ${result.iterations}`)
    console.log("")
    console.log("Result:")
    console.log(result.content)
  } catch (err: any) {
    clearInterval(spinnerInterval)
    process.stdout.write("\r\x1b[K")
    console.error(`\n✗ Task failed: ${err.message}`)
    process.exit(1)
  }
}

async function cmdHelp() {
  console.log(`
🦁 Beast CLI — The unified AI coding assistant

Usage: beast <command> [options]

Commands:
  init [path]               Initialize Beast in a project
  chat [provider] [model]   Start interactive chat (default)
  config [key] [value]      Get/set configuration
  features [enable|disable] Manage feature flags
  resume [session-id]       List or resume sessions
  swarm "<task>"            Run parallel agents with git worktrees
  subagent "<task>"         Delegate a task to a single agent

Slash commands (in chat):
  /help     Show commands
  /plan     Switch to plan mode
  /compact  Compact context
  /clear    Clear conversation
  /quit     Exit

Swarm options:
  --agents <n>       Number of parallel agents (default: 2)
  --isolation <mode> worktree | directory (default: worktree)
  --merge <strategy> auto | manual (default: manual)

Environment:
  OPENAI_API_KEY      OpenAI
  ANTHROPIC_API_KEY   Anthropic
  GOOGLE_API_KEY      Google

Examples:
  beast swarm "fix all type errors" --agents 3
  beast swarm "add tests" --merge auto
  beast subagent "write unit tests for src/providers/"
`)
}

async function handleSlash(input: string, app: BeastApp, messages: Message[]) {
  const cmd = input.split(/\s+/)[0].slice(1)
  switch (cmd) {
    case "help":
      console.log("/help /plan /compact /clear /quit")
      break
    case "plan": {
      const lastUser = [...messages].reverse().find(m => m.role === "user")
      if (lastUser) {
        console.log("Planning...")
        const result = await app.plan(lastUser.content)
        console.log(`Beast (plan)> ${result}`)
      }
      break
    }
    case "compact": {
      const { messages: compacted } = await app.compactor.compact(messages)
      messages.length = 0
      messages.push(...compacted)
      console.log(`Compacted to ${messages.length} messages`)
      break
    }
    case "clear":
      messages.length = 0
      console.log("Cleared")
      break
    case "quit":
      console.log("🦁 Bye!")
      process.exit(0)
    default:
      console.log(`Unknown: /${cmd}`)
  }
}

main().catch((err) => { console.error("Fatal:", err.message); process.exit(1) })
