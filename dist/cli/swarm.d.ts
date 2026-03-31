/**
 * Beast CLI — Swarm Command
 *
 * Manage swarm mode for parallel agent execution.
 */
import type { CLIContext } from "./program";
interface SwarmOptions {
    action?: string;
    count?: string;
    worktree?: boolean;
}
export declare function swarmCommand(context: CLIContext, options: SwarmOptions): Promise<void>;
export {};
