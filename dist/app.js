/**
 * Beast CLI — Main Orchestrator
 */
import { ProviderRegistry } from "./providers/registry";
import { ToolExecutor } from "./tools/executor";
import { builtinTools } from "./tools/builtin";
import { ExecuteAgent } from "./agents/execute";
import { PlanAgent } from "./agents/plan";
import { ConfigManager } from "./config/manager";
import { SessionManager } from "./session/manager";
import { createSkillLoader } from "./skills/loader";
import { createHookExecutor } from "./hooks/executor";
import { createFeatureFlagManager } from "./features/flags";
import { CompactionManager } from "./compaction/manager";
import { SessionResume } from "./session/resume";
import { logger } from "./utils/logger";
export class BeastApp {
    appConfig;
    config;
    providers;
    tools;
    skills;
    hooks;
    features;
    session;
    compactor;
    resume;
    activeProvider = null;
    activeModel = "";
    constructor(appConfig) {
        this.appConfig = appConfig;
        this.config = new ConfigManager(appConfig.projectRoot);
        this.providers = new ProviderRegistry();
        this.tools = new ToolExecutor();
        this.skills = createSkillLoader(appConfig.projectRoot);
        this.hooks = createHookExecutor(appConfig.projectRoot, { enabled: true, timeout: 30000 });
        this.features = createFeatureFlagManager(appConfig.projectRoot);
        this.session = new SessionManager(appConfig.projectRoot);
        this.compactor = new CompactionManager();
        this.resume = new SessionResume({ resumeDir: `${appConfig.projectRoot}/.beast/resume` });
    }
    async init() {
        await this.config.load();
        await this.features.load();
        const discovered = this.providers.autoDiscover();
        if (discovered.length > 0) {
            logger.info(`Discovered providers: ${discovered.join(", ")}`);
        }
        this.registerProviders();
        this.tools.registerTools(builtinTools);
        const loadedSkills = await this.skills.loadAll();
        logger.info(`Loaded ${loadedSkills.length} skills`);
        logger.info("Beast initialized", {
            providers: this.providers.listActive().length,
            tools: this.tools.getTools().length,
        });
    }
    registerProviders() {
        const cfg = this.config.get();
        // OpenAI
        const openaiKey = process.env.OPENAI_API_KEY || cfg.apiKey;
        if (openaiKey) {
            try {
                const { OpenAIProvider } = require("./providers/openai");
                this.providers.registerFactory("openai", (c) => new OpenAIProvider({ ...c, apiKey: openaiKey }));
            }
            catch { /* not available */ }
        }
        // Anthropic
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        if (anthropicKey) {
            try {
                const { AnthropicProvider } = require("./providers/anthropic");
                this.providers.registerFactory("anthropic", (c) => new AnthropicProvider({ ...c, apiKey: anthropicKey }));
            }
            catch { /* not available */ }
        }
        // Google
        const googleKey = process.env.GOOGLE_API_KEY;
        if (googleKey) {
            try {
                const { GoogleProvider } = require("./providers/google");
                this.providers.registerFactory("google", (c) => new GoogleProvider({ ...c, apiKey: googleKey }));
            }
            catch { /* not available */ }
        }
    }
    setActiveProvider(providerId, modelId) {
        const provider = this.providers.getProvider(providerId);
        if (!provider) {
            throw new Error(`Provider not found: ${providerId}. Available: ${this.providers.listActive().join(", ")}`);
        }
        this.activeProvider = provider;
        this.activeModel = modelId;
    }
    getActiveProvider() {
        if (!this.activeProvider) {
            const active = this.providers.listActive();
            if (active.length === 0) {
                throw new Error("No providers configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_API_KEY");
            }
            this.activeProvider = this.providers.getProvider(active[0]);
            const cfg = this.config.get();
            this.activeModel = cfg.model ?? "default";
        }
        return this.activeProvider;
    }
    async *chat(messages) {
        const provider = this.getActiveProvider();
        const systemPrompt = this.buildSystemPrompt();
        const allMessages = [
            { role: "system", content: systemPrompt },
            ...messages,
        ];
        for await (const chunk of provider.stream(allMessages, { model: this.activeModel })) {
            yield chunk;
        }
    }
    async execute(messages) {
        const provider = this.getActiveProvider();
        const agent = new ExecuteAgent({
            provider,
            model: this.activeModel,
            tools: this.tools,
            systemPrompt: this.buildSystemPrompt(),
            maxIterations: 10,
            workingDir: this.appConfig.projectRoot,
        });
        const lastUser = messages.length > 0 ? messages[messages.length - 1].content : "";
        const result = await agent.run(lastUser);
        return result.content;
    }
    async plan(task) {
        const provider = this.getActiveProvider();
        const agent = new PlanAgent({
            provider,
            model: this.activeModel,
            systemPrompt: this.buildSystemPrompt(),
            workingDir: this.appConfig.projectRoot,
        });
        const result = await agent.plan(task);
        return result.content;
    }
    buildSystemPrompt() {
        const parts = [
            "You are Beast CLI, an AI coding assistant.",
            `Working directory: ${this.appConfig.projectRoot}`,
        ];
        const skills = this.skills.getCached();
        if (skills.length > 0) {
            parts.push(`Loaded skills: ${skills.map(s => s.name).join(", ")}`);
        }
        return parts.join("\n");
    }
}
//# sourceMappingURL=app.js.map