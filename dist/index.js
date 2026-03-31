/**
 * Beast CLI — Entry Point
 * 🦁 The Beast awakens.
 */
import { Command } from "commander";
const program = new Command();
program
    .name("beast")
    .description("🦁 The ultimate AI coding agent")
    .version("0.1.0");
program
    .argument("[path]", "project directory", ".")
    .option("-m, --model <model>", "model to use")
    .option("-p, --provider <provider>", "LLM provider")
    .option("--plan", "start in plan mode (read-only)")
    .option("--swarm", "enable swarm mode")
    .option("--voice", "enable voice input")
    .option("--vim", "enable vim keybindings")
    .action(async (path, options) => {
    console.log("🦁 Beast CLI v0.1.0");
    console.log("The beast is not yet tamed. Coming soon...");
    console.log("");
    console.log(`  Project: ${path}`);
    console.log(`  Model: ${options.model || "default"}`);
    console.log(`  Provider: ${options.provider || "default"}`);
    console.log("");
    console.log("Run 'beast init' to set up your configuration.");
});
program
    .command("init")
    .description("Initialize Beast CLI configuration")
    .action(async () => {
    console.log("🦁 Initializing Beast CLI...");
    // TODO: Interactive config setup
});
program
    .command("config")
    .description("Manage configuration")
    .action(() => {
    console.log("Config management coming soon.");
});
program.parse();
//# sourceMappingURL=index.js.map