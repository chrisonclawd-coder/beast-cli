/**
 * Beast CLI — Sandbox Configuration
 * 
 * OS-level isolation configuration for secure tool execution.
 * Inspired by Claude Code's sandbox system.
 */

import * as fs from "fs/promises"
import * as path from "path"
import { spawn, ChildProcess } from "child_process"

export type SandboxBackend = "none" | "docker" | "bwrap" | "nsjail" | "firejail"

export interface SandboxConfig {
  enabled: boolean
  backend: SandboxBackend
  allowedPaths: string[]
  deniedPaths: string[]
  readOnlyPaths: string[]
  networkAccess: boolean
  maxMemoryMB: number
  maxCpuPercent: number
  timeoutMs: number
  envWhitelist: string[]
  userId?: number
  groupId?: number
}

export interface SandboxOptions {
  command: string
  args: string[]
  cwd: string
  env?: Record<string, string>
  stdin?: string
  timeout?: number
}

export interface SandboxResult {
  exitCode: number
  stdout: string
  stderr: string
  timedOut: boolean
}

/**
 * Helper to spawn a process with proper cleanup to prevent memory leaks.
 * Ensures all event listeners are removed after process completes.
 */
function spawnWithCleanup(
  command: string,
  args: string[],
  options: {
    cwd?: string
    env?: NodeJS.ProcessEnv
    timeout?: number
  } = {}
): Promise<{ proc: ChildProcess; result: Promise<SandboxResult> }> {
  const proc = spawn(command, args, {
    cwd: options.cwd,
    env: options.env || process.env,
    timeout: options.timeout,
  })

  let stdout = ""
  let stderr = ""
  let resolved = false

  const cleanup = () => {
    proc.stdout?.removeAllListeners("data")
    proc.stderr?.removeAllListeners("data")
    proc.removeAllListeners("close")
    proc.removeAllListeners("error")
  }

  proc.stdout?.on("data", (data) => { stdout += data.toString() })
  proc.stderr?.on("data", (data) => { stderr += data.toString() })

  const result = new Promise<SandboxResult>((resolve) => {
    proc.on("close", (code) => {
      if (resolved) return
      resolved = true
      cleanup()
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
        timedOut: false,
      })
    })

    proc.on("error", (err) => {
      if (resolved) return
      resolved = true
      cleanup()
      if (!proc.killed) {
        proc.kill()
      }
      resolve({
        exitCode: 1,
        stdout,
        stderr: err.message,
        timedOut: false,
      })
    })
  })

  return Promise.resolve({ proc, result })
}

// Default sandbox config
export const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
  enabled: false,
  backend: "none",
  allowedPaths: [],
  deniedPaths: ["/etc/passwd", "/etc/shadow", "~/.ssh", "~/.gnupg"],
  readOnlyPaths: [],
  networkAccess: false,
  maxMemoryMB: 512,
  maxCpuPercent: 50,
  timeoutMs: 30000,
  envWhitelist: ["PATH", "HOME", "USER", "SHELL"],
}

/**
 * Sandbox Manager - handles secure command execution
 */
export class SandboxManager {
  private config: SandboxConfig
  private projectRoot: string

  constructor(config: Partial<SandboxConfig>, projectRoot: string) {
    this.config = { ...DEFAULT_SANDBOX_CONFIG, ...config }
    this.projectRoot = projectRoot
  }

  /**
   * Get current config
   */
  getConfig(): SandboxConfig {
    return { ...this.config }
  }

  /**
   * Update config
   */
  updateConfig(updates: Partial<SandboxConfig>): void {
    this.config = { ...this.config, ...updates }
  }

  /**
   * Execute a command in the sandbox
   */
  async execute(options: SandboxOptions): Promise<SandboxResult> {
    if (!this.config.enabled) {
      return this.executeDirect(options)
    }

    switch (this.config.backend) {
      case "docker":
        return this.executeDocker(options)
      case "bwrap":
        return this.executeBwrap(options)
      case "firejail":
        return this.executeFirejail(options)
      case "nsjail":
        return this.executeNsjail(options)
      default:
        return this.executeDirect(options)
    }
  }

  /**
   * Execute directly (no sandbox)
   */
  private async executeDirect(options: SandboxOptions): Promise<SandboxResult> {
    const { result } = await spawnWithCleanup(options.command, options.args, {
      cwd: options.cwd,
      env: options.env,
      timeout: options.timeout || this.config.timeoutMs,
    })
    return result
  }

