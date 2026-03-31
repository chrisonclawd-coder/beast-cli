/**
 * Beast CLI — Init Command
 * 
 * Initialize Beast configuration.
 */

import type { CLIContext } from "./program"
import { getConfig } from "../config"
import { createLogger } from "../utils"

const logger = createLogger({ prefix: "cli:init" })

interface InitOptions {
  force?: boolean
  provider?: string
  model?: string
}

export async function initCommand(context: CLIContext, options: InitOptions): Promise<void> {
  const configManager = getConfig(context.projectRoot)
  
  // Check if config exists
  const exists = await configManager.exists()
  
  if (exists && !options.force) {
    console.log("Configuration already exists at .beast/config.json")
    console.log("Use --force to overwrite")
    return
  }
  
  console.log("🦁 Initializing Beast CLI...")
  console.log("")
  
  // Set defaults
  if (options.provider) {
    configManager.set("provider", options.provider)
  }
  
  if (options.model) {
    configManager.set("model", options.model)
  }
  
  // Save config
  await configManager.save()
  
  console.log("✓ Created .beast/config.json")
  console.log("")
  console.log("Configuration:")
  console.log(`  Provider: ${options.provider || "openai (default)"}`)
  console.log(`  Model: ${options.model || "default"}`)
  console.log("")
  console.log("Run 'beast' to start an interactive session!")
}
