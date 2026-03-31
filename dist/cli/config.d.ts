/**
 * Beast CLI — Config Command
 *
 * Manage configuration.
 */
import type { CLIContext } from "./program";
interface ConfigOptions {
    list?: boolean;
    edit?: boolean;
    reset?: boolean;
    key?: string;
    value?: string;
}
export declare function configCommand(context: CLIContext, options: ConfigOptions): Promise<void>;
export {};
