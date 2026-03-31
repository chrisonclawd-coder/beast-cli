/**
 * Beast CLI — Hooks Executor
 *
 * Execute hooks on various events.
 * Inspired by Claude Code's hooks system.
 */
import { spawn } from "child_process";
/**
 * Hook Executor - runs hook commands on events
 */
export class HookExecutor {
    config;
    hooks = new Map();
    runningHooks = new Set();
    constructor(config) {
        this.config = config;
    }
    /**
     * Register hooks from config
     */
    register(hooks) {
        this.hooks.clear();
        for (const [event, commands] of Object.entries(hooks)) {
            const hookEvent = event;
            if (!isValidHookEvent(hookEvent)) {
                console.warn(`Unknown hook event: ${event}`);
                continue;
            }
            const hookList = commands.map(cmd => ({
                event: hookEvent,
                command: cmd,
                timeout: this.config.timeout,
            }));
            this.hooks.set(hookEvent, hookList);
        }
    }
    /**
     * Add a single hook
     */
    addHook(hook) {
        const existing = this.hooks.get(hook.event) || [];
        existing.push(hook);
        this.hooks.set(hook.event, existing);
    }
    /**
     * Remove a hook
     */
    removeHook(event, command) {
        const hooks = this.hooks.get(event);
        if (!hooks)
            return false;
        const index = hooks.findIndex(h => h.command === command);
        if (index >= 0) {
            hooks.splice(index, 1);
            return true;
        }
        return false;
    }
    /**
     * Execute all hooks for an event
     */
    async execute(event, context = {}) {
        if (!this.config.enabled) {
            return [];
        }
        const hooks = this.hooks.get(event);
        if (!hooks || hooks.length === 0) {
            return [];
        }
        const fullContext = {
            event,
            timestamp: Date.now(),
            ...context,
        };
        const results = [];
        for (const hook of hooks) {
            // Check condition if present
            if (hook.condition && !this.evaluateCondition(hook.condition, fullContext)) {
                continue;
            }
            const result = await this.executeHook(hook, fullContext);
            results.push(result);
            // If a hook fails, we continue but record the failure
            if (!result.success) {
                console.warn(`Hook failed: ${hook.command}`);
            }
        }
        return results;
    }
    /**
     * Execute a single hook command
     */
    async executeHook(hook, context) {
        const startTime = Date.now();
        const hookId = `${hook.event}:${hook.command}`;
        // Prevent duplicate execution
        if (this.runningHooks.has(hookId)) {
            return {
                hook,
                success: false,
                output: "",
                durationMs: 0,
                error: "Hook already running",
            };
        }
        this.runningHooks.add(hookId);
        try {
            const result = await this.runCommand(hook.command, context, hook.timeout || this.config.timeout);
            return {
                hook,
                success: result.exitCode === 0,
                output: result.stdout + result.stderr,
                durationMs: Date.now() - startTime,
                error: result.exitCode !== 0 ? `Exit code: ${result.exitCode}` : undefined,
            };
        }
        catch (error) {
            return {
                hook,
                success: false,
                output: "",
                durationMs: Date.now() - startTime,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
        finally {
            this.runningHooks.delete(hookId);
        }
    }
    /**
     * Run a shell command
     */
    runCommand(command, context, timeout) {
        return new Promise((resolve) => {
            const env = {
                ...process.env,
                ...this.config.env,
                BEAST_EVENT: context.event,
                BEAST_TOOL: context.tool || "",
                BEAST_SESSION: context.session || "",
                BEAST_TIMESTAMP: String(context.timestamp),
            };
            if (context.params) {
                env.BEAST_PARAMS = JSON.stringify(context.params);
            }
            const proc = spawn(command, [], {
                cwd: this.config.projectRoot,
                shell: true,
                env,
                timeout,
            });
            let stdout = "";
            let stderr = "";
            proc.stdout?.on("data", (data) => {
                stdout += data.toString();
            });
            proc.stderr?.on("data", (data) => {
                stderr += data.toString();
            });
            proc.on("close", (code) => {
                resolve({
                    exitCode: code ?? 1,
                    stdout,
                    stderr,
                });
            });
            proc.on("error", (err) => {
                resolve({
                    exitCode: 1,
                    stdout,
                    stderr: err.message,
                });
            });
        });
    }
    /**
     * Evaluate a hook condition
     */
    evaluateCondition(condition, context) {
        try {
            // Simple condition evaluation
            // Supports: tool=="read", params.path contains "secret", etc.
            const fn = new Function("tool", "params", "result", "session", `return ${condition}`);
            return fn(context.tool, context.params, context.result, context.session);
        }
        catch {
            console.warn(`Invalid hook condition: ${condition}`);
            return false;
        }
    }
    /**
     * Get all registered hooks
     */
    getHooks(event) {
        if (event) {
            return this.hooks.get(event) || [];
        }
        const all = [];
        for (const hooks of this.hooks.values()) {
            all.push(...hooks);
        }
        return all;
    }
    /**
     * Clear all hooks
     */
    clear() {
        this.hooks.clear();
    }
}
/**
 * Check if an event is a valid hook event
 */
function isValidHookEvent(event) {
    const validEvents = [
        "beforeToolCall",
        "afterToolCall",
        "beforeFileWrite",
        "afterFileWrite",
        "beforeBash",
        "afterBash",
        "onSessionStart",
        "onSessionEnd",
        "onCompaction",
        "onError",
    ];
    return validEvents.includes(event);
}
/**
 * Create a hook executor
 */
export function createHookExecutor(projectRoot, options) {
    return new HookExecutor({
        projectRoot,
        timeout: 30000,
        enabled: true,
        ...options,
    });
}
// Global hook executor
let globalHookExecutor = null;
export function getHookExecutor(projectRoot) {
    if (!globalHookExecutor || projectRoot) {
        globalHookExecutor = createHookExecutor(projectRoot || process.cwd());
    }
    return globalHookExecutor;
}
//# sourceMappingURL=executor.js.map