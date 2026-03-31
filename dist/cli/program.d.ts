/**
 * Beast CLI — CLI Program
 *
 * Main CLI program using commander.
 */
import { Command } from "commander";
import type { BeastConfig } from "../config";
export interface CLIContext {
    config: BeastConfig;
    projectRoot: string;
}
/**
 * Create the CLI program
 */
export declare function createProgram(): Command;
/**
 * Register all commands with the program
 */
export declare function registerCommands(program: Command, context?: Partial<CLIContext>): void;
