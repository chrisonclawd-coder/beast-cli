#!/usr/bin/env node
/**
 * Beast CLI — Entry Point
 */
import * as readline from "readline";
import { BeastApp } from "../app";
import { formatTokens } from "../utils/format";
const args = process.argv.slice(2);
const command = args[0] ?? "chat";
async function main() {
    const commands = {
        init: cmdInit,
        chat: cmdChat,
        config: cmdConfig,
        features: cmdFeatures,
        resume: cmdResume,
        swarm: () => { console.log("🦁 Swarm coming soon"); return Promise.resolve(); },
        cloud: () => { console.log("🦁 Cloud coming soon"); return Promise.resolve(); },
        mcp: () => { console.log("🦁 MCP coming soon"); return Promise.resolve(); },
        help: cmdHelp,
        "--help": cmdHelp,
        "-h": cmdHelp,
    };
    const handler = commands[command];
    if (!handler) {
        console.error(`Unknown command: ${command}. Run 'beast help' for usage.`);
        process.exit(1);
    }
    await handler();
}
async function cmdInit() {
    const dir = args[1] || process.cwd();
    const { createInitCommand } = require("./init");
    await createInitCommand(dir);
    console.log(`🦁 Beast initialized in ${dir}`);
}
async function cmdChat() {
    const app = new BeastApp({ projectRoot: process.cwd() });
    await app.init();
    const active = app.providers.listActive();
    if (active.length === 0) {
        console.error("No providers available. Set API keys:");
        console.error("  export OPENAI_API_KEY=...");
        console.error("  export ANTHROPIC_API_KEY=...");
        console.error("  export GOOGLE_API_KEY=...");
        process.exit(1);
    }
    const providerId = args[1] || active[0];
    const modelId = args[2] || "default";
    app.setActiveProvider(providerId, modelId);
    console.log(`🦁 Beast CLI — ${providerId}/${modelId}`);
    console.log("Type your message. Ctrl+C to exit. /help for commands.\n");
    const messages = [];
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const prompt = () => { rl.setPrompt("You> "); rl.prompt(); };
    rl.on("line", async (line) => {
        const input = line.trim();
        if (!input) {
            prompt();
            return;
        }
        if (input.startsWith("/")) {
            await handleSlash(input, app, messages);
            prompt();
            return;
        }
        messages.push({ role: "user", content: input });
        try {
            let fullResponse = "";
            process.stdout.write("Beast> ");
            for await (const chunk of app.chat(messages)) {
                if (chunk.type === "text" && chunk.content) {
                    process.stdout.write(chunk.content);
                    fullResponse += chunk.content;
                }
                else if (chunk.type === "done") {
                    process.stdout.write("\n");
                    if (chunk.usage) {
                        console.log(`  [${formatTokens(chunk.usage.inputTokens + chunk.usage.outputTokens)} tokens]`);
                    }
                }
            }
            messages.push({ role: "assistant", content: fullResponse });
            if (messages.length > 50) {
                const { messages: compacted } = await app.compactor.compact(messages);
                messages.length = 0;
                messages.push(...compacted);
                console.log("  [Auto-compacted]");
            }
        }
        catch (err) {
            console.error(`\nError: ${err.message}`);
        }
        prompt();
    });
    rl.on("close", () => { console.log("\n🦁 Bye!"); process.exit(0); });
    prompt();
}
async function cmdConfig() {
    const app = new BeastApp({ projectRoot: process.cwd() });
    await app.config.load();
    const key = args[1];
    const value = args[2];
    if (!key) {
        console.log(JSON.stringify(app.config.get(), null, 2));
    }
    else if (value) {
        const cfg = app.config.get();
        cfg[key] = value;
        await app.config.save();
        console.log(`Set ${key} = ${value}`);
    }
    else {
        const cfg = app.config.get();
        console.log(cfg[key] ?? "(not set)");
    }
}
async function cmdFeatures() {
    const app = new BeastApp({ projectRoot: process.cwd() });
    await app.features.load();
    const subcmd = args[1];
    if (subcmd === "enable" && args[2]) {
        await app.features.enable(args[2]);
        console.log(`Enabled: ${args[2]}`);
    }
    else if (subcmd === "disable" && args[2]) {
        await app.features.disable(args[2]);
        console.log(`Disabled: ${args[2]}`);
    }
    else {
        const flags = app.features.getFlags();
        for (const [name, enabled] of Object.entries(flags)) {
            console.log(`  ${enabled ? "✅" : "⬜"} ${name}`);
        }
    }
}
async function cmdResume() {
    const app = new BeastApp({ projectRoot: process.cwd() });
    const sessionId = args[1];
    if (sessionId) {
        const cp = await app.resume.loadCheckpoint(sessionId);
        if (!cp) {
            console.error(`Session not found: ${sessionId}`);
            process.exit(1);
        }
        console.log(`Session ${sessionId}: ${cp.messages.length} messages, ${cp.totalTokens} tokens`);
    }
    else {
        const checkpoints = await app.resume.listCheckpoints();
        if (checkpoints.length === 0) {
            console.log("No saved sessions");
        }
        else {
            for (const cp of checkpoints.slice(0, 10)) {
                const date = new Date(cp.timestamp).toLocaleString();
                console.log(`  ${cp.id.slice(0, 8)}  ${date}  ${cp.messages.length} msgs`);
            }
        }
    }
}
async function cmdHelp() {
    console.log(`
🦁 Beast CLI — The unified AI coding assistant

Usage: beast <command> [options]

Commands:
  init [path]               Initialize Beast in a project
  chat [provider] [model]   Start interactive chat (default)
  config [key] [value]      Get/set configuration
  features [enable|disable] Manage feature flags
  resume [session-id]       List or resume sessions

Slash commands (in chat):
  /help     Show commands
  /plan     Switch to plan mode
  /compact  Compact context
  /clear    Clear conversation
  /quit     Exit

Environment:
  OPENAI_API_KEY      OpenAI
  ANTHROPIC_API_KEY   Anthropic
  GOOGLE_API_KEY      Google
`);
}
async function handleSlash(input, app, messages) {
    const cmd = input.split(/\s+/)[0].slice(1);
    switch (cmd) {
        case "help":
            console.log("/help /plan /compact /clear /quit");
            break;
        case "plan": {
            const lastUser = [...messages].reverse().find(m => m.role === "user");
            if (lastUser) {
                console.log("Planning...");
                const result = await app.plan(lastUser.content);
                console.log(`Beast (plan)> ${result}`);
            }
            break;
        }
        case "compact": {
            const { messages: compacted } = await app.compactor.compact(messages);
            messages.length = 0;
            messages.push(...compacted);
            console.log(`Compacted to ${messages.length} messages`);
            break;
        }
        case "clear":
            messages.length = 0;
            console.log("Cleared");
            break;
        case "quit":
            console.log("🦁 Bye!");
            process.exit(0);
        default:
            console.log(`Unknown: /${cmd}`);
    }
}
main().catch((err) => { console.error("Fatal:", err.message); process.exit(1); });
//# sourceMappingURL=index.js.map