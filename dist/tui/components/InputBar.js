import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Beast CLI — Input Component
 *
 * Handles user input with vim mode support.
 */
import { useState, useCallback } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
export function InputBar({ onSubmit, state, config, placeholder }) {
    const [input, setInput] = useState("");
    const [vimMode, setVimMode] = useState(config.vimMode ? "normal" : "insert");
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const handleSubmit = useCallback((value) => {
        if (!value.trim())
            return;
        // Add to history
        setHistory(prev => [...prev, value]);
        setHistoryIndex(-1);
        onSubmit(value);
        setInput("");
    }, [onSubmit]);
    const handleVimKey = useCallback((key) => {
        if (!config.vimMode)
            return false;
        switch (key) {
            case "escape":
                if (vimMode === "insert") {
                    setVimMode("normal");
                    return true;
                }
                break;
            case "i":
                if (vimMode === "normal") {
                    setVimMode("insert");
                    return true;
                }
                break;
            case "k":
                if (vimMode === "normal" && history.length > 0) {
                    const newIndex = Math.min(historyIndex + 1, history.length - 1);
                    setHistoryIndex(newIndex);
                    setInput(history[history.length - 1 - newIndex] || "");
                    return true;
                }
                break;
            case "j":
                if (vimMode === "normal" && historyIndex > 0) {
                    const newIndex = historyIndex - 1;
                    setHistoryIndex(newIndex);
                    setInput(history[history.length - 1 - newIndex] || "");
                    return true;
                }
                break;
        }
        return false;
    }, [config.vimMode, vimMode, history, historyIndex]);
    const getStatusIndicator = () => {
        switch (state) {
            case "thinking":
                return _jsx(Text, { color: "yellow", children: "\u25CF Thinking..." });
            case "streaming":
                return _jsx(Text, { color: "cyan", children: "\u25CF Streaming..." });
            case "tool_call":
                return _jsx(Text, { color: "blue", children: "\u25CF Running tool..." });
            case "waiting_input":
                return _jsx(Text, { color: "magenta", children: "\u25CF Waiting for input..." });
            default:
                return null;
        }
    };
    const isDisabled = state === "thinking" || state === "tool_call";
    const showInput = vimMode === "insert" || !config.vimMode;
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: "gray", padding: 1, children: [_jsxs(Box, { justifyContent: "space-between", children: [getStatusIndicator(), config.vimMode && (_jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "-- " }), _jsx(Text, { color: vimMode === "insert" ? "green" : "blue", children: vimMode.toUpperCase() }), _jsx(Text, { dimColor: true, children: " --" })] }))] }), _jsxs(Box, { marginTop: 1, children: [_jsx(Text, { bold: true, color: "green", children: "\u276F " }), showInput ? (_jsx(TextInput, { value: input, onChange: setInput, onSubmit: handleSubmit, placeholder: isDisabled ? "Waiting..." : (placeholder || "Type your message..."), showCursor: !isDisabled })) : (_jsx(Text, { dimColor: true, children: "-- Press 'i' to insert, 'k/j' for history --" }))] }), state === "idle" && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: config.vimMode
                        ? "[i]nsert [Esc]normal [k/j]history"
                        : "Enter to send, Ctrl+C to exit" }) }))] }));
}
//# sourceMappingURL=InputBar.js.map