  /**
   * Execute in Docker container
   */
  private async executeDocker(options: SandboxOptions): Promise<SandboxResult> {
    const dockerArgs = [
      "run", "--rm",
      "-v", `${this.projectRoot}:/workspace`,
      "-w", "/workspace",
      "--memory", `${this.config.maxMemoryMB}m`,
      "--cpus", `${this.config.maxCpuPercent / 100}`,
      ...this.buildDockerNetworkArgs(),
      "beast-sandbox:latest",
      options.command,
      ...options.args,
    ]

    const { result } = await spawnWithCleanup("docker", dockerArgs, {
      timeout: this.config.timeoutMs,
    })
    return result
  }

  /**
   * Build Docker network arguments
   */
  private buildDockerNetworkArgs(): string[] {
    if (!this.config.networkAccess) {
      return ["--network", "none"]
    }
    return []
  }

  /**
   * Execute with bubblewrap (bwrap)
   */
  private async executeBwrap(options: SandboxOptions): Promise<SandboxResult> {
    const bwrapArgs = [
      "--ro-bind", "/usr", "/usr",
      "--ro-bind", "/lib", "/lib",
      "--ro-bind", "/lib64", "/lib64",
      "--bind", this.projectRoot, "/workspace",
      "--dev", "/dev",
      "--proc", "/proc",
      "--unshare-net",
      "--die-with-parent",
      "--new-session",
      ...this.buildBwrapPathArgs(),
      "--",
      options.command,
      ...options.args,
    ]

    try {
      const { result } = await spawnWithCleanup("bwrap", bwrapArgs, {
        cwd: options.cwd,
        timeout: this.config.timeoutMs,
      })
      return result
    } catch {
      // Fallback to direct execution if bwrap not available
      return this.executeDirect(options)
    }
  }

  /**
   * Build bwrap path arguments
   */
  private buildBwrapPathArgs(): string[] {
    const args: string[] = []
    
    for (const path of this.config.allowedPaths) {
      args.push("--ro-bind", path, path)
    }
    
    for (const path of this.config.readOnlyPaths) {
      args.push("--ro-bind", path, path)
    }
    
    return args
  }

  /**
   * Execute with firejail
   */
  private async executeFirejail(options: SandboxOptions): Promise<SandboxResult> {
    const firejailArgs = [
      "--quiet",
      "--private",
      `--whitelist=${this.projectRoot}`,
      "--noprofile",
      this.config.networkAccess ? "" : "--net=none",
      "--",
      options.command,
      ...options.args,
    ].filter(Boolean) as string[]

    try {
      const { result } = await spawnWithCleanup("firejail", firejailArgs, {
        cwd: options.cwd,
        timeout: this.config.timeoutMs,
      })
      return result
    } catch {
      return this.executeDirect(options)
    }
  }

  /**
   * Execute with nsjail
   */
  private async executeNsjail(options: SandboxOptions): Promise<SandboxResult> {
    // nsjail requires a config file, fall back to direct for now
    console.warn("nsjail backend not yet implemented, using direct execution")
    return this.executeDirect(options)
  }

  /**
   * Check if a backend is available
   */
  static async checkBackend(backend: SandboxBackend): Promise<boolean> {
    if (backend === "none") return true

    const commands: Record<SandboxBackend, string> = {
      none: "true",
      docker: "docker --version",
      bwrap: "bwrap --version",
      nsjail: "nsjail --help",
      firejail: "firejail --version",
    }

    try {
      const { execSync } = await import("child_process")
      execSync(commands[backend], { stdio: "pipe" })
      return true
    } catch {
      return false
    }
  }

  /**
   * Get available backends
   */
  static async getAvailableBackends(): Promise<SandboxBackend[]> {
    const backends: SandboxBackend[] = ["none", "docker", "bwrap", "firejail", "nsjail"]
    const available: SandboxBackend[] = []

    for (const backend of backends) {
      if (await this.checkBackend(backend)) {
        available.push(backend)
      }
    }

    return available
  }
}

/**
 * Create a sandbox manager
 */
export function createSandboxManager(
  config: Partial<SandboxConfig> = {},
  projectRoot: string = process.cwd()
): SandboxManager {
  return new SandboxManager(config, projectRoot)
}

// Global sandbox manager
let globalSandbox: SandboxManager | null = null

export function getSandboxManager(projectRoot?: string): SandboxManager {
  if (!globalSandbox || projectRoot) {
    globalSandbox = createSandboxManager({}, projectRoot || process.cwd())
  }
  return globalSandbox
}
