/**
 * Beast CLI — Init Command
 *
 * Initialize Beast configuration.
 */
import type { CLIContext } from "./program";
interface InitOptions {
    force?: boolean;
    provider?: string;
    model?: string;
}
export declare function initCommand(context: CLIContext, options: InitOptions): Promise<void>;
export {};
