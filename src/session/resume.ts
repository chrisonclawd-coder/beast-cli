/**
 * Beast CLI — Session Resume
 * Recover interrupted sessions (from Claude Code)
 */

import * as fs from "fs/promises"
import * as path from "path"

export interface ResumeCheckpoint {
  id: string
  sessionId: string
  timestamp: string
  messages: unknown[]
  totalTokens: number
  workingDir: string
  branch: string
  lastToolCall?: string
}

export interface ResumeConfig {
  enabled: boolean
  autoSaveIntervalMs: number
  maxCheckpoints: number
  resumeDir: string
}

export const DEFAULT_RESUME_CONFIG: ResumeConfig = {
  enabled: true,
  autoSaveIntervalMs: 30000,
  maxCheckpoints: 50,
  resumeDir: ".beast/resume",
}

export class SessionResume {
  private config: ResumeConfig

  constructor(config?: Partial<ResumeConfig>) {
    this.config = { ...DEFAULT_RESUME_CONFIG, ...config }
  }

  /** Initialize resume directory */
  async init(): Promise<void> {
    await fs.mkdir(this.config.resumeDir, { recursive: true })
  }

  /** Save a checkpoint */
  async saveCheckpoint(checkpoint: ResumeCheckpoint): Promise<void> {
    await this.init()
    const filePath = path.join(this.config.resumeDir, `${checkpoint.id}.json`)
    await fs.writeFile(filePath, JSON.stringify(checkpoint, null, 2), "utf-8")

    // Prune old checkpoints
    await this.pruneCheckpoints()
  }

  /** Load a checkpoint by ID */
  async loadCheckpoint(id: string): Promise<ResumeCheckpoint | null> {
    try {
      const filePath = path.join(this.config.resumeDir, `${id}.json`)
      const content = await fs.readFile(filePath, "utf-8")
      return JSON.parse(content) as ResumeCheckpoint
    } catch {
      return null
    }
  }

  /** Find the latest checkpoint for a session */
  async findLatest(sessionId?: string): Promise<ResumeCheckpoint | null> {
    await this.init()
    const files = await fs.readdir(this.config.resumeDir)
    const checkpoints: ResumeCheckpoint[] = []

    for (const file of files) {
      if (!file.endsWith(".json")) continue
      try {
        const content = await fs.readFile(
          path.join(this.config.resumeDir, file),
          "utf-8"
        )
        const cp = JSON.parse(content) as ResumeCheckpoint
        if (!sessionId || cp.sessionId === sessionId) {
          checkpoints.push(cp)
        }
      } catch {
        // Skip invalid files
      }
    }

    if (checkpoints.length === 0) return null

    checkpoints.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    return checkpoints[0]
  }

  /** List all checkpoints */
  async listCheckpoints(): Promise<ResumeCheckpoint[]> {
    await this.init()
    const files = await fs.readdir(this.config.resumeDir)
    const checkpoints: ResumeCheckpoint[] = []

    for (const file of files) {
      if (!file.endsWith(".json")) continue
      try {
        const content = await fs.readFile(
          path.join(this.config.resumeDir, file),
          "utf-8"
        )
        checkpoints.push(JSON.parse(content) as ResumeCheckpoint)
      } catch {
        // Skip invalid
      }
    }

    return checkpoints.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  /** Delete a checkpoint */
  async deleteCheckpoint(id: string): Promise<boolean> {
    try {
      await fs.unlink(path.join(this.config.resumeDir, `${id}.json`))
      return true
    } catch {
      return false
    }
  }

  /** Prune old checkpoints beyond maxCheckpoints */
  private async pruneCheckpoints(): Promise<void> {
    const checkpoints = await this.listCheckpoints()
    if (checkpoints.length <= this.config.maxCheckpoints) return

    const toDelete = checkpoints.slice(this.config.maxCheckpoints)
    for (const cp of toDelete) {
      await this.deleteCheckpoint(cp.id)
    }
  }
}
