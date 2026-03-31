/**
 * Beast CLI — Session Management
 *
 * Git-backed session storage for conversation history.
 * Inspired by OpenCode's session system.
 */
import * as fs from "fs/promises";
import * as path from "path";
import { execSync } from "child_process";
/**
 * Session Manager - handles git-backed session storage
 */
export class SessionManager {
    projectRoot;
    sessionDir;
    currentSessionId = null;
    messages = [];
    totalInputTokens = 0;
    totalOutputTokens = 0;
    constructor(projectRoot) {
        this.projectRoot = projectRoot || process.cwd();
        this.sessionDir = path.join(this.projectRoot, ".beast", "sessions");
    }
    getProjectRoot() {
        return this.projectRoot;
    }
    /**
     * Create a new session
     */
    async createSession(initialMessage) {
        const id = generateSessionId();
        this.currentSessionId = id;
        this.messages = [];
        this.totalInputTokens = 0;
        this.totalOutputTokens = 0;
        if (initialMessage) {
            this.messages.push({
                role: "user",
                content: initialMessage,
            });
        }
        // Ensure directory exists
        await fs.mkdir(this.sessionDir, { recursive: true });
        // Save initial session
        await this.saveSession();
        // Create git branch for session
        this.createSessionBranch(id);
        return id;
    }
    /**
     * Load an existing session
     */
    async loadSession(sessionId) {
        const sessionPath = path.join(this.sessionDir, `${sessionId}.json`);
        try {
            const content = await fs.readFile(sessionPath, "utf-8");
            const session = JSON.parse(content);
            this.currentSessionId = sessionId;
            this.messages = session.messages;
            this.totalInputTokens = session.metadata.totalTokens?.input || 0;
            this.totalOutputTokens = session.metadata.totalTokens?.output || 0;
            return session;
        }
        catch {
            return null;
        }
    }
    /**
     * Save current session
     */
    async saveSession() {
        if (!this.currentSessionId)
            return;
        const metadata = {
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
        };
        const session = {
            metadata,
            messages: this.messages,
        };
        const sessionPath = path.join(this.sessionDir, `${this.currentSessionId}.json`);
        await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));
    }
    /**
     * Add a message to the current session
     */
    async addMessage(message, tokens) {
        this.messages.push(message);
        if (tokens) {
            this.totalInputTokens += tokens.input;
            this.totalOutputTokens += tokens.output;
        }
        await this.saveSession();
    }
    /**
     * Get current session messages
     */
    getMessages() {
        return [...this.messages];
    }
    /**
     * Get current session ID
     */
    getCurrentSessionId() {
        return this.currentSessionId;
    }
    /**
     * List all sessions
     */
    async listSessions() {
        try {
            const files = await fs.readdir(this.sessionDir);
            const sessions = [];
            for (const file of files) {
                if (file.endsWith(".json")) {
                    const content = await fs.readFile(path.join(this.sessionDir, file), "utf-8");
                    const session = JSON.parse(content);
                    sessions.push(session.metadata);
                }
            }
            return sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        }
        catch {
            return [];
        }
    }
    /**
     * Delete a session
     */
    async deleteSession(sessionId) {
        const sessionPath = path.join(this.sessionDir, `${sessionId}.json`);
        try {
            await fs.unlink(sessionPath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Clear current session
     */
    clearSession() {
        this.currentSessionId = null;
        this.messages = [];
        this.totalInputTokens = 0;
        this.totalOutputTokens = 0;
    }
    /**
     * Export session to markdown
     */
    async exportToMarkdown(sessionId) {
        const id = sessionId || this.currentSessionId;
        if (!id)
            throw new Error("No session to export");
        const session = await this.loadSession(id);
        if (!session)
            throw new Error("Session not found");
        let markdown = `# Beast CLI Session: ${id}\n\n`;
        markdown += `Created: ${session.metadata.createdAt}\n`;
        markdown += `Messages: ${session.metadata.messageCount}\n\n`;
        markdown += `---\n\n`;
        for (const msg of session.messages) {
            const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
            markdown += `### ${role}\n\n${msg.content}\n\n`;
            if (msg.toolCalls && msg.toolCalls.length > 0) {
                markdown += `**Tool Calls:**\n`;
                for (const tc of msg.toolCalls) {
                    markdown += `- ${tc.name}: ${JSON.stringify(tc.arguments)}\n`;
                }
                markdown += `\n`;
            }
        }
        return markdown;
    }
    /**
     * Create a git branch for the session
     */
    createSessionBranch(sessionId) {
        try {
            const branchName = `beast-session-${sessionId}`;
            execSync(`git checkout -b ${branchName} 2>/dev/null || git checkout ${branchName}`, {
                cwd: this.projectRoot,
                stdio: "pipe",
            });
        }
        catch {
            // Git might not be initialized or branch might exist
        }
    }
}
/**
 * Generate a unique session ID
 */
function generateSessionId() {
    const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
    const random = Math.random().toString(36).slice(2, 6);
    return `${timestamp}-${random}`;
}
// Global session manager
let globalSessionManager = null;
export function getSessionManager(projectRoot) {
    if (!globalSessionManager || (projectRoot && globalSessionManager.getProjectRoot() !== projectRoot)) {
        globalSessionManager = new SessionManager(projectRoot);
    }
    return globalSessionManager;
}
//# sourceMappingURL=manager.js.map