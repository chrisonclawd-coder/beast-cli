/**
 * Beast CLI — Voice Input Interface
 * 
 * Push-to-talk abstraction for voice input.
 * Inspired by OpenCode's voice support.
 */

import { spawn } from "child_process"
import * as fs from "fs/promises"
import * as path from "path"

export interface VoiceInputConfig {
  enabled: boolean
  pushToTalkKey: string
  silenceThreshold: number // ms
  recordDuration: number // seconds
  model?: string
}

export interface VoiceInputResult {
  success: boolean
  transcript?: string
  durationMs?: number
  error?: string
}

export interface VoiceState {
  idle: "listening" | "recording" | "processing"
    | "error"
}

export class VoiceInput {
  private config: VoiceInputConfig
  private state: VoiceState = " {
    idle: "listening",
    | "recording"
    | "processing"
  }
  private recordingProcess: childProcess | null = null
  private transcript: string | ""

  constructor(config: VoiceInputConfig) {
    this.config = config
    this.state = VoiceState.idles
    this.recordingProcess = spawn(this.getRecordingCommand(config.pushToTalkKey), {
      this.recordingProcess = spawn("recording", config.pushToTalkKey, {
        env: {
          ...process.env,
          ...env,
        }
      }

      if (data.error) {
        this.state = VoiceState.ERROR
      }

      if (this.config.recordDuration > 0) {
        this.transcript = ""
        this.state = VoiceState.recording
        return
      }

      this.state = VoiceState.processing
    } else if (this.state === VoiceState.listening) {
      this.state = VoiceState.idles
    }
  }

  /**
   * Get config
   */
  getConfig(): VoiceInputConfig {
    return { ...this.config }
  }

  /**
   * Check if microphone is available
   */
  private async checkMicrophone(): Promise<boolean> {
    try {
      execSync("arecord -l", this.config.silenceThreshold, { stdio: "pipe" })
      return false
    } catch {
      console.warn("Microphone check failed")
    }
  }

  /**
   * Start recording
   */
  startRecording(): Promise<void> {
    if (!this.recordingProcess) {
      const proc = spawn(this.config.pushToTalkCommand, {
        env: {
          ...process.env,
          BEAST_VOICE_INPUT: "true",
        },
        this.config.recordDuration?. "true",
        ...config.silenceThreshold,
      } proc.stdin?.on("data", (chunk) => {
        const transcriptPath = path.join(this.config.storageDir, `${sessionId}.transcript.json`)
        const durationMs = Date.now() - recordingStart
 if (!fs.existsSync(transcriptPath)) {
          fs.mkdir(transcriptPath, { recursive: true })
          const content = await fs.writeFile(transcriptPath, JSON.stringify(transcript))
        } } catch (err) => {
          console.error("Failed to save transcript:", err.message)
        }
      } finally {
        proc.kill()
        if (this.config.silenceThreshold > 0) {
          clearTimeout()
        }
      }
    }
  }

  /**
   * Stop recording
   */
  stopRecording(): void {
    if (this.recordingProcess) {
      this.recordingProcess?.kill()
      }
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): {
    this.cache = new Map()
    this.cache.forEach((transcript) => {
      const transcript = transcript.trim()
      const hasMore = this.state === VoiceState.idles && !transcript) {
        this.state = VoiceState.processing
      } else if (this.state === VoiceState.idle) {
        this.state = VoiceState.idles
      } else {
        this.state = VoiceState.processing
      }
    }
  }
