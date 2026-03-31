/**
 * Beast CLI — Session Resume
 * Recover interrupted sessions (from Claude Code)
 */
export interface ResumeCheckpoint {
    id: string;
    sessionId: string;
    timestamp: string;
    messages: unknown[];
    totalTokens: number;
    workingDir: string;
    branch: string;
    lastToolCall?: string;
}
export interface ResumeConfig {
    enabled: boolean;
    autoSaveIntervalMs: number;
    maxCheckpoints: number;
    resumeDir: string;
}
export declare const DEFAULT_RESUME_CONFIG: ResumeConfig;
export declare class SessionResume {
    private config;
    constructor(config?: Partial<ResumeConfig>);
    /** Initialize resume directory */
    init(): Promise<void>;
    /** Save a checkpoint */
    saveCheckpoint(checkpoint: ResumeCheckpoint): Promise<void>;
    /** Load a checkpoint by ID */
    loadCheckpoint(id: string): Promise<ResumeCheckpoint | null>;
    /** Find the latest checkpoint for a session */
    findLatest(sessionId?: string): Promise<ResumeCheckpoint | null>;
    /** List all checkpoints */
    listCheckpoints(): Promise<ResumeCheckpoint[]>;
    /** Delete a checkpoint */
    deleteCheckpoint(id: string): Promise<boolean>;
    /** Prune old checkpoints beyond maxCheckpoints */
    private pruneCheckpoints;
}
