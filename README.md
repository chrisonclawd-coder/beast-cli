# Beast CLI 🦁

**The ultimate AI coding agent.** Born from the best features of Claude Code, Gemini CLI, and OpenCode.

## Why Beast?

Every coding CLI has strengths, but none has it all:
- **Gemini CLI** — free, simple, but Google-locked
- **OpenCode/Crush** — provider-agnostic, but archived/fragmented
- **Claude Code** — powerful tools, but proprietary and Anthropic-locked

**Beast CLI combines the best of all three into one provider-agnostic, extensible, open-source coding agent.**

## Top Features

### From Gemini CLI (Google)
- 🆓 **Free tier** — works with just a Google account
- 🔌 **MCP client/server** — native Model Context Protocol
- 🚀 **Zero-config start** — `npx beast-cli` and go

### From OpenCode/Crush (Charmbracelet)
- 🔓 **Provider-agnostic** — 75+ LLM providers, bring your own keys
- 🧠 **Dual-agent mode** — Plan (read-only) + Execute (write) toggle
- 📜 **Git-backed sessions** — full history via git
- ⌨️ **Vim mode** — full keybinding support

### From Claude Code (Anthropic)
- 🛡️ **Tool permissions** — auto/interactive/plan modes
- 🐺 **Agent swarms** — parallel teammates on different tasks
- 🎤 **Voice input** — push-to-talk hands-free coding
- 💤 **Auto-compaction** — compress context intelligently
- 🎯 **Skills + Hooks** — extensible prompts and event system

### From Codex CLI (OpenAI)
- 🔒 **OS-level sandbox** — file + network isolation, not just prompts
- ☁️ **Cloud delegation** — offload tasks to cloud agents from CLI
- 🔍 **Live web search** — cached + live modes with prompt injection protection
- 🎯 **Feature flags** — enable/disable features per project
- 📋 **Session recovery** — resume long-running tasks seamlessly

## Quick Start

```bash
# Install
npm install -g beast-cli

# Run
beast

# Or use instantly
npx beast-cli
```

## Architecture

```
beast-cli/
├── src/
│   ├── providers/     # LLM provider adapters (75+)
│   ├── agents/        # Agent orchestration (plan/execute/swarm)
│   ├── tools/         # File, shell, web, MCP tools
│   ├── permissions/   # Tool permission system
│   ├── skills/        # Skill system (prompt augmentation)
│   ├── hooks/         # Event hooks system
│   ├── voice/         # Voice input (push-to-talk)
│   ├── compaction/    # Auto-compaction engine
│   ├── mcp/           # MCP client/server
│   ├── commands/      # Slash commands
│   ├── sessions/      # Session management + git history
│   ├── ui/            # Terminal UI (Ink + React)
│   └── utils/         # Shared utilities
├── docs/              # Documentation
├── scripts/           # Build and install scripts
└── tests/             # Test suite
```

## License

MIT
