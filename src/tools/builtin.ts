/**
 * Beast CLI — Built-in Tools
 * 
 * Core tools for file operations, shell commands, etc.
 * Inspired by OpenCode's tool set.
 */

import type { Tool, ToolResult, ToolContext, Permission } from "./types"
import { z } from "zod"

// ============ SECURITY HELPERS ============

/**
 * Validate that a resolved path is within the allowed working directory.
 * Prevents path traversal attacks using ../ sequences.
 */
function validatePath(workingDir: string, inputPath: string): { valid: boolean; resolvedPath: string; error?: string } {
  const path = require("path")
  
  // Resolve the path relative to working directory
  const resolvedPath = path.resolve(workingDir, inputPath)
  
  // Normalize both paths for comparison
  const normalizedWorkingDir = path.normalize(workingDir)
  const normalizedResolvedPath = path.normalize(resolvedPath)
  
  // Check if resolved path starts with working directory
  // Use path.relative to check containment
  const relative = path.relative(normalizedWorkingDir, normalizedResolvedPath)
  
  // If relative path starts with .., it's outside working directory
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return {
      valid: false,
      resolvedPath,
      error: `Path traversal denied: "${inputPath}" resolves outside working directory`,
    }
  }
  
  return { valid: true, resolvedPath }
}

// ============ FILE TOOLS ============

const readFileSchema = z.object({
  path: z.string().describe("File path to read"),
  offset: z.number().optional().describe("Line number to start reading from"),
  limit: z.number().optional().describe("Maximum number of lines to read"),
})

