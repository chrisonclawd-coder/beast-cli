/**
 * Beast CLI — Session Management
 * 
 * Git-backed session storage for conversation history.
 * Inspired by OpenCode's session system.
 */

import * as fs from "fs/promises"
import * as path from "path"
import { execSync } from "child_process"
import type { Message } from "../providers/types"

export interface SessionMetadata {
  id: string
  createdAt: string
  updatedAt: string
  projectRoot: string
  branch: string
  messageCount: number
  totalTokens: { input: number; output: number }
}

export interface Session {
  metadata: SessionMetadata
  messages: Message[]
}

/**
 * Session Manager - handles git-backed session storage
 */
export class SessionManager {
  private projectRoot: string
  private sessionDir: string
  private currentSessionId: string | null = null
  private messages: Message[] = []
  private totalInputTokens = 0
  private totalOutputTokens = 0

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd()
    this.sessionDir = path.join(this.projectRoot, ".beast", "sessions")
  }

  getProjectRoot(): string {
    return this.projectRoot
  }

  /**
   * Create a new session
   */
  async createSession(initialMessage?: string): Promise<string> {
    const id = generateSessionId()
    this.currentSessionId = id
    this.messages = []
    this.totalInputTokens = 0
    this.totalOutputTokens = 0

    if (initialMessage) {
      this.messages.push({
        role: "user",
        content: initialMessage,
      })
    }

    // Ensure directory exists
    await fs.mkdir(this.sessionDir, { recursive: true })

    // Save initial session
    await this.saveSession()

    // Create git branch for session
    this.createSessionBranch(id)

    return id
  }

  /**
   * Load an existing session
   */
  async loadSession(sessionId: string): Promise<Session | null>{
    const sessionPath = path.join(this.sessionDir, `${sessionId}.json`)
    
    try {
      const content = await fs.readFile(sessionPath, "utf-8")
      const session: Session = JSON.parse(content)
      
      this.currentSessionId = sessionId
      this.messages = session.messages
      this.totalInputTokens = session.metadata.totalTokens?.input || 0
      this.totalOutputTokens = session.metadata.totalTokens?.output || 0
      
      return session
    } catch {
      return null
    }
  }

  /**
   * Save current session
   */
  async saveSession(): Promise<void>{
    if (!this.currentSessionId) return

    const metadata: SessionMetadata = {
      id: this.currentSessionId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectRoot: this.projectRoot,
      branch: `beast-session-${this.currentSessionId}`,
      messageCount: this.messages.length,
      totalTokens: {
        input: this.totalInputTokens,
        output: this.totalOutputTokens,
      },
    }

    const session: Session = {
      metadata,
      messages: this.messages,
    }

    const sessionPath = path.join(this.sessionDir, `${this.currentSessionId}.json`)
    await fs.writeFile(sessionPath, JSON.stringify(session, null, 2))
  }

  /**
   * Add a message to the current session
   */
  async addMessage(message: Message, tokens?: { input: number; output: number }): Promise<void>{
    this.messages.push(message)
    
    if (tokens) {
      this.totalInputTokens += tokens.input
      this.totalOutputTokens += tokens.output
    }

    await this.saveSession()
  }

  /**
   * Get current session messages
   */
  getMessages(): Message[]{
    return [...this.messages]
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null{
    return this.currentSessionId
  }

  /**
   * List all sessions
   */
  async listSessions(): Promise<SessionMetadata[]>{
    try{
      const files = await fs.readdir(this.sessionDir)
      const sessions: SessionMetadata[] = []

      for (const file of files){
        if (file.endsWith(".json")){
          const content = await fs.readFile(path.join(this.sessionDir, file), "utf-8")
          const session: Session = JSON.parse(content)
          sessions.push(session.metadata)
        }
      }

      return sessions.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    } catch{
      return []
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<boolean>{
    const sessionPath = path.join(this.sessionDir, `${sessionId}.json`)
    
    try{
      await fs.unlink(sessionPath)
      return true
    } catch{
      return false
    }
  }

  /**
   * Clear current session
   */
  clearSession(): void{
    this.currentSessionId = null
    this.messages = []
    this.totalInputTokens = 0
    this.totalOutputTokens = 0
  }

  /**
   * Export session to markdown
   */
  async exportToMarkdown(sessionId?: string): Promise<string>{
    const id = sessionId || this.currentSessionId
    if (!id) throw new Error("No session to export")

    const session = await this.loadSession(id)
    if (!session) throw new Error("Session not found")

    let markdown = `# Beast CLI Session: ${id}\n\n`
    markdown += `Created: ${session.metadata.createdAt}\n`
    markdown += `Messages: ${session.metadata.messageCount}\n\n`
    markdown += `---\n\n`

    for (const msg of session.messages){
      const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1)
      markdown += `### ${role}\n\n${msg.content}\n\n`
      
      if (msg.toolCalls && msg.toolCalls.length > 0){
        markdown += `**Tool Calls:**\n`
        for (const tc of msg.toolCalls){
          markdown += `- ${tc.name}: ${JSON.stringify(tc.arguments)}\n`
        }
        markdown += `\n`
      }
    }

    return markdown
  }

  /**
   * Create a git branch for the session
   */
  private createSessionBranch(sessionId: string): void{
    try{
      const branchName = `beast-session-${sessionId}`
      execSync(`git checkout -b ${branchName} 2>/dev/null || git checkout ${branchName}`, {
        cwd: this.projectRoot,
        stdio: "pipe",
      })
    } catch{
      // Git might not be initialized or branch might exist
    }
  }
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string{
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-")
  const random = Math.random().toString(36).slice(2, 6)
  return `${timestamp}-${random}`
}

// Global session manager
let globalSessionManager: SessionManager | null = null

export function getSessionManager(projectRoot?: string): SessionManager {
  if (!globalSessionManager || (projectRoot && globalSessionManager.getProjectRoot() !== projectRoot)) {
    globalSessionManager = new SessionManager(projectRoot)
  }
  return globalSessionManager
}
