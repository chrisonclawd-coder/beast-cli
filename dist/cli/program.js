/**
 * Beast CLI — CLI Program
 *
 * Main CLI program using commander.
 */
import { Command } from "commander";
/**
 * Create the CLI program
 */
export function createProgram() {
    const program = new Command();
    program
        .name("beast")
        .description("🦁 The ultimate AI coding agent")
        .version("0.1.0");
    return program;
}
/**
 * Register all commands with the program
 */
export function registerCommands(program, context) {
    const defaultContext = {
        config: {},
        projectRoot: process.cwd(),
        ...context,
    };
    // Main command - start interactive session
    program
        .argument("[path]", "project directory", ".")
        .option("-m, --model <model>", "model to use")
        .option("-p, --provider <provider>", "LLM provider (openai, anthropic, google)")
        .option("--plan", "start in plan mode (read-only)")
        .option("--swarm", "enable swarm mode")
        .option("--voice", "enable voice input")
        .option("--vim", "enable vim keybindings")
        .option("--no-git", "disable git integration")
        .option("--compact", "enable auto-compaction")
        .action(async (path, options) => {
        console.log("🦁 Beast CLI v0.1.0");
        console.log("");
        console.log(`  Project: ${path}`);
        console.log(`  Model: ${options.model || "default"}`);
        console.log(`  Provider: ${options.provider || "default"}`);
        console.log("");
        if (options.plan)
            console.log("  Mode: PLAN (read-only)");
        if (options.swarm)
            console.log("  Mode: SWARM (parallel)");
        if (options.voice)
            console.log("  Feature: Voice input enabled");
        if (options.vim)
            console.log("  Feature: Vim mode enabled");
        if (options.compact)
            console.log("  Feature: Auto-compaction enabled");
        console.log("");
        console.log("Starting interactive session...");
    });
    // Init command
    program
        .command("init")
        .description("Initialize Beast CLI configuration")
        .option("-f, --force", "overwrite existing config")
        .option("--provider <provider>", "default provider")
        .option("--model <model>", "default model")
        .action(async (options) => {
        const { initCommand } = await import("./init");
        await initCommand(defaultContext, options);
    });
    // Config command
    program
        .command("config")
        .description("Manage configuration")
        .argument("[key]", "config key to get/set")
        .argument("[value]", "value to set")
        .option("-l, --list", "list all config")
        .option("-e, --edit", "open config in editor")
        .option("--reset", "reset to defaults")
        .action(async (key, value, options) => {
        const { configCommand } = await import("./config");
        await configCommand(defaultContext, { key, value, ...options });
    });
    // Features command
    program
        .command("features")
        .description("Manage feature flags")
        .argument("[feature]", "feature name")
        .argument("[value]", "on/off")
        .option("-l, --list", "list all features")
        .option("-e, --enable", "enable feature")
        .option("-d, --disable", "disable feature")
        .action(async (feature, value, options) => {
        const { featuresCommand } = await import("./features");
        await featuresCommand(defaultContext, { feature, value, ...options });
    });
    // Cloud command
    program
        .command("cloud")
        .description("Cloud delegation commands")
        .argument("[action]", "submit|status|cancel")
        .option("-t, --task <id>", "task ID")
        .option("--priority <level>", "task priority (low, normal, high)")
        .action(async (action, options) => {
        const { cloudCommand } = await import("./cloud");
        await cloudCommand(defaultContext, { action, ...options });
    });
    // Resume command
    program
        .command("resume")
        .description("Resume a previous session")
        .argument("[session-id]", "session ID to resume")
        .option("-l, --list", "list available sessions")
        .option("--latest", "resume most recent session")
        .action(async (sessionId, options) => {
        const { resumeCommand } = await import("./resume");
        await resumeCommand(defaultContext, { sessionId, ...options });
    });
    // Swarm command
    program
        .command("swarm")
        .description("Manage swarm mode")
        .argument("[action]", "start|stop|status")
        .option("-n, --count <n>", "number of agents")
        .option("--worktree", "use git worktrees")
        .action(async (action, options) => {
        const { swarmCommand } = await import("./swarm");
        await swarmCommand(defaultContext, { action, ...options });
    });
}
//# sourceMappingURL=program.js.map