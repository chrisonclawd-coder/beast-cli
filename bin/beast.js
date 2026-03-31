#!/usr/bin/env node
// Beast CLI wrapper - uses tsx to run TypeScript directly
require("child_process").execSync("npx tsx " + require("path").join(__dirname, "..", "src", "cli", "index.ts") + " " + process.argv.slice(2).join(" "), { stdio: "inherit" })
