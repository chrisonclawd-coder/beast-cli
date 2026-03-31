/**
 * Beast CLI — Main Orchestrator
 */

import { ProviderRegistry } from "./providers/registry"
import { ToolExecutor } from "./tools/executor"
import { builtinTools } from "./tools/builtin"
import { ExecuteAgent } from "./agents/execute"
import { PlanAgent } from "./agents/plan"
import { ConfigManager } from "./config/manager"
import { SessionManager } from "./session/manager"
import { SkillLoader, createSkillLoader } from "./skills/loader"
import { HookExecutor, createHookExecutor } from "./hooks/executor"
import { FeatureFlagManager, createFeatureFlagManager } from "./features/flags"
import { CompactionManager } from "./compaction/manager"
import { SessionResume } from "./session/resume"
import { logger } from "./utils/logger"

import type { Provider, Message, ResponseChunk } from "./providers/types"

export interface BeastAppConfig {
  projectRoot: string
  provider?: string
  model?: string
}

export class BeastApp {
  public config: ConfigManager
  public providers: ProviderRegistry
  public tools: ToolExecutor
  public skills: SkillLoader
  public hooks: HookExecutor
  public features: FeatureFlagManager
  public session: SessionManager
  public compactor: CompactionManager
  public resume: SessionResume

  private activeProvider: Provider | null = null
  private activeModel = ""

  private appConfig_: BeastAppConfig
  activeModel = ""
  constructor(appConfig: BeastAppConfig) {
    this.appConfig_ = appConfig
    this.config = new ConfigManager(appConfig.projectRoot)
    this.providers = new ProviderRegistry()
    this.tools = new ToolExecutor()
    this.skills = createSkillLoader(appConfig.projectRoot)
    this.hooks = createHookExecutor(appConfig.projectRoot, { enabled: true, timeout: 30000 })
    this.features = createFeatureFlagManager(appConfig.projectRoot)
    this.session = new SessionManager(appConfig.projectRoot)
    this.compactor = new CompactionManager()
    this.resume = new SessionResume({ resumeDir: `${appConfig.projectRoot}/.beast/resume` })
  }

  async init(): Promise<void> {
    await this.config.load()
    await this.features.load()

    // Register providers BEFORE auto-discovery so factories exist
    this.registerProviders()
    
    const discovered = this.providers.autoDiscover()
    if (discovered.length > 0) {
      logger.info(`Discovered providers: ${discovered.join(", ")}`)
    }

    this.tools.registerTools(builtinTools)
    const loadedSkills = await this.skills.loadAll()
    logger.info(`Loaded ${loadedSkills.length} skills`)

    logger.info("Beast initialized", {
      providers: this.providers.listActive().length,
      tools: this.tools.getTools().length,
    })
  }

  private registerProviders(): void {
    const cfg = this.config.get()

    // OpenAI
    const openaiKey = process.env.OPENAI_API_KEY || cfg.apiKey
    if (openaiKey) {
      try {
        const { OpenAIProvider } = require("./providers/openai")
        this.providers.registerFactory("openai", (c) => new OpenAIProvider({ ...c, apiKey: openaiKey }))
      } catch { /* not available */ }
    }

    // Anthropic
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    if (anthropicKey) {
      try {
        const { AnthropicProvider } = require("./providers/anthropic")
        this.providers.registerFactory("anthropic", (c) => new AnthropicProvider({ ...c, apiKey: anthropicKey }))
      } catch { /* not available */ }
    }

    // Google
    const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
    if (googleKey) {
      try {
        const { GoogleProvider } = require("./providers/google")
        this.providers.registerFactory("google", (c) => new GoogleProvider({ ...c, apiKey: googleKey }))
      } catch { /* not available */ }
    }

    // OpenRouter
    const openrouterKey = process.env.OPENROUTER_API_KEY
    if (openrouterKey) {
      try {
        const { OpenRouterProvider } = require("./providers/openrouter")
        this.providers.registerFactory("openrouter", (c) => new OpenRouterProvider({ ...c, apiKey: openrouterKey }))
      } catch { /* not available */ }
    }

    // Groq
    const groqKey = process.env.GROQ_API_KEY
    if (groqKey) {
      try {
        const { GroqProvider } = require("./providers/groq")
        this.providers.registerFactory("groq", (c) => new GroqProvider({ ...c, apiKey: groqKey }))
      } catch { /* not available */ }
    }

    // Mistral
    const mistralKey = process.env.MISTRAL_API_KEY
    if (mistralKey) {
      try {
        const { MistralProvider } = require("./providers/mistral")
        this.providers.registerFactory("mistral", (c) => new MistralProvider({ ...c, apiKey: mistralKey }))
      } catch { /* not available */ }
    }

    // Together AI
    const togetherKey = process.env.TOGETHER_API_KEY
    if (togetherKey) {
      try {
        const { TogetherProvider } = require("./providers/together")
        this.providers.registerFactory("together", (c) => new TogetherProvider({ ...c, apiKey: togetherKey }))
      } catch { /* not available */ }
    }

    // Fireworks AI
    const fireworksKey = process.env.FIREWORKS_API_KEY
    if (fireworksKey) {
      try {
        const { FireworksProvider } = require("./providers/fireworks")
        this.providers.registerFactory("fireworks", (c) => new FireworksProvider({ ...c, apiKey: fireworksKey }))
      } catch { /* not available */ }
    }

    // DeepSeek
    const deepseekKey = process.env.DEEPSEEK_API_KEY
    if (deepseekKey) {
      try {
        const { DeepSeekProvider } = require("./providers/deepseek")
        this.providers.registerFactory("deepseek", (c) => new DeepSeekProvider({ ...c, apiKey: deepseekKey }))
      } catch { /* not available */ }
    }

    // Cohere
    const cohereKey = process.env.CO_API_KEY
    if (cohereKey) {
      try {
        const { CohereProvider } = require("./providers/cohere")
        this.providers.registerFactory("cohere", (c) => new CohereProvider({ ...c, apiKey: cohereKey }))
      } catch { /* not available */ }
    }

    // xAI / Grok
    const xaiKey = process.env.XAI_API_KEY
    if (xaiKey) {
      try {
        const { XAIProvider } = require("./providers/xai")
        this.providers.registerFactory("xai", (c) => new XAIProvider({ ...c, apiKey: xaiKey }))
      } catch { /* not available */ }
    }

    // Perplexity
    const perplexityKey = process.env.PERPLEXITY_API_KEY
    if (perplexityKey) {
      try {
        const { PerplexityProvider } = require("./providers/perplexity")
        this.providers.registerFactory("perplexity", (c) => new PerplexityProvider({ ...c, apiKey: perplexityKey }))
      } catch { /* not available */ }
    }

    // Z.AI / GLM
    const zaiKey = process.env.ZAI_API_KEY
    if (zaiKey) {
      try {
        const { ZAIProvider } = require("./providers/zai")
        this.providers.registerFactory("zai", (c) => new ZAIProvider({ ...c, apiKey: zaiKey }))
      } catch { /* not available */ }
    }

    // Ollama (local - always register)
    try {
      const { OllamaProvider } = require("./providers/ollama")
      this.providers.registerFactory("ollama", (c) => new OllamaProvider(c))
    } catch { /* not available */ }

    // LiteLLM (proxy)
    const litellmKey = process.env.LITELLM_API_KEY
    if (litellmKey || process.env.LITELLM_BASE_URL) {
      try {
        const { LiteLLMProvider } = require("./providers/litellm")
        this.providers.registerFactory("litellm", (c) => new LiteLLMProvider({ ...c, apiKey: litellmKey }))
      } catch { /* not available */ }
    }
  }

