/**
 * Beast CLI — OpenAI Provider
 *
 * OpenAI API integration (GPT-4, o1, o3, etc.)
 * Inspired by OpenCode's OpenAI provider.
 */
import type { Provider, ProviderConfig, Model, Message, CompleteOptions, CompleteResponse, ResponseChunk } from "./types";
export declare class OpenAIProvider implements Provider {
    readonly id = "openai";
    readonly name = "OpenAI";
    private apiKey;
    private baseUrl;
    private defaultModel;
    constructor(config?: ProviderConfig);
    listModels(): Promise<Model[]>;
    complete(messages: Message[], options?: CompleteOptions): Promise<CompleteResponse>;
    stream(messages: Message[], options?: CompleteOptions): AsyncIterableIterator<ResponseChunk>;
    private convertMessages;
    private convertTools;
}
export declare function createOpenAIProvider(config?: ProviderConfig): Provider;
