/**
 * Beast CLI — Swarm Coordinator
 *
 * Coordinate multiple agents working in parallel.
 * Uses git worktrees for isolation.
 * Inspired by Claude Code's swarm mode.
 */
import type { Agent, AgentResult, SwarmTask, SwarmConfig } from "./types";
export interface SwarmCoordinatorConfig {
    projectRoot: string;
    maxTeammates: number;
    isolation: "worktree" | "directory";
    mergeStrategy: "auto" | "manual";
}
export interface SwarmStatus {
    active: number;
    pending: number;
    completed: number;
    failed: number;
    tasks: SwarmTask[];
}
/**
 * Swarm Coordinator - manages parallel agents
 */
export declare class SwarmCoordinator {
    private config;
    private tasks;
    private agents;
    private worktrees;
    private taskIdCounter;
    constructor(config: SwarmCoordinatorConfig);
    /**
     * Create a new swarm task
     */
    createTask(description: string, agent?: Agent): Promise<SwarmTask>;
    /**
     * Assign an agent to a task
     */
    assignAgent(taskId: string, agent: Agent): void;
    /**
     * Run a task in isolation
     */
    runTask(taskId: string): Promise<AgentResult>;
    /**
     * Run multiple tasks in parallel
     */
    runAll(taskIds?: string[]): Promise<AgentResult[]>;
    /**
     * Get swarm status
     */
    getStatus(): SwarmStatus;
    /**
     * Get a specific task
     */
    getTask(taskId: string): SwarmTask | undefined;
    /**
     * Cancel a running task
     */
    cancelTask(taskId: string): Promise<boolean>;
    /**
     * Merge completed task results
     */
    mergeResults(taskId: string): Promise<boolean>;
    /**
     * Create a git worktree for isolation
     */
    private createWorktree;
    /**
     * Remove a git worktree
     */
    private removeWorktree;
    /**
     * Get the main branch name
     */
    private getMainBranch;
    /**
     * Cleanup all worktrees
     */
    cleanup(): Promise<void>;
}
/**
 * Create a swarm coordinator
 */
export declare function createSwarmCoordinator(projectRoot: string, config?: Partial<SwarmConfig>): SwarmCoordinator;
export declare function getSwarmCoordinator(projectRoot?: string): SwarmCoordinator;
