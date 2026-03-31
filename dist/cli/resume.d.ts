/**
 * Beast CLI — Resume Command
 *
 * Resume a previous session.
 */
import type { CLIContext } from "./program";
interface ResumeOptions {
    list?: boolean;
    latest?: boolean;
    sessionId?: string;
}
export declare function resumeCommand(context: CLIContext, options: ResumeOptions): Promise<void>;
export {};
