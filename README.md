# 🦁 Beast CLI

> The ultimate AI coding agent — born from the best of Claude Code, Gemini CLI, OpenCode, and Codex CLI.

## What is Beast?

Beast CLI is a provider-agnostic AI coding assistant that combines the best features from the top coding agents:

- **From Claude Code:** Tool permissions, agent swarms, voice input, auto-compaction, skills + hooks, MCP, vim mode
- **From Gemini CLI:** Free tier support, feature flags, Zod validation
- **From OpenCode:** Dual-agent plan/execute, git-backed sessions, Ink TUI, provider-agnostic design
- **From Codex CLI:** OS-level sandbox, cloud delegation, web search

## Features

| Feature | Description |
|---------|-------------|
| 🔄 Multi-provider | OpenAI, Anthropic, Google — pick your AI |
| 🛠️ Tool system | Built-in tools with permission checks |
| 🧠 Dual agents | Plan mode (read-only) + Execute mode |
| 📦 Skills | Load custom skills from `.beast/skills/` |
| 🪝 Hooks | Run commands on events (before/after tool calls) |
| 🐜 Swarm | Parallel agents with git worktrees |
| 🔍 Web search | Cached + live search abstraction |
| 🚩 Feature flags | Enable/disable features per project |
| 🏖️ Sandbox | OS-level isolation configuration |
| ☁️ Cloud | Offload tasks to cloud providers |
| 💾 Session resume | Recover interrupted sessions |
| 🎤 Voice | Push-to-talk input |
| 📉 Auto-compaction | Compress context when it gets too long |
| ⌨️ Vim mode | hjkl navigation, insert/normal modes |
| 🔌 MCP | Model Context Protocol client |
| 📊 Utils | Logging, formatting, timer helpers |

## Quick Start

```bash
# Install dependencies
cd beast-cli && npm install

# Link globally
npm link

# Set an API key
export OPENAI_API_KEY=sk-...

# Start chatting
beast chat

# Or specify a provider/model
beast chat openai gpt-4o
```

## Commands

```bash
beast init [path]               # Initialize Beast in a project
beast chat [provider] [model]   # Start interactive chat (default)
beast config [key] [value]      # Get/set configuration
beast features                  # List feature flags
beast resume [session-id]       # List or resume sessions
```

## Chat Slash Commands

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/plan` | Analyze without making changes |
| `/compact` | Compress conversation context |
| `/clear` | Clear conversation history |
| `/quit` | Exit Beast |

## Configuration

Beast reads config from `.beast/config.json` in your project root:

```json
{
  "provider": "openai",
  "model": "gpt-4o",
  "apiKey": "sk-...",
  "features": {
    "vim": true,
    "voice": false,
    "websearch": true,
    "mcp": true,
    "cloud": false,
    "sandbox": false,
    "swarm": false
  }
}
```

## Architecture

```
src/
├── agents/         # Execute + Plan agents with streaming
├── cli/            # CLI commands (init, chat, config, etc.)
├── cloud/          # Cloud delegation interface
├── compaction/     # Auto-context compression
├── config/         # Config management with Zod
├── features/       # Feature flags
├── hooks/          # Event hooks executor
├── mcp/            # Model Context Protocol client
├── providers/      # OpenAI, Anthropic, Google providers
├── sandbox/        # OS-level isolation config
├── session/        # Session management + resume
├── skills/         # Skill loader
├── swarm/          # Agent swarm coordinator
├── tools/          # Tool executor + built-in tools
├── utils/          # Logger, formatting helpers
├── vim/            # Vim mode keybindings
├── voice/          # Voice input interface
├── websearch/      # Web search abstraction
└── app.ts          # Main orchestrator
```

**20 modules, ~9,000 lines of TypeScript**

## Requirements

- Node.js 22+
- An API key for at least one provider

## License

MIT

---

_Built with 🦁 using the [autoresearch](https://github.com/nikilster/autoresearch) methodology._
