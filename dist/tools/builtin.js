/**
 * Beast CLI — Built-in Tools
 *
 * Core tools for file operations, shell commands, etc.
 * Inspired by OpenCode's tool set.
 */
import { z } from "zod";
// ============ FILE TOOLS ============
const readFileSchema = z.object({
    path: z.string().describe("File path to read"),
    offset: z.number().optional().describe("Line number to start reading from"),
    limit: z.number().optional().describe("Maximum number of lines to read"),
});
export const readFileTool = {
    name: "read",
    description: "Read the contents of a file. Returns file content as text.",
    parameters: readFileSchema,
    defaultPermission: "auto",
    execute: async (params, ctx) => {
        try {
            const fs = await import("fs/promises");
            const path = await import("path");
            const filePath = path.resolve(ctx.workingDir, params.path);
            const content = await fs.readFile(filePath, "utf-8");
            let lines = content.split("\n");
            const offset = params.offset || 1;
            const limit = params.limit || lines.length;
            // Adjust for 1-indexed offset
            const startLine = Math.max(0, offset - 1);
            const endLine = Math.min(lines.length, startLine + limit);
            const selectedLines = lines.slice(startLine, endLine);
            return {
                success: true,
                content: selectedLines.join("\n"),
                metadata: {
                    totalLines: lines.length,
                    returnedLines: selectedLines.length,
                    startLine: offset,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                content: "",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    },
};
const writeFileSchema = z.object({
    path: z.string().describe("File path to write"),
    content: z.string().describe("Content to write to the file"),
});
export const writeFileTool = {
    name: "write",
    description: "Write content to a file. Creates the file if it doesn't exist, overwrites if it does.",
    parameters: writeFileSchema,
    defaultPermission: "ask",
    execute: async (params, ctx) => {
        try {
            const fs = await import("fs/promises");
            const path = await import("path");
            const filePath = path.resolve(ctx.workingDir, params.path);
            // Ensure directory exists
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(filePath, params.content, "utf-8");
            return {
                success: true,
                content: `Successfully wrote to ${params.path}`,
            };
        }
        catch (error) {
            return {
                success: false,
                content: "",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    },
};
const editFileSchema = z.object({
    path: z.string().describe("File path to edit"),
    oldText: z.string().describe("Text to find and replace"),
    newText: z.string().describe("Replacement text"),
});
export const editFileTool = {
    name: "edit",
    description: "Edit a file by replacing specific text. Finds oldText and replaces it with newText.",
    parameters: editFileSchema,
    defaultPermission: "ask",
    execute: async (params, ctx) => {
        try {
            const fs = await import("fs/promises");
            const path = await import("path");
            const filePath = path.resolve(ctx.workingDir, params.path);
            const content = await fs.readFile(filePath, "utf-8");
            const oldText = params.oldText;
            const newText = params.newText;
            if (!content.includes(oldText)) {
                return {
                    success: false,
                    content: "",
                    error: `Text not found in file: "${oldText.slice(0, 50)}..."`,
                };
            }
            const newContent = content.replace(oldText, newText);
            await fs.writeFile(filePath, newContent, "utf-8");
            return {
                success: true,
                content: `Successfully edited ${params.path}`,
            };
        }
        catch (error) {
            return {
                success: false,
                content: "",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    },
};
// ============ SHELL TOOL ============
const bashSchema = z.object({
    command: z.string().describe("Shell command to execute"),
    timeout: z.number().optional().describe("Timeout in milliseconds"),
});
export const bashTool = {
    name: "bash",
    description: "Execute a shell command. Use with caution.",
    parameters: bashSchema,
    defaultPermission: "ask",
    execute: async (params, ctx) => {
        return new Promise((resolve) => {
            const { spawn } = require("child_process");
            const timeout = params.timeout || 60000;
            const proc = spawn("bash", ["-c", params.command], {
                cwd: ctx.workingDir,
                timeout,
            });
            let stdout = "";
            let stderr = "";
            proc.stdout.on("data", (data) => {
                stdout += data.toString();
            });
            proc.stderr.on("data", (data) => {
                stderr += data.toString();
            });
            proc.on("close", (code) => {
                resolve({
                    success: code === 0,
                    content: stdout,
                    error: stderr || undefined,
                    metadata: { exitCode: code },
                });
            });
            proc.on("error", (error) => {
                resolve({
                    success: false,
                    content: "",
                    error: error.message,
                });
            });
        });
    },
};
// ============ GLOB TOOL ============
const globSchema = z.object({
    pattern: z.string().describe("Glob pattern to match files"),
    path: z.string().optional().describe("Directory to search in"),
});
// Simple glob matching
function matchGlob(filepath, pattern) {
    const regex = new RegExp("^" +
        pattern
            .replace(/\*\*/g, "<<<DOUBLESTAR>>>")
            .replace(/\*/g, "[^/]*")
            .replace(/<<<DOUBLESTAR>>>/g, ".*")
            .replace(/\?/g, "[^/]")
            .replace(/\./g, "\\.") +
        "$");
    return regex.test(filepath);
}
export const globTool = {
    name: "glob",
    description: "Find files matching a glob pattern",
    parameters: globSchema,
    defaultPermission: "auto",
    execute: async (params, ctx) => {
        try {
            const fs = await import("fs/promises");
            const path = await import("path");
            const searchDir = path.resolve(ctx.workingDir, params.path || ".");
            const pattern = params.pattern;
            const files = [];
            async function walk(dir) {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
                            await walk(fullPath);
                        }
                    }
                    else if (entry.isFile()) {
                        const relativePath = path.relative(searchDir, fullPath);
                        if (matchGlob(relativePath, pattern)) {
                            files.push(relativePath);
                        }
                    }
                }
            }
            await walk(searchDir);
            return {
                success: true,
                content: files.join("\n"),
                metadata: { count: files.length },
            };
        }
        catch (error) {
            return {
                success: false,
                content: "",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    },
};
// ============ GREP TOOL ============
const grepSchema = z.object({
    pattern: z.string().describe("Pattern to search for"),
    path: z.string().optional().describe("Directory or file to search in"),
    include: z.string().optional().describe("File pattern to include"),
});
export const grepTool = {
    name: "grep",
    description: "Search for a pattern in files",
    parameters: grepSchema,
    defaultPermission: "auto",
    execute: async (params, ctx) => {
        try {
            const fs = await import("fs/promises");
            const path = await import("path");
            const searchDir = path.resolve(ctx.workingDir, params.path || ".");
            const pattern = params.pattern;
            const includePattern = params.include || "*";
            const results = [];
            async function searchFile(filePath) {
                try {
                    const content = await fs.readFile(filePath, "utf-8");
                    const lines = content.split("\n");
                    const relativePath = path.relative(searchDir, filePath);
                    lines.forEach((line, index) => {
                        if (line.includes(pattern)) {
                            results.push(`${relativePath}:${index + 1}: ${line.trim()}`);
                        }
                    });
                }
                catch {
                    // Skip binary or unreadable files
                }
            }
            async function walk(dir) {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    if (entry.isDirectory()) {
                        if (!entry.name.startsWith(".") && entry.name !== "node_modules") {
                            await walk(fullPath);
                        }
                    }
                    else if (entry.isFile()) {
                        const relativePath = path.relative(searchDir, fullPath);
                        if (matchGlob(relativePath, includePattern)) {
                            await searchFile(fullPath);
                        }
                    }
                }
            }
            await walk(searchDir);
            return {
                success: true,
                content: results.slice(0, 100).join("\n"),
                metadata: { matches: results.length, truncated: results.length > 100 },
            };
        }
        catch (error) {
            return {
                success: false,
                content: "",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    },
};
// ============ LIST TOOLS ============
export const builtinTools = [
    readFileTool,
    writeFileTool,
    editFileTool,
    bashTool,
    globTool,
    grepTool,
];
//# sourceMappingURL=builtin.js.map