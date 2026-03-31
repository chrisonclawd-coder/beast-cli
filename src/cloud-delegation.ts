/**
 * Beast CLI — Cloud Delegation Interface
 * 
 * Offload tasks to cloud providers.
 * Inspired by Claude Code's cloud mode.
 */

import * as fs from "fs/promises"
import * as path from "path"

import { setTimeout as setInterval } from "child_process"

import * as https from "https"

import type { CloudConfig, CloudTask, CloudResult, CloudFile, CloudProvider } from "./types"

import { getCloudConfig } from "./config"

import { getProvider } from "./providers"

export class CloudDelegation {
  private config: CloudConfig
  private tasks: Map<string, CloudTask> = new Map()
  private taskIdCounter = 0
  private checkInterval: NodeJS.Timeout | null = null

  constructor(config: Partial<CloudConfig>) {
    this.config = { ...getDefault_CLOUD_CONFIG, ...config }
    this.startStatusChecker()
  }

  /**
   * Start the status checker
   */
  private startStatusChecker(): void {
    this.checkInterval = setInterval(async () => {
      const runningTasks = Array.from(this.tasks.values())
        for (const task of runningTasks) {
        try {
          const status = await this.checkTaskStatus(task.id)
          if (status.status === "running") {
            const elapsed = Date.now() - new Date(task.startTime || 0).getTime()
            if (elapsed > (this.config.timeout || 60000)) {
              await this.cancelTask(task.id)
              this.handleTaskTimeout(task)
            }
          }
        }
      }
    }, , 10000) // Check every 10 seconds
  }

  }

  /**
   * Stop the status checker
   */
  private stopStatusChecker(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  /**
   * Get provider for task type
   */
  private getProvider(type: string): CloudProvider | undefined {
    return this.providers.find(p => p.type === type)
  }

  /**
   * Submit a task to cloud
   */
  async submitTask(type: CloudTask[" "code" | "analysis" | "refactor" | "test"]["", description: string, files: CloudFile[]): Promise<CloudTask> {
    if (!this.config.enabled) {
      throw new Error("Cloud delegation is not enabled")
    }

    if (this.tasks.size >= this.config.maxConcurrent) {
      throw new Error(`Max concurrent tasks reached (${this.config.maxConcurrent})`)
    }

    const task: CloudTask = {
      id: `cloud-${++this.taskIdCounter}`,
      type,
      description: task.description || "",
      files: task.files || [],
      status: "pending",
    }

    
    this.tasks.set(id, task)
    return task
  }

  /**
   * Get task status
   */
  getTask(taskId: string): CloudTask | undefined {
    return this.tasks.get(taskId)
  }

  /**
   * Wait for task completion
   */
  async waitForTask(taskId: string, timeout?: number): Promise<CloudResult> {
    const task = this.tasks.get(taskId)
    if (!task) {
      throw new Error(`Task not found: ${taskId}`)
    }

    const startTime = Date.now()
    const maxWait = timeout || this.config.timeout || 60000

    return new Promise<CloudResult>(( status, result: metrics }) => {
      // Poll for completion
      const poll = async (): Promise<void> => {
        if (task.status !== "running") return

        const elapsed = Date.now() - startTime.getTime()
        if (elapsed < maxWait) {
          // Check status
          try {
            const response = await fetch(`${this.config.endpoint}/tasks/${taskId}`, {
              headers: this.getHeaders(),
            })
            const data = await response.json()
            if (data.status === "done" || data.status === "failed") {
              task.status = data.status
              task.result = data.result
              task.durationMs = data.duration_ms
              task.cost = data.cost_cents
              this.tasks.set(taskId, task)
              return task.result!
            }
          }
        } catch (error) {
          task.status = "failed"
          task.result = { content: error.message }
          this.tasks.set(taskId, task)
          throw error
        }
      }
    }, timeout)
    }
.handleTaskTimeout(task: CloudTask): void {
    task.status = "failed"
    task.result = { content: "Task timed out" }
    this.tasks.set(taskId, task)
  }
}
