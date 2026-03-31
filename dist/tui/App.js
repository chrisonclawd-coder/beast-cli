import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Beast CLI — Main TUI App
 *
 * The main Ink application for Beast CLI.
 */
import { useState, useCallback } from "react";
import { Box, Text, useApp, useInput } from "ink";
import { ChatView } from "./components/ChatView";
import { InputBar } from "./components/InputBar";
export function BeastApp({ provider, model, tools, systemPrompt, config, onExit }) {
    const { exit } = useApp();
    const [messages, setMessages] = useState([]);
    const [state, setState] = useState("idle");
    const [tokenUsage, setTokenUsage] = useState({ input: 0, output: 0 });
    const [error, setError] = useState(null);
    const [currentTool, setCurrentTool] = useState(null);
    // Generate unique message IDs
    const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    // Handle user input submission
    const handleSubmit = useCallback(async (input) => {
        if (state !== "idle")
            return;
        // Add user message
        const userMessage = {
            id: generateId(),
            role: "user",
            content: input,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setState("thinking");
        setError(null);
        try {
            // Build conversation history
            const conversation = [
                ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
                ...messages.map(m => ({
                    role: m.role,
                    content: m.content,
                })),
                { role: "user", content: input },
            ];
            // Create assistant message placeholder
            const assistantId = generateId();
            setMessages(prev => [...prev, {
                    id: assistantId,
                    role: "assistant",
                    content: "",
                    timestamp: new Date(),
                    streaming: true,
                }]);
            setState("streaming");
            // Stream response
            let fullContent = "";
            for await (const chunk of provider.stream(conversation, {
                model,
                tools: tools.map(t => ({
                    name: t.name,
                    description: t.description,
                    parameters: {},
                })),
            })) {
                switch (chunk.type) {
                    case "text":
                        fullContent += chunk.content || "";
                        setMessages(prev => prev.map(m => m.id === assistantId
                            ? { ...m, content: fullContent }
                            : m));
                        break;
                    case "tool_call":
                        setState("tool_call");
                        setCurrentTool(chunk.toolCall?.name || null);
                        // Tool call handling would go here
                        break;
                    case "done":
                        if (chunk.usage) {
                            setTokenUsage(prev => ({
                                input: prev.input + chunk.usage.inputTokens,
                                output: prev.output + chunk.usage.outputTokens,
                            }));
                            setMessages(prev => prev.map(m => m.id === assistantId
                                ? {
                                    ...m,
                                    streaming: false,
                                    tokens: {
                                        input: chunk.usage.inputTokens,
                                        output: chunk.usage.outputTokens
                                    }
                                }
                                : m));
                        }
                        break;
                }
            }
            setState("idle");
            setCurrentTool(null);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            setState("idle");
            // Remove the failed assistant message
            setMessages(prev => prev.filter(m => !m.streaming));
        }
    }, [state, messages, provider, model, tools, systemPrompt]);
    // Handle global key input
    useInput((input, key) => {
        if (key.escape && state === "idle") {
            exit();
            onExit?.();
        }
        if (input === "c" && key.ctrl) {
            exit();
            onExit?.();
        }
    });
    // Status bar
    const StatusBar = () => (_jsxs(Box, { justifyContent: "space-between", borderStyle: "single", borderColor: "blue", padding: 1, children: [_jsxs(Box, { children: [_jsx(Text, { bold: true, color: "blue", children: "\uD83E\uDD81 Beast" }), _jsxs(Text, { dimColor: true, children: [" | ", model] })] }), _jsx(Box, { children: _jsxs(Text, { dimColor: true, children: ["Tokens: ", tokenUsage.input, "i/", tokenUsage.output, "o"] }) })] }));
    // Error display
    const ErrorDisplay = () => error ? (_jsx(Box, { borderStyle: "double", borderColor: "red", padding: 1, children: _jsxs(Text, { color: "red", children: ["Error: ", error] }) })) : null;
    return (_jsxs(Box, { flexDirection: "column", height: "100%", children: [_jsx(StatusBar, {}), _jsxs(Box, { flexGrow: 1, flexDirection: "column", overflow: "hidden", children: [_jsx(ChatView, { messages: messages, config: config }), _jsx(ErrorDisplay, {})] }), _jsx(InputBar, { onSubmit: handleSubmit, state: state, config: config, placeholder: "Ask the Beast..." })] }));
}
//# sourceMappingURL=App.js.map