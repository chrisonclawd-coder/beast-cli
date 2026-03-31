/**
 * Beast CLI — Cloud Command
 *
 * Cloud delegation commands.
 */
import type { CLIContext } from "./program";
interface CloudOptions {
    action?: string;
    task?: string;
    priority?: string;
}
export declare function cloudCommand(context: CLIContext, options: CloudOptions): Promise<void>;
export {};
