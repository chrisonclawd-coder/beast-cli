/**
 * Beast CLI — Config Command
 * 
 * Manage configuration.
 */

import type { CLIContext } from "./program"
import { getConfig } from "../config"
import { createLogger } from "../utils"

const logger = createLogger({ prefix: "cli:config" })

interface ConfigOptions {
  list?: boolean
  edit?: boolean
  reset?: boolean
  key?: string
  value?: string
}

export async function configCommand(
  context: CLIContext,
  options: ConfigOptions
): Promise<void> {
  const configManager = getConfig(context.projectRoot)
  await configManager.load()
  
  // List all config
  if (options.list) {
    const config = configManager.get()
    console.log("🦁 Current Configuration:")
    console.log("")
    console.log(JSON.stringify(config, null, 2))
    return
  }
  
  // Reset config
  if (options.reset) {
    await configManager.reset()
    console.log("✓ Configuration reset to defaults")
    return
  }
  
  // Edit config (open in editor)
  if (options.edit) {
    const configPath = configManager.getConfigPath()
    console.log(`Config file: ${configPath}`)
    console.log("Open this file in your editor to modify.")
    return
  }
  
  // Get/set specific key
  if (options.key) {
    if (options.value !== undefined) {
      // Set value
      const config = configManager.get()
      ;(config as Record<string, unknown>)[options.key] = options.value
      await configManager.save()
      console.log(`✓ Set ${options.key} = ${options.value}`)
    } else {
      // Get value
      const config = configManager.get()
      const value = (config as Record<string, unknown>)[options.key]
      console.log(`${options.key} = ${JSON.stringify(value)}`)
    }
    return
  }
  
  // Default: show config path
  console.log(`Config file: ${configManager.getConfigPath()}`)
  console.log("")
  console.log("Options:")
  console.log("  --list     Show all configuration")
  console.log("  --edit     Open config in editor")
  console.log("  --reset    Reset to defaults")
  console.log("  <key>      Get config value")
  console.log("  <key> <value>  Set config value")
}
