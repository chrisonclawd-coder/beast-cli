/**
 * Beast CLI — Web Search Interface
 * 
 * Abstract web search with caching.
 * Inspired by OpenCode's web search integration.
 */

import * as fs from "fs/promises"
import * as path from "path"
import * as crypto from "crypto"

export interface WebSearchResult {
  title: string
  url: string
  snippet: string
  content?: string
  score?: number
  timestamp?: number
  cached?: boolean
}

export interface WebSearchOptions {
  maxResults?: number
  useCache?: boolean
  cacheTTL?: number // seconds
  fetchContent?: boolean
  engine?: string
}

export interface WebSearchEngine {
  name: string
  search(query: string, options?: WebSearchOptions): Promise<WebSearchResult[]>
}

/**
 * Web Search Interface - unified search with caching
 */
export class WebSearch {
  private engines: Map<string, WebSearchEngine> = new Map()
  private cacheDir: string
  private cacheTTL: number
  private defaultEngine: string

  constructor(config: { cacheDir: string; cacheTTL?: number; defaultEngine?: string }) {
    this.cacheDir = config.cacheDir
    this.cacheTTL = config.cacheTTL || 3600 // 1 hour default
    this.defaultEngine = config.defaultEngine || "duckduckgo"
  }

  /**
   * Register a search engine
   */
  registerEngine(engine: WebSearchEngine): void {
    this.engines.set(engine.name, engine)
  }

  /**
   * Search the web
   */
  async search(query: string, options?: WebSearchOptions): Promise<WebSearchResult[]> {
    const maxResults = options?.maxResults || 10
    const useCache = options?.useCache !== false
    const engine = options?.engine || this.defaultEngine

    // Check cache first
    if (useCache) {
      const cached = await this.getCachedResults(query, options?.cacheTTL)
      if (cached) {
        return cached.slice(0, maxResults).map(r => ({ ...r, cached: true }))
      }
    }

    // Perform search
    const searchEngine = this.engines.get(engine)
    if (!searchEngine) {
      throw new Error(`Search engine not found: ${engine}`)
    }

    const results = await searchEngine.search(query, options)

    // Cache results
    if (useCache) {
      await this.cacheResults(query, results)
    }

    return results.slice(0, maxResults)
  }

  /**
   * Get cached results if available and not expired
   */
  private async getCachedResults(query: string, ttl?: number): Promise<WebSearchResult[] | null> {
    const cacheKey = this.getCacheKey(query)
    const cachePath = path.join(this.cacheDir, `${cacheKey}.json`)

    try {
      const content = await fs.readFile(cachePath, "utf-8")
      const cached = JSON.parse(content)

      const cacheAge = (Date.now() - cached.timestamp) / 1000
      const maxAge = ttl || this.cacheTTL

      if (cacheAge < maxAge) {
        return cached.results
      }
    } catch {
      // Cache miss or invalid
    }

    return null
  }

  /**
   * Cache search results
   */
  private async cacheResults(query: string, results: WebSearchResult[]): Promise<void> {
    const cacheKey = this.getCacheKey(query)
    const cachePath = path.join(this.cacheDir, `${cacheKey}.json`)

    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
      await fs.writeFile(cachePath, JSON.stringify({
        query,
        results,
        timestamp: Date.now(),
      }))
    } catch {
      // Ignore cache errors
    }
  }

  /**
   * Generate cache key from query
   */
  private getCacheKey(query: string): string {
    return crypto.createHash("md5").update(query.toLowerCase().trim()).digest("hex")
  }

  /**
   * Clear the cache
   */
  async clearCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir)
      await Promise.all(
        files.map(file => fs.unlink(path.join(this.cacheDir, file)))
      )
    } catch {
      // Ignore errors
    }
  }

  /**
   * Get available engines
   */
  getEngines(): string[] {
    return Array.from(this.engines.keys())
  }
}

/**
 * DuckDuckGo Search Engine (HTML scraping fallback)
 */
export class DuckDuckGoEngine implements WebSearchEngine {
  name = "duckduckgo"

  async search(query: string, options?: WebSearchOptions): Promise<WebSearchResult[]> {
    // This is a placeholder - in production, you'd use DDG API or scrape
    // For now, return a mock result to demonstrate the interface
    const encodedQuery = encodeURIComponent(query)
    
    return [{
      title: `Search results for: ${query}`,
      url: `https://duckduckgo.com/?q=${encodedQuery}`,
      snippet: `Use web search to find information about: ${query}`,
      score: 1.0,
      timestamp: Date.now(),
    }]
  }
}

/**
 * Mock Search Engine for testing
 */
export class MockSearchEngine implements WebSearchEngine {
  name = "mock"

  async search(query: string, options?: WebSearchOptions): Promise<WebSearchResult[]> {
    return [{
      title: `Mock result for: ${query}`,
      url: "https://example.com",
      snippet: `This is a mock search result for testing purposes.`,
      score: 1.0,
      timestamp: Date.now(),
    }]
  }
}

/**
 * Create a web search instance
 */
export function createWebSearch(cacheDir?: string): WebSearch {
  const search = new WebSearch({
    cacheDir: cacheDir || path.join(process.cwd(), ".beast", "cache", "search"),
    cacheTTL: 3600,
  })

  // Register default engines
  search.registerEngine(new DuckDuckGoEngine())
  search.registerEngine(new MockSearchEngine())

  return search
}

// Global web search instance
let globalWebSearch: WebSearch | null = null

export function getWebSearch(cacheDir?: string): WebSearch {
  if (!globalWebSearch) {
    globalWebSearch = createWebSearch(cacheDir)
  }
  return globalWebSearch
}
