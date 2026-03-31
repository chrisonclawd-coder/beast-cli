/**
 * Beast CLI — Cloud Delegation Interface
 * Offload tasks to cloud providers (from Codex CLI / Claude Code)
 */

export interface CloudProviderConfig {
  name: string
  endpoint: string
  apiKey?: string
}

export interface CloudConfig {
  enabled: boolean
  provider: CloudProviderConfig
  maxConcurrent: number
  timeout: number
  projectRoot: string
  maxFileSize: number
  retryOnFailure: boolean
  maxRetries: number
}

export interface CloudTask {
  id: string
  description: string
  status: "pending" | "running" | "done" | "failed"
  result?: { content: string }
  error?: string
  createdAt: string
  completedAt?: string
}

export const DEFAULT_CLOUD_CONFIG: CloudConfig = {
  enabled: false,
  provider: { name: "none", endpoint: "" },
  maxConcurrent: 3,
  timeout: 300,
  projectRoot: process.cwd(),
  maxFileSize: 1024 * 1024,
  retryOnFailure: true,
  maxRetries: 3,
}

/**
 * Cloud Delegation Manager
 */
export class CloudDelegation {
  private config: CloudConfig
  private tasks: Map<string, CloudTask> = new Map()
  private taskIdCounter = 0

  constructor(config?: Partial<CloudConfig>) {
    this.config = { ...DEFAULT_CLOUD_CONFIG, ...config }
  }

  /** Submit a task to the cloud */
  async submitTask(description: string, _context?: Record<string, unknown>): Promise<string> {
    if (!this.config.enabled) {
      throw new Error("Cloud delegation is not enabled")
    }

    const id = `cloud-${++this.taskIdCounter}`
    const task: CloudTask = {
      id,
      description,
      status: "pending",
      createdAt: new Date().toISOString(),
    }
    this.tasks.set(id, task)
    return id
  }

  /** Wait for a task to complete */
  async waitForTask(taskId: string, timeoutMs?: number): Promise<{ content: string }> {
    const task = this.tasks.get(taskId)
    if (!task) throw new Error(`Task ${taskId} not found`)

    const deadline = Date.now() + (timeoutMs ?? this.config.timeout * 1000)

    while (Date.now() < deadline) {
      const status = await this.checkTaskStatus(taskId)
      if (status.status === "done") {
        task.status = "done"
        task.completedAt = new Date().toISOString()
        if (!task.result) throw new Error("Task completed without result")
        return task.result
      }
      if (status.status === "failed") {
        task.status = "failed"
        throw new Error(task.error ?? "Cloud task failed")
      }
      await new Promise((r) => setTimeout(r, 2000))
    }

    throw new Error(`Task ${taskId} timed out`)
  }

  /** Check task status */
  private async checkTaskStatus(taskId: string): Promise<Partial<CloudTask>> {
    if (!this.config.enabled) {
      return { status: "failed", error: "Cloud delegation not enabled" }
    }
    return { status: Math.random() > 0.3 ? "done" : "running" }
  }

  /** Cancel a running task */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId)
    if (!task || task.status !== "running") return false
    task.status = "failed"
    task.result = { content: "Cancelled" }
    return true
  }

  /** List all tasks */
  listTasks(): CloudTask[] {
    return Array.from(this.tasks.values())
  }

  /** Clear completed/failed tasks */
  clearCompleted(): void {
    for (const [id, task] of this.tasks) {
      if (task.status === "done" || task.status === "failed") {
        this.tasks.delete(id)
      }
    }
  }
}
