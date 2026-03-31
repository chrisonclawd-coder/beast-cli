/**
 * Beast CLI — Session Resume
 * Recover interrupted sessions (from Claude Code)
 */
import * as fs from "fs/promises";
import * as path from "path";
export const DEFAULT_RESUME_CONFIG = {
    enabled: true,
    autoSaveIntervalMs: 30000,
    maxCheckpoints: 50,
    resumeDir: ".beast/resume",
};
export class SessionResume {
    config;
    constructor(config) {
        this.config = { ...DEFAULT_RESUME_CONFIG, ...config };
    }
    /** Initialize resume directory */
    async init() {
        await fs.mkdir(this.config.resumeDir, { recursive: true });
    }
    /** Save a checkpoint */
    async saveCheckpoint(checkpoint) {
        await this.init();
        const filePath = path.join(this.config.resumeDir, `${checkpoint.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(checkpoint, null, 2), "utf-8");
        // Prune old checkpoints
        await this.pruneCheckpoints();
    }
    /** Load a checkpoint by ID */
    async loadCheckpoint(id) {
        try {
            const filePath = path.join(this.config.resumeDir, `${id}.json`);
            const content = await fs.readFile(filePath, "utf-8");
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
    /** Find the latest checkpoint for a session */
    async findLatest(sessionId) {
        await this.init();
        const files = await fs.readdir(this.config.resumeDir);
        const checkpoints = [];
        for (const file of files) {
            if (!file.endsWith(".json"))
                continue;
            try {
                const content = await fs.readFile(path.join(this.config.resumeDir, file), "utf-8");
                const cp = JSON.parse(content);
                if (!sessionId || cp.sessionId === sessionId) {
                    checkpoints.push(cp);
                }
            }
            catch {
                // Skip invalid files
            }
        }
        if (checkpoints.length === 0)
            return null;
        checkpoints.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return checkpoints[0];
    }
    /** List all checkpoints */
    async listCheckpoints() {
        await this.init();
        const files = await fs.readdir(this.config.resumeDir);
        const checkpoints = [];
        for (const file of files) {
            if (!file.endsWith(".json"))
                continue;
            try {
                const content = await fs.readFile(path.join(this.config.resumeDir, file), "utf-8");
                checkpoints.push(JSON.parse(content));
            }
            catch {
                // Skip invalid
            }
        }
        return checkpoints.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    /** Delete a checkpoint */
    async deleteCheckpoint(id) {
        try {
            await fs.unlink(path.join(this.config.resumeDir, `${id}.json`));
            return true;
        }
        catch {
            return false;
        }
    }
    /** Prune old checkpoints beyond maxCheckpoints */
    async pruneCheckpoints() {
        const checkpoints = await this.listCheckpoints();
        if (checkpoints.length <= this.config.maxCheckpoints)
            return;
        const toDelete = checkpoints.slice(this.config.maxCheckpoints);
        for (const cp of toDelete) {
            await this.deleteCheckpoint(cp.id);
        }
    }
}
//# sourceMappingURL=resume.js.map