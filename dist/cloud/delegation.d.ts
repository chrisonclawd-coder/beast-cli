/**
 * Beast CLI — Cloud Delegation Interface
 * Offload tasks to cloud providers (from Codex CLI / Claude Code)
 */
export interface CloudProviderConfig {
    name: string;
    endpoint: string;
    apiKey?: string;
}
export interface CloudConfig {
    enabled: boolean;
    provider: CloudProviderConfig;
    maxConcurrent: number;
    timeout: number;
    projectRoot: string;
    maxFileSize: number;
    retryOnFailure: boolean;
    maxRetries: number;
}
export interface CloudTask {
    id: string;
    description: string;
    status: "pending" | "running" | "done" | "failed";
    result?: {
        content: string;
    };
    error?: string;
    createdAt: string;
    completedAt?: string;
}
export declare const DEFAULT_CLOUD_CONFIG: CloudConfig;
/**
 * Cloud Delegation Manager
 */
export declare class CloudDelegation {
    private config;
    private tasks;
    private taskIdCounter;
    constructor(config?: Partial<CloudConfig>);
    /** Submit a task to the cloud */
    submitTask(description: string, _context?: Record<string, unknown>): Promise<string>;
    /** Wait for a task to complete */
    waitForTask(taskId: string, timeoutMs?: number): Promise<{
        content: string;
    }>;
    /** Check task status */
    private checkTaskStatus;
    /** Cancel a running task */
    cancelTask(taskId: string): Promise<boolean>;
    /** List all tasks */
    listTasks(): CloudTask[];
    /** Clear completed/failed tasks */
    clearCompleted(): void;
}
