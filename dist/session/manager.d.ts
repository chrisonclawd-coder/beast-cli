/**
 * Beast CLI — Session Management
 *
 * Git-backed session storage for conversation history.
 * Inspired by OpenCode's session system.
 */
import type { Message } from "../providers/types";
export interface SessionMetadata {
    id: string;
    createdAt: string;
    updatedAt: string;
    projectRoot: string;
    branch: string;
    messageCount: number;
    totalTokens: {
        input: number;
        output: number;
    };
}
export interface Session {
    metadata: SessionMetadata;
    messages: Message[];
}
/**
 * Session Manager - handles git-backed session storage
 */
export declare class SessionManager {
    private projectRoot;
    private sessionDir;
    private currentSessionId;
    private messages;
    private totalInputTokens;
    private totalOutputTokens;
    constructor(projectRoot?: string);
    getProjectRoot(): string;
    /**
     * Create a new session
     */
    createSession(initialMessage?: string): Promise<string>;
    /**
     * Load an existing session
     */
    loadSession(sessionId: string): Promise<Session | null>;
    /**
     * Save current session
     */
    saveSession(): Promise<void>;
    /**
     * Add a message to the current session
     */
    addMessage(message: Message, tokens?: {
        input: number;
        output: number;
    }): Promise<void>;
    /**
     * Get current session messages
     */
    getMessages(): Message[];
    /**
     * Get current session ID
     */
    getCurrentSessionId(): string | null;
    /**
     * List all sessions
     */
    listSessions(): Promise<SessionMetadata[]>;
    /**
     * Delete a session
     */
    deleteSession(sessionId: string): Promise<boolean>;
    /**
     * Clear current session
     */
    clearSession(): void;
    /**
     * Export session to markdown
     */
    exportToMarkdown(sessionId?: string): Promise<string>;
    /**
     * Create a git branch for the session
     */
    private createSessionBranch;
}
export declare function getSessionManager(projectRoot?: string): SessionManager;
