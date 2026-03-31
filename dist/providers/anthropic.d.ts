/**
 * Beast CLI — Anthropic Provider
 *
 * Anthropic Claude API integration.
 * Inspired by OpenCode's Anthropic provider.
 */
import type { Provider, ProviderConfig, Model, Message, CompleteOptions, CompleteResponse, ResponseChunk } from "./types";
export declare class AnthropicProvider implements Provider {
    readonly id = "anthropic";
    readonly name = "Anthropic";
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
export declare function createAnthropicProvider(config?: ProviderConfig): Provider;
