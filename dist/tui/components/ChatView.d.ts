/**
 * Beast CLI — Chat View Component
 *
 * Renders the message history with streaming support.
 */
import type { ChatMessage, TUIConfig } from "../types";
interface ChatViewProps {
    messages: ChatMessage[];
    config: TUIConfig;
    maxVisible?: number;
}
export declare function ChatView({ messages, config, maxVisible }: ChatViewProps): import("react/jsx-runtime").JSX.Element;
export {};
