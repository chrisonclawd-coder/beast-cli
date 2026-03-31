/**
 * Beast CLI — Resume Command
 * 
 * Resume a previous session.
 */

import type { CLIContext } from "./program"
import { getSessionManager } from "../session"
import { createLogger } from "../utils"

const logger = createLogger({ prefix: "cli:resume" })

interface ResumeOptions {
  list?: boolean
  latest?: boolean
  sessionId?: string
}

export async function resumeCommand(
  context: CLIContext,
  options: ResumeOptions
): Promise<void> {
  const sessionManager = getSessionManager(context.projectRoot)
  
  // List sessions
  if (options.list) {
    const sessions = await sessionManager.listSessions()
    
    console.log("🦁 Available Sessions:")
    console.log("")
    
    if (sessions.length === 0) {
      console.log("  No saved sessions found.")
      return
    }
    
    for (const session of sessions.slice(0, 10)) {
      const date = new Date(session.timestamp).toLocaleString()
      console.log(`  ${session.id.slice(0, 8)}  ${date}  ${session.messageCount} messages`)
    }
    
    if (sessions.length > 10) {
      console.log(`  ... and ${sessions.length - 10} more`)
    }
    
    return
  }
  
  // Resume latest
  if (options.latest) {
    const sessions = await sessionManager.listSessions()
    if (sessions.length === 0) {
      console.log("No saved sessions found.")
      return
    }
    
    const latest = sessions[0]
    console.log(`🦁 Resuming session ${latest.id.slice(0, 8)}...`)
    console.log("")
    // Would load and continue session
    return
  }
  
  // Resume specific session
  if (options.sessionId) {
    console.log(`🦁 Resuming session ${options.sessionId}...`)
    console.log("")
    // Would load and continue session
    return
  }
  
  // Default: show usage
  console.log("🦁 Session Resume")
  console.log("")
  console.log("Options:")
  console.log("  --list              List available sessions")
  console.log("  --latest            Resume most recent session")
  console.log("  <session-id>        Resume specific session")
}
