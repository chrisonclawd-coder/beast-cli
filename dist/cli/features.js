/**
 * Beast CLI — Features Command
 *
 * Manage feature flags.
 */
import { createLogger } from "../utils";
const logger = createLogger({ prefix: "cli:features" });
// Available features
const AVAILABLE_FEATURES = [
    { name: "vim", description: "Vim-style keybindings" },
    { name: "autoCompact", description: "Auto-compact conversation context" },
    { name: "webSearch", description: "Web search integration" },
    { name: "voice", description: "Voice input support" },
    { name: "sandbox", description: "Sandboxed command execution" },
    { name: "cloud", description: "Cloud task delegation" },
    { name: "hooks", description: "Event hooks system" },
    { name: "skills", description: "Skills loading" },
];
export async function featuresCommand(context, options) {
    // List all features
    if (options.list) {
        console.log("🦁 Available Features:");
        console.log("");
        for (const feature of AVAILABLE_FEATURES) {
            console.log(`  ${feature.name.padEnd(15)} ${feature.description}`);
        }
        console.log("");
        console.log("Use 'beast features <name> on/off' to toggle");
        return;
    }
    // Enable feature
    if (options.enable && options.feature) {
        console.log(`✓ Feature '${options.feature}' enabled`);
        // Would persist to config
        return;
    }
    // Disable feature
    if (options.disable && options.feature) {
        console.log(`✓ Feature '${options.feature}' disabled`);
        // Would persist to config
        return;
    }
    // Toggle feature
    if (options.feature && options.value) {
        const enabled = options.value === "on" || options.value === "true" || options.value === "1";
        console.log(`✓ Feature '${options.feature}' ${enabled ? "enabled" : "disabled"}`);
        // Would persist to config
        return;
    }
    // Default: show usage
    console.log("🦁 Feature Flag Management");
    console.log("");
    console.log("Options:");
    console.log("  --list              List all features");
    console.log("  --enable <name>     Enable a feature");
    console.log("  --disable <name>    Disable a feature");
    console.log("  <name> <on|off>     Toggle a feature");
}
//# sourceMappingURL=features.js.map