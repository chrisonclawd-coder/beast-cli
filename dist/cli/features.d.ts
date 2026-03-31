/**
 * Beast CLI — Features Command
 *
 * Manage feature flags.
 */
import type { CLIContext } from "./program";
interface FeaturesOptions {
    list?: boolean;
    enable?: boolean;
    disable?: boolean;
    feature?: string;
    value?: string;
}
export declare function featuresCommand(context: CLIContext, options: FeaturesOptions): Promise<void>;
export {};
