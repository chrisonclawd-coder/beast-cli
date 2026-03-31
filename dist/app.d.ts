/**
 * Beast CLI — Main Orchestrator
 */
import { ProviderRegistry } from "./providers/registry";
import { ToolExecutor } from "./tools/executor";
import { ConfigManager } from "./config/manager";
import { SessionManager } from "./session/manager";
import { SkillLoader } from "./skills/loader";
import { HookExecutor } from "./hooks/executor";
import { FeatureFlagManager } from "./features/flags";
import { CompactionManager } from "./compaction/manager";
import { SessionResume } from "./session/resume";
import type { Provider, Message, ResponseChunk } from "./providers/types";
export interface BeastAppConfig {
    projectRoot: string;
    provider?: string;
    model?: string;
}
export declare class BeastApp {
    private appConfig;
    config: ConfigManager;
    providers: ProviderRegistry;
    tools: ToolExecutor;
    skills: SkillLoader;
    hooks: HookExecutor;
    features: FeatureFlagManager;
    session: SessionManager;
    compactor: CompactionManager;
    resume: SessionResume;
    private activeProvider;
    private activeModel;
    constructor(appConfig: BeastAppConfig);
    init(): Promise<void>;
    private registerProviders;
    setActiveProvider(providerId: string, modelId: string): void;
    getActiveProvider(): Provider;
    chat(messages: Message[]): AsyncGenerator<ResponseChunk>;
    execute(messages: Message[]): Promise<string>;
    plan(task: string): Promise<string>;
    private buildSystemPrompt;
}
