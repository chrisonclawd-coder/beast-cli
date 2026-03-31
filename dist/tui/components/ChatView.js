import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from "ink";
export function ChatView({ messages, config, maxVisible = 50 }) {
    // Show only last N messages to prevent overflow
    const visibleMessages = messages.slice(-maxVisible);
    return (_jsx(Box, { flexDirection: "column", padding: 1, children: visibleMessages.map((msg) => (_jsx(MessageView, { message: msg, config: config }, msg.id))) }));
}
function MessageView({ message, config }) {
    const roleColor = getRoleColor(message.role);
    const roleLabel = getRoleLabel(message.role);
    const timestamp = config.showTimestamps
        ? `[${message.timestamp.toLocaleTimeString()}] `
        : "";
    return (_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsxs(Box, { children: [_jsxs(Text, { bold: true, color: roleColor, children: [timestamp, roleLabel] }), message.tokens && config.showTokens && (_jsxs(Text, { dimColor: true, children: [" ", "(", message.tokens.input, "i/", message.tokens.output, "o)"] })), message.streaming && (_jsx(Text, { color: "cyan", children: " \u25CF" }))] }), _jsxs(Box, { marginLeft: 2, flexDirection: "column", children: [_jsx(ContentRenderer, { content: message.content, compact: config.compactMode }), config.showToolCalls && message.toolCalls && message.toolCalls.length > 0 && (_jsx(Box, { flexDirection: "column", marginTop: 1, children: message.toolCalls.map((tc, i) => (_jsx(ToolCallView, { toolCall: tc }, i))) }))] })] }));
}
function ContentRenderer({ content, compact }) {
    // Basic content rendering - can be enhanced with markdown support
    const lines = content.split("\n");
    const maxLines = compact ? 10 : lines.length;
    const displayLines = lines.slice(0, maxLines);
    const hasMore = lines.length > maxLines;
    return (_jsxs(Box, { flexDirection: "column", children: [displayLines.map((line, i) => (_jsx(Text, { wrap: "wrap", children: line || " " }, i))), hasMore && (_jsxs(Text, { dimColor: true, children: ["... (", lines.length - maxLines, " more lines)"] }))] }));
}
function ToolCallView({ toolCall }) {
    const statusColor = toolCall.result?.success ? "green" :
        toolCall.result ? "red" : "yellow";
    const statusIcon = toolCall.result?.success ? "✓" :
        toolCall.result ? "✗" : "○";
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsxs(Text, { color: statusColor, children: [statusIcon, " "] }), _jsx(Text, { bold: true, children: toolCall.tool })] }), _jsx(Box, { marginLeft: 2, children: _jsxs(Text, { dimColor: true, children: [JSON.stringify(toolCall.params).slice(0, 60), JSON.stringify(toolCall.params).length > 60 && "..."] }) })] }));
}
function getRoleColor(role) {
    switch (role) {
        case "user": return "green";
        case "assistant": return "blue";
        case "system": return "gray";
        default: return "white";
    }
}
function getRoleLabel(role) {
    switch (role) {
        case "user": return "You";
        case "assistant": return "Beast";
        case "system": return "System";
        default: return role;
    }
}
//# sourceMappingURL=ChatView.js.map