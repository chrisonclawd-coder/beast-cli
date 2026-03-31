/**
 * Beast CLI — Swarm Coordinator
 * 
 * Coordinate multiple agents working in parallel.
 * Uses git worktrees for isolation.
 * Inspired by Claude Code's swarm mode.
 */

import { execSync } from "child_process"
import * as fs from "fs/promises"
import * as path from "path"
import type { Agent, AgentConfig, AgentResult, SwarmTask, SwarmConfig } from "./types"

export interface SwarmCoordinatorConfig {
  projectRoot: string
  maxTeammates: number
  isolation: "worktree" | "directory"
  mergeStrategy: "auto" | "manual"
}

export interface SwarmStatus {
  active: number
  pending: number
  completed: number
  failed: number
  tasks: SwarmTask[]
}

/**
 * Swarm Coordinator - manages parallel agents
 */
export class SwarmCoordinator {
  private config: SwarmCoordinatorConfig
  private tasks: Map<string, SwarmTask> = new Map()
  private agents: Map<string, Agent> = new Map()
  private worktrees: Map<string, string> = new Map()
  private taskIdCounter = 0

  constructor(config: SwarmCoordinatorConfig) {
    this.config = config
  }

  /**
   * Create a new swarm task
   */
  async createTask(description: string, agent?: Agent): Promise<SwarmTask> {
    const id = `task-${++this.taskIdCounter}`
    
    const task: SwarmTask = {
      id,
      description,
      agentId: agent ? `agent-${id}` : "",
      status: "pending",
    }

    this.tasks.set(id, task)

    if (agent) {
      this.agents.set(task.agentId, agent)
    }

    return task
  }

  /**
   * Assign an agent to a task
   */
  assignAgent(taskId: string, agent: Agent): void {
    const task = this.tasks.get(taskId)
    if (!task) {
      throw new Error(`Task not found: ${taskId}`)
    }

    const agentId = `agent-${taskId}`
    task.agentId = agentId
    this.agents.set(agentId, agent)
  }

  /**
   * Run a task in isolation
   */
  async runTask(taskId: string): Promise<AgentResult> {
    const task = this.tasks.get(taskId)
    if (!task) {
      throw new Error(`Task not found: ${taskId}`)
    }

    if (!task.agentId) {
      throw new Error(`No agent assigned to task: ${taskId}`)
    }

    const agent = this.agents.get(task.agentId)
    if (!agent) {
      throw new Error(`Agent not found: ${task.agentId}`)
    }

    task.status = "running"

    try {
      // Create isolated worktree if configured
      if (this.config.isolation === "worktree") {
        task.branch = await this.createWorktree(taskId)
      }

      // Run the agent
      const result = await agent.run(task.description)

      task.status = "done"
      task.result = result.content

      return result
    } catch (error) {
      task.status = "failed"
      task.result = error instanceof Error ? error.message : "Unknown error"
      throw error
    }
  }

  /**
   * Run multiple tasks in parallel
   */
  async runAll(taskIds?: string[]): Promise<AgentResult[]> {
    const tasksToRun = taskIds 
      ? taskIds.map(id => this.tasks.get(id)).filter(Boolean) as SwarmTask[]
      : Array.from(this.tasks.values()).filter(t => t.status === "pending")

    // Limit concurrent tasks
    const maxConcurrent = this.config.maxTeammates
    const results: AgentResult[] = []

    // Run in batches
    for (let i = 0; i < tasksToRun.length; i += maxConcurrent) {
      const batch = tasksToRun.slice(i, i + maxConcurrent)
      const batchResults = await Promise.all(
        batch.map(task => this.runTask(task.id).catch(err => ({
          content: "",
          toolCalls: [],
          iterations: 0,
          tokensUsed: { input: 0, output: 0 },
          durationMs: 0,
          error: err.message,
        })))
      )
      results.push(...batchResults)
    }

    return results
  }

  /**
   * Get swarm status
   */
  getStatus(): SwarmStatus {
    const tasks = Array.from(this.tasks.values())
    
    return {
      active: tasks.filter(t => t.status === "running").length,
      pending: tasks.filter(t => t.status === "pending").length,
      completed: tasks.filter(t => t.status === "done").length,
      failed: tasks.filter(t => t.status === "failed").length,
      tasks,
    }
  }

