/**
 * Beast CLI — CLI Commands Module
 * 
 * Command definitions for beast CLI.
 * Inspired by Gemini CLI command structure.
 */

export { registerCommands, createProgram } from "./program"

// Command modules
export { initCommand } from "./init"
export { configCommand } from "./config"
export { featuresCommand } from "./features"
export { cloudCommand } from "./cloud"
export { resumeCommand } from "./resume"
export { swarmCommand } from "./swarm"
