/**
 * Beast CLI — Voice Input Interface
 * Push-to-talk abstraction (from Gemini CLI)
 */
export class VoiceInput {
    config;
    process = null;
    isRecording = false;
    constructor(config = {}) {
        this.config = {
            enabled: false,
            provider: "system",
            language: "en-US",
            pushToTalkKey: "space",
            silenceTimeoutMs: 3000,
            ...config,
        };
    }
    /** Start recording audio */
    async startRecording() {
        if (this.isRecording)
            return;
        this.isRecording = true;
        // Implementation depends on provider
        // system: uses OS-level speech recognition
        // whisper: spawns whisper.cpp or API call
        // google: uses Google Speech-to-Text API
    }
    /** Stop recording and transcribe */
    async stopRecording() {
        if (!this.isRecording) {
            return { text: "", confidence: 0, durationMs: 0 };
        }
        this.isRecording = false;
        // For now, return placeholder
        // Real implementation would process audio buffer
        return {
            text: "",
            confidence: 0,
            durationMs: 0,
        };
    }
    /** Toggle recording state */
    async toggle() {
        if (this.isRecording) {
            return this.stopRecording();
        }
        else {
            await this.startRecording();
            return null;
        }
    }
    /** Check if currently recording */
    getIsRecording() {
        return this.isRecording;
    }
    /** Clean up resources */
    dispose() {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
        this.isRecording = false;
    }
}
/** Check if voice input is available on this system */
export async function isVoiceAvailable() {
    // Check for system-level speech recognition or whisper binary
    return false; // placeholder
}
//# sourceMappingURL=interface.js.map