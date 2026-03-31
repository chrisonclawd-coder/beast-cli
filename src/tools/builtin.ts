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
      
      proc.stdout.on("data", (data: Buffer) => {
        stdout += data.toString()
      })
      
      proc.stderr.on("data", (data: Buffer) => {
        stderr += data.toString()
      })
      
      proc.on("close", (code: number) => {
        resolve({
          success: code === 0,
          content: stdout,
          error: stderr || undefined,
          metadata: { exitCode: code },
        })
      })
      
      proc.on("error", (error: Error) => {
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

const grepSchema = z.object({
  pattern: z.string().describe("Pattern to search for"),
  path: z.string().optional().describe("Directory or file to search in"),
  include: z.string().optional().describe("File pattern to include"),
})

export const grepTool: Tool = {
  name: "grep",
  description: "Search for a pattern in files",
  parameters: grepSchema,
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
      const includePattern = (params.include as string) || "*"
      
      const results: string[] = []
      
      async function searchFile(filePath: string): Promise<void> {
        try {
          const content = await fs.readFile(filePath, "utf-8")
          const lines = content.split("\n")
          const relativePath = path.relative(searchDir, filePath)
          
          lines.forEach((line, index) => {
            if (line.includes(pattern)) {
              results.push(`${relativePath}:${index + 1}: ${line.trim()}`)
            }
          })
        } catch {
          // Skip binary or unreadable files
        }
      }
      
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
            if (matchGlob(relativePath, includePattern)) {
              await searchFile(fullPath)
            }
          }
        }
      }
      
      await walk(searchDir)
      
      return {
        success: true,
        content: results.slice(0, 100).join("\n"),
        metadata: { matches: results.length, truncated: results.length > 100 },
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

// ============ LIST TOOLS ============

export const builtinTools: Tool[] = [
  readFileTool,
  writeFileTool,
  editFileTool,
  bashTool,
  globTool,
  grepTool,
]
