/**
 * Beast CLI — Google Gemini Provider
 *
 * Google Gemini API integration.
 * Inspired by Gemini CLI's free tier design.
 */
// Known Gemini models
const GEMINI_MODELS = [
    {
        id: "gemini-2.5-pro-preview-06-05",
        name: "Gemini 2.5 Pro",
        contextWindow: 1048576,
        maxOutputTokens: 65536,
        supportsStreaming: true,
        supportsToolCalls: true,
        supportsVision: true,
    },
    {
        id: "gemini-2.5-flash-preview-05-20",
        name: "Gemini 2.5 Flash",
        contextWindow: 1048576,
        maxOutputTokens: 65536,
        supportsStreaming: true,
        supportsToolCalls: true,
        supportsVision: true,
    },
    {
        id: "gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        contextWindow: 1048576,
        maxOutputTokens: 8192,
        supportsStreaming: true,
        supportsToolCalls: true,
        supportsVision: true,
    },
    {
        id: "gemini-2.0-flash-lite",
        name: "Gemini 2.0 Flash Lite",
        contextWindow: 1048576,
        maxOutputTokens: 8192,
        supportsStreaming: true,
        supportsToolCalls: true,
        supportsVision: true,
    },
    {
        id: "gemini-3.0-flash",
        name: "Gemini 3.0 Flash",
        contextWindow: 1048576,
        maxOutputTokens: 65536,
        supportsStreaming: true,
        supportsToolCalls: true,
        supportsVision: true,
    },
];
export class GoogleProvider {
    id = "google";
    name = "Google Gemini";
    apiKey;
    baseUrl;
    defaultModel;
    constructor(config = {}) {
        this.apiKey = config.apiKey ||
            process.env.GEMINI_API_KEY ||
            process.env.GOOGLE_API_KEY ||
            process.env.GOOGLE_GENAI_API_KEY || "";
        this.baseUrl = config.baseUrl || "https://generativelanguage.googleapis.com/v1beta";
        this.defaultModel = config.model || "gemini-2.5-flash-preview-05-20";
        if (!this.apiKey) {
            console.warn("Google API key not set. Set GEMINI_API_KEY environment variable.");
        }
    }
    async listModels() {
        return GEMINI_MODELS;
    }
    async complete(messages, options) {
        const model = options?.model || this.defaultModel;
        const request = this.buildRequest(messages, options);
        const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
            signal: options?.signal,
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Google API error: ${response.status} - ${error}`);
        }
        const data = await response.json();
        const candidate = data.candidates?.[0];
        if (!candidate) {
            throw new Error("No response from Gemini");
        }
        // Extract text and function calls
        let content = "";
        const toolCalls = [];
        for (const part of candidate.content.parts) {
            if (part.text) {
                content += part.text;
            }
            if (part.functionCall) {
                toolCalls.push({
                    id: `fc_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                    name: part.functionCall.name,
                    arguments: part.functionCall.args || {},
                });
            }
        }
        return {
            content,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
            usage: {
                inputTokens: data.usageMetadata?.promptTokenCount || 0,
                outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
            },
            model,
        };
    }
    async *stream(messages, options) {
        const model = options?.model || this.defaultModel;
        const request = this.buildRequest(messages, options);
        const url = `${this.baseUrl}/models/${model}:streamGenerateContent?key=${this.apiKey}&alt=sse`;
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
            signal: options?.signal,
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Google API error: ${response.status} - ${error}`);
        }
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error("No response body");
        }
        const decoder = new TextDecoder();
        let buffer = "";
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";
                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const data = line.slice(6);
                        try {
                            const parsed = JSON.parse(data);
                            const candidate = parsed.candidates?.[0];
                            if (candidate?.content?.parts) {
                                for (const part of candidate.content.parts) {
                                    if (part.text) {
                                        yield { type: "text", content: part.text };
                                    }
                                    if (part.functionCall) {
                                        yield {
                                            type: "tool_call",
                                            toolCall: {
                                                id: `fc_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                                                name: part.functionCall.name,
                                                arguments: part.functionCall.args || {},
                                            },
                                        };
                                    }
                                }
                            }
                            if (parsed.usageMetadata) {
                                yield {
                                    type: "done",
                                    usage: {
                                        inputTokens: parsed.usageMetadata.promptTokenCount,
                                        outputTokens: parsed.usageMetadata.candidatesTokenCount,
                                    },
                                };
                            }
                        }
                        catch {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
        yield { type: "done" };
    }
    buildRequest(messages, options) {
        const contents = [];
        let systemInstruction;
        for (const msg of messages) {
            if (msg.role === "system") {
                systemInstruction = msg.content;
                continue;
            }
            const role = msg.role === "assistant" ? "model" : "user";
            const parts = [];
            if (msg.role === "tool" && msg.toolCallId) {
                // Tool result - Gemini uses functionResponse
                parts.push({
                    functionResponse: {
                        name: msg.toolCallId,
                        response: { result: msg.content },
                    },
                });
            }
            else if (msg.toolCalls && msg.toolCalls.length > 0) {
                // Model response with function calls
                if (msg.content) {
                    parts.push({ text: msg.content });
                }
                for (const tc of msg.toolCalls) {
                    parts.push({
                        functionCall: {
                            name: tc.name,
                            args: tc.arguments,
                        },
                    });
                }
            }
            else {
                parts.push({ text: msg.content });
            }
            contents.push({ role, parts });
        }
        const request = {
            contents,
            generationConfig: {
                maxOutputTokens: options?.maxTokens || 8192,
                temperature: options?.temperature,
            },
        };
        // System instruction
        if (options?.systemPrompt || systemInstruction) {
            request.systemInstruction = {
                parts: [{ text: options?.systemPrompt || systemInstruction || "" }],
            };
        }
        // Tools
        if (options?.tools && options.tools.length > 0) {
            request.tools = [{
                    functionDeclarations: options.tools.map((tool) => ({
                        name: tool.name,
                        description: tool.description,
                        parameters: tool.parameters,
                    })),
                }];
        }
        return request;
    }
}
// Factory function
export function createGoogleProvider(config = {}) {
    return new GoogleProvider(config);
}
//# sourceMappingURL=google.js.map