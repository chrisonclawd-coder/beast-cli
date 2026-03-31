/**
 * Beast CLI — Web Search Interface
 *
 * Abstract web search with caching.
 * Inspired by OpenCode's web search integration.
 */
export interface WebSearchResult {
    title: string;
    url: string;
    snippet: string;
    content?: string;
    score?: number;
    timestamp?: number;
    cached?: boolean;
}
export interface WebSearchOptions {
    maxResults?: number;
    useCache?: boolean;
    cacheTTL?: number;
    fetchContent?: boolean;
    engine?: string;
}
export interface WebSearchEngine {
    name: string;
    search(query: string, options?: WebSearchOptions): Promise<WebSearchResult[]>;
}
/**
 * Web Search Interface - unified search with caching
 */
export declare class WebSearch {
    private engines;
    private cacheDir;
    private cacheTTL;
    private defaultEngine;
    constructor(config: {
        cacheDir: string;
        cacheTTL?: number;
        defaultEngine?: string;
    });
    /**
     * Register a search engine
     */
    registerEngine(engine: WebSearchEngine): void;
    /**
     * Search the web
     */
    search(query: string, options?: WebSearchOptions): Promise<WebSearchResult[]>;
    /**
     * Get cached results if available and not expired
     */
    private getCachedResults;
    /**
     * Cache search results
     */
    private cacheResults;
    /**
     * Generate cache key from query
     */
    private getCacheKey;
    /**
     * Clear the cache
     */
    clearCache(): Promise<void>;
    /**
     * Get available engines
     */
    getEngines(): string[];
}
/**
 * DuckDuckGo Search Engine (HTML scraping fallback)
 */
export declare class DuckDuckGoEngine implements WebSearchEngine {
    name: string;
    search(query: string, options?: WebSearchOptions): Promise<WebSearchResult[]>;
}
/**
 * Mock Search Engine for testing
 */
export declare class MockSearchEngine implements WebSearchEngine {
    name: string;
    search(query: string, options?: WebSearchOptions): Promise<WebSearchResult[]>;
}
/**
 * Create a web search instance
 */
export declare function createWebSearch(cacheDir?: string): WebSearch;
export declare function getWebSearch(cacheDir?: string): WebSearch;
