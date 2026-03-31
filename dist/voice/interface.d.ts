/**
 * Beast CLI — Voice Input Interface
 * Push-to-talk abstraction (from Gemini CLI)
 */
export interface VoiceConfig {
    enabled: boolean;
    provider: "system" | "whisper" | "google";
    language: string;
    pushToTalkKey: string;
    silenceTimeoutMs: number;
}
export interface VoiceResult {
    text: string;
    confidence: number;
    durationMs: number;
}
export declare class VoiceInput {
    private config;
    private process;
    private isRecording;
    constructor(config?: Partial<VoiceConfig>);
    /** Start recording audio */
    startRecording(): Promise<void>;
    /** Stop recording and transcribe */
    stopRecording(): Promise<VoiceResult>;
    /** Toggle recording state */
    toggle(): Promise<VoiceResult | null>;
    /** Check if currently recording */
    getIsRecording(): boolean;
    /** Clean up resources */
    dispose(): void;
}
/** Check if voice input is available on this system */
export declare function isVoiceAvailable(): Promise<boolean>;
