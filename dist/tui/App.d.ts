/**
 * Beast CLI — Main TUI App
 *
 * The main Ink application for Beast CLI.
 */
import type { TUIConfig } from "./types";
import type { Provider } from "../providers/types";
import type { Tool } from "../tools/types";
interface BeastAppProps {
    provider: Provider;
    model: string;
    tools: Tool[];
    systemPrompt?: string;
    config: TUIConfig;
    onExit?: () => void;
}
export declare function BeastApp({ provider, model, tools, systemPrompt, config, onExit }: BeastAppProps): import("react/jsx-runtime").JSX.Element;
export {};