  /**
   * Get a specific task
   */
  getTask(taskId: string): SwarmTask | undefined {
    return this.tasks.get(taskId)
  }

  /**
   * Cancel a running task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId)
    if (!task || task.status !== "running") {
      return false
    }

    // Stop the agent
    if (task.agentId) {
      const agent = this.agents.get(task.agentId)
      if (agent) {
        agent.stop()
      }
    }

    task.status = "failed"
    task.result = "Cancelled"

    // Cleanup worktree
    if (task.branch) {
      await this.removeWorktree(task.branch)
    }

    return true
  }

  /**
   * Merge completed task results
   */
  async mergeResults(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId)
    if (!task || task.status !== "done" || !task.branch) {
      return false
    }

    if (this.config.mergeStrategy === "manual") {
      console.log(`Task ${taskId} ready for manual merge from branch: ${task.branch}`)
      return true
    }

    // Auto merge
    try {
      const mainBranch = this.getMainBranch()
      execSync(`git checkout ${mainBranch}`, { cwd: this.config.projectRoot, stdio: "pipe" })
      execSync(`git merge ${task.branch} --no-edit`, { cwd: this.config.projectRoot, stdio: "pipe" })
      
      await this.removeWorktree(task.branch)
      task.branch = undefined
      
      return true
    } catch (error) {
      console.warn(`Merge failed for task ${taskId}: ${error}`)
      return false
    }
  }

  /**
   * Create a git worktree for isolation
   */
  private async createWorktree(taskId: string): Promise<string> {
    const branchName = `beast-swarm-${taskId}`
    const worktreePath = path.join(this.config.projectRoot, "..", `beast-worktree-${taskId}`)

    try {
      // Create branch and worktree
      execSync(`git worktree add ${worktreePath} -b ${branchName}`, {
        cwd: this.config.projectRoot,
        stdio: "pipe",
      })

      this.worktrees.set(taskId, worktreePath)
      return branchName
    } catch (error) {
      // Branch might already exist
      try {
        execSync(`git worktree add ${worktreePath} ${branchName}`, {
          cwd: this.config.projectRoot,
          stdio: "pipe",
        })
        this.worktrees.set(taskId, worktreePath)
        return branchName
      } catch {
        throw new Error(`Failed to create worktree for task ${taskId}`)
      }
    }
  }

  /**
   * Remove a git worktree
   */
  private async removeWorktree(branchName: string): Promise<void> {
    try {
      execSync(`git worktree remove --force ${branchName}`, {
        cwd: this.config.projectRoot,
        stdio: "pipe",
      })
      execSync(`git branch -D ${branchName}`, {
        cwd: this.config.projectRoot,
        stdio: "pipe",
      })
    } catch {
      // Ignore cleanup errors
    }
  }

  /**
   * Get the main branch name
   */
  private getMainBranch(): string {
    try {
      const result = execSync("git remote show origin | grep 'HEAD branch'", {
        cwd: this.config.projectRoot,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      })
      const match = result.match(/HEAD branch: (.+)/)
      return match ? match[1].trim() : "main"
    } catch {
      return "main"
    }
  }

  /**
   * Cleanup all worktrees
   */
  async cleanup(): Promise<void> {
    for (const [taskId, worktreePath] of this.worktrees) {
      try {
        execSync(`git worktree remove --force ${worktreePath}`, {
          cwd: this.config.projectRoot,
          stdio: "pipe",
        })
      } catch {
        // Ignore cleanup errors
      }
    }
    this.worktrees.clear()
  }
}

/**
 * Create a swarm coordinator
 */
export function createSwarmCoordinator(projectRoot: string, config?: Partial<SwarmConfig>): SwarmCoordinator {
  return new SwarmCoordinator({
    projectRoot,
    maxTeammates: config?.maxTeammates || 3,
    isolation: config?.isolation || "worktree",
    mergeStrategy: config?.mergeStrategy || "auto",
  })
}

// Global swarm coordinator
let globalSwarmCoordinator: SwarmCoordinator | null = null

export function getSwarmCoordinator(projectRoot?: string): SwarmCoordinator {
  if (!globalSwarmCoordinator || projectRoot) {
    globalSwarmCoordinator = createSwarmCoordinator(projectRoot || process.cwd())
  }
  return globalSwarmCoordinator
}
