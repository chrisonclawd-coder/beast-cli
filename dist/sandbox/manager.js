/**
 * Beast CLI — Sandbox Configuration
 *
 * OS-level isolation configuration for secure tool execution.
 * Inspired by Claude Code's sandbox system.
 */
// Default sandbox config
export const DEFAULT_SANDBOX_CONFIG = {
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
};
/**
 * Sandbox Manager - handles secure command execution
 */
export class SandboxManager {
    config;
    projectRoot;
    constructor(config, projectRoot) {
        this.config = { ...DEFAULT_SANDBOX_CONFIG, ...config };
        this.projectRoot = projectRoot;
    }
    /**
     * Get current config
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update config
     */
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
    }
    /**
     * Execute a command in the sandbox
     */
    async execute(options) {
        if (!this.config.enabled) {
            return this.executeDirect(options);
        }
        switch (this.config.backend) {
            case "docker":
                return this.executeDocker(options);
            case "bwrap":
                return this.executeBwrap(options);
            case "firejail":
                return this.executeFirejail(options);
            case "nsjail":
                return this.executeNsjail(options);
            default:
                return this.executeDirect(options);
        }
    }
    /**
     * Execute directly (no sandbox)
     */
    async executeDirect(options) {
        const { spawn } = await import("child_process");
        return new Promise((resolve) => {
            const proc = spawn(options.command, options.args, {
                cwd: options.cwd,
                env: options.env || process.env,
                timeout: options.timeout || this.config.timeoutMs,
            });
            let stdout = "";
            let stderr = "";
            proc.stdout?.on("data", (data) => { stdout += data.toString(); });
            proc.stderr?.on("data", (data) => { stderr += data.toString(); });
            proc.on("close", (code) => {
                resolve({
                    exitCode: code ?? 1,
                    stdout,
                    stderr,
                    timedOut: false,
                });
            });
            proc.on("error", (err) => {
                resolve({
                    exitCode: 1,
                    stdout,
                    stderr: err.message,
                    timedOut: false,
                });
            });
        });
    }
    /**
     * Execute in Docker container
     */
    async executeDocker(options) {
        const { spawn } = await import("child_process");
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
        ];
        return new Promise((resolve) => {
            const proc = spawn("docker", dockerArgs, { timeout: this.config.timeoutMs });
            let stdout = "";
            let stderr = "";
            proc.stdout?.on("data", (data) => { stdout += data.toString(); });
            proc.stderr?.on("data", (data) => { stderr += data.toString(); });
            proc.on("close", (code) => {
                resolve({
                    exitCode: code ?? 1,
                    stdout,
                    stderr,
                    timedOut: false,
                });
            });
            proc.on("error", (err) => {
                resolve({
                    exitCode: 1,
                    stdout,
                    stderr: err.message,
                    timedOut: false,
                });
            });
        });
    }
    /**
     * Build Docker network arguments
     */
    buildDockerNetworkArgs() {
        if (!this.config.networkAccess) {
            return ["--network", "none"];
        }
        return [];
    }
    /**
     * Execute with bubblewrap (bwrap)
     */
    async executeBwrap(options) {
        const { spawn } = await import("child_process");
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
        ];
        return new Promise((resolve) => {
            const proc = spawn("bwrap", bwrapArgs, {
                cwd: options.cwd,
                timeout: this.config.timeoutMs,
            });
            let stdout = "";
            let stderr = "";
            proc.stdout?.on("data", (data) => { stdout += data.toString(); });
            proc.stderr?.on("data", (data) => { stderr += data.toString(); });
            proc.on("close", (code) => {
                resolve({
                    exitCode: code ?? 1,
                    stdout,
                    stderr,
                    timedOut: false,
                });
            });
            proc.on("error", () => {
                // Fallback to direct execution if bwrap not available
                this.executeDirect(options).then(resolve);
            });
        });
    }
    /**
     * Build bwrap path arguments
     */
    buildBwrapPathArgs() {
        const args = [];
        for (const path of this.config.allowedPaths) {
            args.push("--ro-bind", path, path);
        }
        for (const path of this.config.readOnlyPaths) {
            args.push("--ro-bind", path, path);
        }
        return args;
    }
    /**
     * Execute with firejail
     */
    async executeFirejail(options) {
        const { spawn } = await import("child_process");
        const firejailArgs = [
            "--quiet",
            "--private",
            `--whitelist=${this.projectRoot}`,
            "--noprofile",
            this.config.networkAccess ? "" : "--net=none",
            "--",
            options.command,
            ...options.args,
        ].filter(Boolean);
        return new Promise((resolve) => {
            const proc = spawn("firejail", firejailArgs, {
                cwd: options.cwd,
                timeout: this.config.timeoutMs,
            });
            let stdout = "";
            let stderr = "";
            proc.stdout?.on("data", (data) => { stdout += data.toString(); });
            proc.stderr?.on("data", (data) => { stderr += data.toString(); });
            proc.on("close", (code) => {
                resolve({
                    exitCode: code ?? 1,
                    stdout,
                    stderr,
                    timedOut: false,
                });
            });
            proc.on("error", () => {
                this.executeDirect(options).then(resolve);
            });
        });
    }
    /**
     * Execute with nsjail
     */
    async executeNsjail(options) {
        // nsjail requires a config file, fall back to direct for now
        console.warn("nsjail backend not yet implemented, using direct execution");
        return this.executeDirect(options);
    }
    /**
     * Check if a backend is available
     */
    static async checkBackend(backend) {
        if (backend === "none")
            return true;
        const commands = {
            none: "true",
            docker: "docker --version",
            bwrap: "bwrap --version",
            nsjail: "nsjail --help",
            firejail: "firejail --version",
        };
        try {
            const { execSync } = await import("child_process");
            execSync(commands[backend], { stdio: "pipe" });
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get available backends
     */
    static async getAvailableBackends() {
        const backends = ["none", "docker", "bwrap", "firejail", "nsjail"];
        const available = [];
        for (const backend of backends) {
            if (await this.checkBackend(backend)) {
                available.push(backend);
            }
        }
        return available;
    }
}
/**
 * Create a sandbox manager
 */
export function createSandboxManager(config = {}, projectRoot = process.cwd()) {
    return new SandboxManager(config, projectRoot);
}
// Global sandbox manager
let globalSandbox = null;
export function getSandboxManager(projectRoot) {
    if (!globalSandbox || projectRoot) {
        globalSandbox = createSandboxManager({}, projectRoot || process.cwd());
    }
    return globalSandbox;
}
//# sourceMappingURL=manager.js.map