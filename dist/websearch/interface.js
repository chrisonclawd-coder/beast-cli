/**
 * Beast CLI — Web Search Interface
 *
 * Abstract web search with caching.
 * Inspired by OpenCode's web search integration.
 */
import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
/**
 * Web Search Interface - unified search with caching
 */
export class WebSearch {
    engines = new Map();
    cacheDir;
    cacheTTL;
    defaultEngine;
    constructor(config) {
        this.cacheDir = config.cacheDir;
        this.cacheTTL = config.cacheTTL || 3600; // 1 hour default
        this.defaultEngine = config.defaultEngine || "duckduckgo";
    }
    /**
     * Register a search engine
     */
    registerEngine(engine) {
        this.engines.set(engine.name, engine);
    }
    /**
     * Search the web
     */
    async search(query, options) {
        const maxResults = options?.maxResults || 10;
        const useCache = options?.useCache !== false;
        const engine = options?.engine || this.defaultEngine;
        // Check cache first
        if (useCache) {
            const cached = await this.getCachedResults(query, options?.cacheTTL);
            if (cached) {
                return cached.slice(0, maxResults).map(r => ({ ...r, cached: true }));
            }
        }
        // Perform search
        const searchEngine = this.engines.get(engine);
        if (!searchEngine) {
            throw new Error(`Search engine not found: ${engine}`);
        }
        const results = await searchEngine.search(query, options);
        // Cache results
        if (useCache) {
            await this.cacheResults(query, results);
        }
        return results.slice(0, maxResults);
    }
    /**
     * Get cached results if available and not expired
     */
    async getCachedResults(query, ttl) {
        const cacheKey = this.getCacheKey(query);
        const cachePath = path.join(this.cacheDir, `${cacheKey}.json`);
        try {
            const content = await fs.readFile(cachePath, "utf-8");
            const cached = JSON.parse(content);
            const cacheAge = (Date.now() - cached.timestamp) / 1000;
            const maxAge = ttl || this.cacheTTL;
            if (cacheAge < maxAge) {
                return cached.results;
            }
        }
        catch {
            // Cache miss or invalid
        }
        return null;
    }
    /**
     * Cache search results
     */
    async cacheResults(query, results) {
        const cacheKey = this.getCacheKey(query);
        const cachePath = path.join(this.cacheDir, `${cacheKey}.json`);
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
            await fs.writeFile(cachePath, JSON.stringify({
                query,
                results,
                timestamp: Date.now(),
            }));
        }
        catch {
            // Ignore cache errors
        }
    }
    /**
     * Generate cache key from query
     */
    getCacheKey(query) {
        return crypto.createHash("md5").update(query.toLowerCase().trim()).digest("hex");
    }
    /**
     * Clear the cache
     */
    async clearCache() {
        try {
            const files = await fs.readdir(this.cacheDir);
            await Promise.all(files.map(file => fs.unlink(path.join(this.cacheDir, file))));
        }
        catch {
            // Ignore errors
        }
    }
    /**
     * Get available engines
     */
    getEngines() {
        return Array.from(this.engines.keys());
    }
}
/**
 * DuckDuckGo Search Engine (HTML scraping fallback)
 */
export class DuckDuckGoEngine {
    name = "duckduckgo";
    async search(query, options) {
        // This is a placeholder - in production, you'd use DDG API or scrape
        // For now, return a mock result to demonstrate the interface
        const encodedQuery = encodeURIComponent(query);
        return [{
                title: `Search results for: ${query}`,
                url: `https://duckduckgo.com/?q=${encodedQuery}`,
                snippet: `Use web search to find information about: ${query}`,
                score: 1.0,
                timestamp: Date.now(),
            }];
    }
}
/**
 * Mock Search Engine for testing
 */
export class MockSearchEngine {
    name = "mock";
    async search(query, options) {
        return [{
                title: `Mock result for: ${query}`,
                url: "https://example.com",
                snippet: `This is a mock search result for testing purposes.`,
                score: 1.0,
                timestamp: Date.now(),
            }];
    }
}
/**
 * Create a web search instance
 */
export function createWebSearch(cacheDir) {
    const search = new WebSearch({
        cacheDir: cacheDir || path.join(process.cwd(), ".beast", "cache", "search"),
        cacheTTL: 3600,
    });
    // Register default engines
    search.registerEngine(new DuckDuckGoEngine());
    search.registerEngine(new MockSearchEngine());
    return search;
}
// Global web search instance
let globalWebSearch = null;
export function getWebSearch(cacheDir) {
    if (!globalWebSearch) {
        globalWebSearch = createWebSearch(cacheDir);
    }
    return globalWebSearch;
}
//# sourceMappingURL=interface.js.map