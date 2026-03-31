/**
 * Beast CLI — Input Component
 *
 * Handles user input with vim mode support.
 */
import type { TUIState, TUIConfig } from "../types";
interface InputBarProps {
    onSubmit: (input: string) => void;
    state: TUIState;
    config: TUIConfig;
    placeholder?: string;
}
export declare function InputBar({ onSubmit, state, config, placeholder }: InputBarProps): import("react/jsx-runtime").JSX.Element;
export {};