  setActiveProvider(providerId: string, modelId: string): void {
    const provider = this.providers.getProvider(providerId)
    if (!provider) {
      throw new Error(`Provider not found: ${providerId}. Available: ${this.providers.listActive().join(", ")}`)
    }
    this.activeProvider = provider
    this.activeModel = modelId
  }

  get appConfig() { return this.appConfig_ }

  getActiveProvider(): Provider {
    if (!this.activeProvider) {
      const active = this.providers.listActive()
      if (active.length === 0) {
        throw new Error("No providers configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_API_KEY")
      }
      this.activeProvider = this.providers.getProvider(active[0])
      const cfg = this.config.get()
      this.activeModel = cfg.model ?? "default"
    }
    return this.activeProvider
  }

  async *chat(messages: Message[]): AsyncGenerator<ResponseChunk> {
    const provider = this.getActiveProvider()
    const systemPrompt = this.buildSystemPrompt()
    const allMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ]

    for await (const chunk of provider.stream(allMessages, { model: this.activeModel })) {
      yield chunk
    }
  }

  async execute(messages: Message[]): Promise<string> {
    const provider = this.getActiveProvider()
    const agent = new ExecuteAgent({
      provider,
      model: this.activeModel,
      tools: this.tools,
      systemPrompt: this.buildSystemPrompt(),
      maxIterations: 10,
      workingDir: this.appConfig_.projectRoot,
    })

    const lastUser = messages.length > 0 ? messages[messages.length - 1].content : ""
    const result = await agent.run(lastUser)
    return result.content
  }

  async plan(task: string): Promise<string> {
    const provider = this.getActiveProvider()
    const agent = new PlanAgent({
      provider,
      model: this.activeModel,
      systemPrompt: this.buildSystemPrompt(),
      workingDir: this.appConfig_.projectRoot,
    })

    const result = await agent.plan(task)
    return result.content
  }

  buildSystemPrompt(): string {
    const parts = [
      "You are Beast CLI, an expert AI coding agent with full access to file operations and shell commands.",
      `Working directory: ${this.appConfig_.projectRoot}`,
      "",
      "You have these tools available:",
      "  - readFile: Read file contents",
      "  - writeFile: Create or overwrite files",
      "  - editFile: Make precise edits to existing files",
      "  - bash: Execute shell commands",
      "  - glob: Find files by pattern",
      "  - grep: Search file contents (pattern matching)",
      "",
      "When the user asks you to do something:",
      "1. Read relevant files to understand the codebase",
      "2. Plan your approach briefly",
      "3. Make changes using editFile or writeFile",
      "4. Verify with bash (run tests, build, etc.) if applicable",
      "5. Report what you did concisely",
      "",
      "Rules:",
      "- Make minimal, targeted edits — don't rewrite entire files",
      "- Always read a file before editing it",
      "- Use bash for running commands (npm test, git status, etc.)",
      "- Be concise in explanations, thorough in execution",
    ]
    const skills = this.skills.getCached()
    if (skills.length > 0) {
      parts.push(`\nLoaded skills: ${skills.map(s => s.name).join(", ")}`)
    }
    return parts.join("\n")
  }
}
