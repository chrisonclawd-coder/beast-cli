/**
 * Beast CLI — Google Gemini Provider
 *
 * Google Gemini API integration.
 * Inspired by Gemini CLI's free tier design.
 */
import type { Provider, ProviderConfig, Model, Message, CompleteOptions, CompleteResponse, ResponseChunk } from "./types";
export declare class GoogleProvider implements Provider {
    readonly id = "google";
    readonly name = "Google Gemini";
    private apiKey;
    private baseUrl;
    private defaultModel;
    constructor(config?: ProviderConfig);
    listModels(): Promise<Model[]>;
    complete(messages: Message[], options?: CompleteOptions): Promise<CompleteResponse>;
    stream(messages: Message[], options?: CompleteOptions): AsyncIterableIterator<ResponseChunk>;
    private buildRequest;
}
export declare function createGoogleProvider(config?: ProviderConfig): Provider;