export const readFileTool: Tool = {
  name: "read",
  description: "Read the contents of a file. Returns file content as text.",
  parameters: readFileSchema,
  defaultPermission: "auto",
  execute: async (params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> => {
    try {
      const fs = await import("fs/promises")
      const path = await import("path")
      
      // Validate path to prevent traversal attacks
      const pathValidation = validatePath(ctx.workingDir, params.path as string)
      if (!pathValidation.valid) {
        return {
          success: false,
          content: "",
          error: pathValidation.error,
        }
      }
      
      const content = await fs.readFile(pathValidation.resolvedPath, "utf-8")
      
      let lines = content.split("\n")
      const offset = (params.offset as number) || 1
      const limit = (params.limit as number) || lines.length
      
      // Adjust for 1-indexed offset
      const startLine = Math.max(0, offset - 1)
      const endLine = Math.min(lines.length, startLine + limit)
      
      const selectedLines = lines.slice(startLine, endLine)
      
      return {
        success: true,
        content: selectedLines.join("\n"),
        metadata: {
          totalLines: lines.length,
          returnedLines: selectedLines.length,
          startLine: offset,
        },
      }
    } catch (error) {
      return {
        success: false,
        content: "",
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
}

const writeFileSchema = z.object({
  path: z.string().describe("File path to write"),
  content: z.string().describe("Content to write to the file"),
})

export const writeFileTool: Tool = {
  name: "write",
  description: "Write content to a file. Creates the file if it doesn't exist, overwrites if it does.",
  parameters: writeFileSchema,
  defaultPermission: "ask",
  execute: async (params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> => {
    try {
      const fs = await import("fs/promises")
      const path = await import("path")
      
      // Validate path to prevent traversal attacks
      const pathValidation = validatePath(ctx.workingDir, params.path as string)
      if (!pathValidation.valid) {
        return {
          success: false,
          content: "",
          error: pathValidation.error,
        }
      }
      
      const filePath = pathValidation.resolvedPath
      
      // Ensure directory exists
      const dir = path.dirname(filePath)
      await fs.mkdir(dir, { recursive: true })
      
      await fs.writeFile(filePath, params.content as string, "utf-8")
      
      return {
        success: true,
        content: `Successfully wrote to ${params.path}`,
      }
    } catch (error) {
      return {
        success: false,
        content: "",
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
}

const editFileSchema = z.object({
  path: z.string().describe("File path to edit"),
  oldText: z.string().describe("Text to find and replace"),
  newText: z.string().describe("Replacement text"),
})

export const editFileTool: Tool = {
  name: "edit",
  description: "Edit a file by replacing specific text. Finds oldText and replaces it with newText.",
  parameters: editFileSchema,
  defaultPermission: "ask",
  execute: async (params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> => {
    try {
      const fs = await import("fs/promises")
      const path = await import("path")
      
      // Validate path to prevent traversal attacks
      const pathValidation = validatePath(ctx.workingDir, params.path as string)
      if (!pathValidation.valid) {
        return {
          success: false,
          content: "",
          error: pathValidation.error,
        }
      }
      
      const content = await fs.readFile(pathValidation.resolvedPath, "utf-8")
      
      const oldText = params.oldText as string
      const newText = params.newText as string
      
      if (!content.includes(oldText)) {
        return {
          success: false,
          content: "",
          error: `Text not found in file: "${oldText.slice(0, 50)}..."`,
        }
      }
      
      const newContent = content.replace(oldText, newText)
      await fs.writeFile(pathValidation.resolvedPath, newContent, "utf-8")
      
      return {
        success: true,
        content: `Successfully edited ${params.path}`,
      }
    } catch (error) {
      return {
        success: false,
        content: "",
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
}

// ============ SHELL TOOL ============

const bashSchema = z.object({
  command: z.string().describe("Shell command to execute"),
  timeout: z.number().optional().describe("Timeout in milliseconds"),
})

export const bashTool: Tool = {
  name: "bash",
  description: "Execute a shell command. Use with caution.",
  parameters: bashSchema,
  defaultPermission: "ask",
  execute: async (params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> => {
    return new Promise((resolve) => {
      const { spawn } = require("child_process")
      const timeout = (params.timeout as number) || 60000
      
      const proc = spawn("bash", ["-c", params.command as string], {
        cwd: ctx.workingDir,
        timeout,
      })
      
      let stdout = ""
      let stderr = ""
      let resolved = false
      
      const cleanup = () => {
        // Remove all listeners to prevent memory leaks
        proc.stdout.removeAllListeners("data")
        proc.stderr.removeAllListeners("data")
        proc.removeAllListeners("close")
        proc.removeAllListeners("error")
      }
      
      proc.stdout.on("data", (data: Buffer) => {
        stdout += data.toString()
      })
      
      proc.stderr.on("data", (data: Buffer) => {
        stderr += data.toString()
      })
      
      proc.on("close", (code: number) => {
        if (resolved) return
        resolved = true
        cleanup()
        resolve({
          success: code === 0,
          content: stdout,
          error: stderr || undefined,
          metadata: { exitCode: code },
        })
      })
      
      proc.on("error", (error: Error) => {
        if (resolved) return
        resolved = true
        cleanup()
        // Kill the process if it's still running
        if (!proc.killed) {
          proc.kill()
        }
        resolve({
          success: false,
          content: "",
          error: error.message,
        })
      })
    })
  },
}

// ============ GLOB TOOL ============

const globSchema = z.object({
  pattern: z.string().describe("Glob pattern to match files"),
  path: z.string().optional().describe("Directory to search in"),
})

// Simple glob matching
function matchGlob(filepath: string, pattern: string): boolean {
  const regex = new RegExp(
    "^" +
      pattern
        .replace(/\*\*/g, "<<<DOUBLESTAR>>>")
        .replace(/\*/g, "[^/]*")
        .replace(/<<<DOUBLESTAR>>>/g, ".*")
        .replace(/\?/g, "[^/]")
        .replace(/\./g, "\\.") +
      "$"
  )
  return regex.test(filepath)
}

export const globTool: Tool = {
  name: "glob",
  description: "Find files matching a glob pattern",
  parameters: globSchema,
  defaultPermission: "auto",
  execute: async (params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> => {
    try {
      const fs = await import("fs/promises")
      const path = await import("path")
      
      // Validate path to prevent traversal attacks
      const pathValidation = validatePath(ctx.workingDir, (params.path as string) || ".")
      if (!pathValidation.valid) {
        return {
          success: false,
          content: "",
          error: pathValidation.error,
        }
      }
      
      const searchDir = pathValidation.resolvedPath
      const pattern = params.pattern as string
      
      const files: string[] = []
      
      async function walk(dir: string): Promise<void> {
        const entries = await fs.readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
              await walk(fullPath)
            }
          } else if (entry.isFile()) {
            const relativePath = path.relative(searchDir, fullPath)
            if (matchGlob(relativePath, pattern)) {
              files.push(relativePath)
            }
          }
        }
      }
      
      await walk(searchDir)
      
      return {
        success: true,
        content: files.join("\n"),
        metadata: { count: files.length },
      }
    } catch (error) {
      return {
        success: false,
        content: "",
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
}

// ============ GREP TOOL ============

// ============ GREP TOOL (ripgrep-first) ============

const grepSchema = z.object({
  pattern: z.string().describe("Pattern to search for (string or regex)"),
  path: z.string().optional().describe("Directory or file to search in"),
  include: z.string().optional().describe("Glob pattern to include (e.g. '*.ts')"),
  exclude: z.string().optional().describe("Glob pattern to exclude"),
  caseInsensitive: z.boolean().optional().describe("Case-insensitive search"),
  maxResults: z.number().optional().describe("Max results to return (default 200)"),
})

/** Check if ripgrep is available on the system */
async function hasRipgrep(): Promise<boolean> {
  const { execFile } = await import("child_process")
  return new Promise((resolve) => {
    execFile("rg", ["--version"], (err) => resolve(!err))
  })
}

/** Shell out to ripgrep — fast, respects .gitignore, handles binary files */
async function grepWithRipgrep(
  pattern: string,
  searchDir: string,
  opts: { include?: string; exclude?: string; caseInsensitive?: boolean; maxResults?: number }
): Promise<ToolResult> {
  const { execFile } = await import("child_process")
  const args = [
    "--no-heading",       // don't print file header per match
    "--line-number",      // show line numbers
    "--color=never",      // no ANSI colors
    "--max-count=500",    // cap matches per file
  ]

  if (opts.caseInsensitive) args.push("-i")
  if (opts.include) args.push("--glob", opts.include)
  if (opts.exclude) args.push("--glob", `!${opts.exclude}`)
  args.push("--max-count", "500")

  args.push(pattern, searchDir)

  return new Promise((resolve) => {
    execFile("rg", args, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err && err.code === 1) {
        // rg exits with code 1 when no matches found
        return resolve({ success: true, content: "No matches found.", metadata: { matches: 0 } })
      }
      if (err) {
        return resolve({ success: false, content: "", error: `ripgrep error: ${err.message}` })
      }

      const lines = stdout.trim().split("\n").filter(Boolean)
      const maxResults = opts.maxResults || 200
      const truncated = lines.length > maxResults
      const results = lines.slice(0, maxResults)

      resolve({
        success: true,
        content: results.join("\n"),
        metadata: { matches: lines.length, truncated },
      })
    })
  })
}

/** Pure JS fallback — streaming, binary-safe, .gitignore-aware */
async function grepWithJS(
  pattern: string,
  searchDir: string,
  opts: { include?: string; exclude?: string; caseInsensitive?: boolean; maxResults?: number }
): Promise<ToolResult> {
  const fs = await import("fs/promises")
  const path = await import("path")
  const { createReadStream } = await import("fs")
  const readline = await import("readline")

  const maxResults = opts.maxResults || 200
  const maxFileSize = 1024 * 1024 // skip files > 1MB
  const results: string[] = []
  let totalMatches = 0
  const regex = new RegExp(
    pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), // escape for literal match
    opts.caseInsensitive ? "i" : ""
  )

  // Load .gitignore patterns (simple)
  let ignorePatterns: string[] = ["node_modules", ".git", "dist", ".next", "__pycache__", ".cache"]
  try {
    const gitignore = await fs.readFile(path.join(searchDir, ".gitignore"), "utf-8")
    ignorePatterns.push(...gitignore.split("\n").map(l => l.trim()).filter(l => l && !l.startsWith("#")))
  } catch { /* no .gitignore */ }

  function isIgnored(relPath: string): boolean {
    return ignorePatterns.some(p => relPath.startsWith(p) || relPath.includes("/" + p + "/"))
  }

  function isBinary(chunk: Buffer): boolean {
    for (let i = 0; i < Math.min(chunk.length, 8192); i++) {
      if (chunk[i] === 0) return true
    }
    return false
  }

  async function searchFile(filePath: string): Promise<void> {
    try {
      const stat = await fs.stat(filePath)
      if (stat.size > maxFileSize) return

      // Quick binary check on first 8KB
      const handle = await fs.open(filePath, "r")
      const header = Buffer.alloc(8192)
      await handle.read(header, 0, 8192, 0)
      await handle.close()
      if (isBinary(header)) return

      // Stream line by line
      const rl = readline.createInterface({ input: createReadStream(filePath), crlfDelay: Infinity })
      let lineNum = 0
      const relativePath = path.relative(searchDir, filePath)

      for await (const line of rl) {
        lineNum++
        if (regex.test(line)) {
          results.push(`${relativePath}:${lineNum}: ${line.trim()}`)
          totalMatches++
          if (totalMatches >= maxResults) {
            rl.close()
            return
          }
        }
      }
    } catch { /* skip unreadable */ }
  }

  async function walk(dir: string): Promise<void> {
    if (totalMatches >= maxResults) return
    let entries
    try { entries = await fs.readdir(dir, { withFileTypes: true }) } catch { return }

    for (const entry of entries) {
      if (totalMatches >= maxResults) return
      const fullPath = path.join(dir, entry.name)
      const relativePath = path.relative(searchDir, fullPath)

      if (entry.isDirectory()) {
        if (!isIgnored(relativePath)) await walk(fullPath)
      } else if (entry.isFile()) {
        if (isIgnored(relativePath)) continue
        if (opts.include && !matchGlob(relativePath, opts.include)) continue
        await searchFile(fullPath)
      }
    }
  }

  await walk(searchDir)

  return {
    success: true,
    content: results.length ? results.join("\n") : "No matches found.",
    metadata: { matches: totalMatches, truncated: totalMatches >= maxResults },
  }
}

export const grepTool: Tool = {
  name: "grep",
  description: "Search for a pattern in files (uses ripgrep when available, falls back to JS)",
  parameters: grepSchema,
  defaultPermission: "auto",
  execute: async (params: Record<string, unknown>, ctx: ToolContext): Promise<ToolResult> => {
    const pathModule = await import("path")

    // Validate path to prevent traversal attacks
    const pathValidation = validatePath(ctx.workingDir, (params.path as string) || ".")
    if (!pathValidation.valid) {
      return { success: false, content: "", error: pathValidation.error }
    }

    const searchDir = pathValidation.resolvedPath
    const opts = {
      include: params.include as string | undefined,
      exclude: params.exclude as string | undefined,
      caseInsensitive: params.caseInsensitive as boolean | undefined,
      maxResults: (params.maxResults as number) || 200,
    }

    // Use ripgrep if available, otherwise fall back to pure JS
    if (await hasRipgrep()) {
      return grepWithRipgrep(params.pattern as string, searchDir, opts)
    }
    return grepWithJS(params.pattern as string, searchDir, opts)
  },
}

// ============ LIST TOOLS ============

export const builtinTools: Tool[] = [
  readFileTool,
  writeFileTool,
  editFileTool,
  bashTool,
  globTool,
  grepTool,
]
