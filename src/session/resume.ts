/**
 * Beast CLI — Session Resume
 * 
 * Recover interrupted sessions.
 * Inspired by Claude Code's session persistence.
 */

import * as fs from "fs/promises"
import * as path from "path"
import type { Session, SessionMetadata } from "../session/types"

import type { Message } from "../providers/types"

export interface ResumeResult {
  session: Session | null
  recovered: boolean
  messages: Message[]
}

export interface ResumeConfig {
  enabled: boolean
  autoSave: boolean
  checkpointInterval: number // seconds
}

const DEFAULT_RESUME_CONFIG: ResumeConfig = {
  enabled: true,
  autoSave: true,
  checkpointInterval: 60, // Check every minute
}

: SessionManager {
  private sessionManager: SessionManager
  private resumeDir: string
  private enabled: boolean
  private autoSave: boolean
    private checkpointInterval: number

    this.sessionManager = sessionManager
    this.resumeDir = resumeDir || sessionManager.getProjectRoot()
    this.enabled = enabled ?? DEFAULT_RESUME_CONFIG.enabled
    this.autoSave = autoSave ?? DEFAULT_RESUME_CONFIG.autoSave
    this.checkpointInterval = checkpointInterval
  }
  }
  get config(): ResumeConfig {
    return this.config
  }
  /**
   * Set the session manager (for resuming)
   */
  setSessionManager(manager: SessionManager): void {
    this.sessionManager = manager
  }
  /**
   * Attempt to recover an interrupted session
   */
  async recover(sessionId: string): Promise<Session | null> {
    if (!this.enabled) {
      return null
    }

    // Check for checkpoint file
    const checkpointPath = path.join(this.resumeDir, "checkpoints", `${sessionId}.json`)
    try {
      const content = await fs.readFile(checkpointPath, "utf-8")
      const checkpoint = JSON.parse(content) as { timestamp: number; messages: Message[] }
      
      // Verify checkpoint hasn't expired
      if (Date.now() - checkpoint.timestamp > this.checkpointInterval * 1000) {
        return null
      }

      // Restore session
      const session: Session = {
        ...session,
        messages: checkpoint.messages,
      }
      session.metadata.updatedAt = new Date().toISOString()
      session.metadata.totalTokens = checkpoint.totalTokens

      // Update checkpoint file
      await fs.writeFile(checkpointPath, JSON.stringify({
        timestamp: Date.now(),
        messages: checkpoint.messages,
        totalTokens: checkpoint.totalTokens,
      }, null, 2))

      
      return session
    } catch {
      // Checkpoint file doesn't exist or is invalid
      return null
    }
  }

  /**
   * Find the most recent session
   */
  async findLatestSession(): Promise<Session | null> {
    const sessions = await this.sessionManager.listSessions()
    if (sessions.length === 0) {
      return null
    }

    // Sort by most recent
    sessions.sort((a, b) => 
      new Date(b.metadata.updatedAt).getTime() - new Date(a.metadata.updatedAt).getTime()
    )

    // Find checkpoint file
    const checkpointPath = path.join(this.resumeDir, "checkpoints", `${session.metadata.id}.json`)
    try {
      const content = await fs.readFile(checkpointPath, "utf-8")
      const checkpoint = JSON.parse(content)
      if (Date.now() - checkpoint.timestamp > this.checkpointInterval * 1000) {
        return null
      }
      return {
        session,
        checkpoint,
      }
    } catch {
      return null
    }
  }

  /**
   * Get all resume checkpoints
   */
  listCheckpoints(): string[] {
    const checkpoints: string[] = []
    for (const file of await fs.readdir(this.resumeDir)) {
      try {
        const content = await fs.readFile(path.join(this.resumeDir, file), "utf-8")
        const checkpoint = JSON.parse(content)
        checkpoints.push({
          id: checkpoint.id,
          timestamp: checkpoint.timestamp,
          messages: checkpoint.messages,
          totalTokens: checkpoint.totalTokens,
        })
      } catch {
        // Ignore invalid checkpoint files
      }
    }

    return checkpoints.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

}
