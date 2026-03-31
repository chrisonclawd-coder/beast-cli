# Beast CLI — Design Document

## Vision

Beast CLI is a provider-agnostic, open-source AI coding agent that combines the best features of Claude Code, Gemini CLI, and OpenCode into a single terminal tool.

## Core Principles

1. **Provider-agnostic first** — Never lock into one LLM provider
2. **Zero-config defaults** — Works out of the box, configurable when needed
3. **Extensible** — Skills, hooks, plugins, MCP
4. **Safe** — Permission system with fine-grained control
5. **Fast** — Parallel agents, streaming, auto-compaction

## Architecture

### Layer 1: Provider Interface

Abstract LLM communication behind a unified interface.

```typescript
interface Provider {
  id: string                    // "openai", "anthropic", "google", "zai", etc.
  models: Model[]               // Available models
  complete(messages: Message[]): Promise<Response>
  stream(messages: Message[]): AsyncIterator<ResponseChunk>
}
```

**Supported providers (v1):**
- OpenAI (GPT-4.x, o3)
- Anthropic (Claude 3.x/4)
- Google (Gemini 2.x)
- ZAI (GLM-5.x)
- Groq, Together, Fireworks, etc.
- Local: Ollama, LM Studio

**Free tier:** Google Gemini via personal account (60 req/min, 1000/day)

### Layer 2: Agent System

Three agent modes:

1. **Plan Agent** — Read-only analysis, produces execution plan
2. **Execute Agent** — Implements the plan with tool access
3. **Swarm Agent** — Multiple agents working in parallel on subtasks

```typescript
interface Agent {
  mode: "plan" | "execute" | "swarm"
  tools: Tool[]
  permissions: PermissionSet
  context: ContextWindow
}
```

**Swarm orchestration:**
- Coordinator assigns subtasks to teammates
- Each teammate has isolated context + tools
- Results merge back via coordinator
- Git worktree isolation per teammate

### Layer 3: Tool System

Tools with fine-grained permissions:

```typescript
interface Tool {
  name: string
  description: string
  parameters: Schema
  permission: "auto" | "ask" | "deny"  // per-tool setting
}

// Built-in tools:
// - FileRead, FileWrite, FileEdit
// - Bash (shell commands)
// - Glob, Grep (search)
// - WebFetch (HTTP requests)
// - Git (version control)
// - NotebookEdit (Jupyter)
// - TaskCreate, TaskStop (agent tasks)
```

**Permission modes:**
- `auto` — Execute without asking (safe operations like reading)
- `ask` — Prompt user before execution (file writes, shell commands)
- `deny` — Always blocked

Users can configure per-tool permissions in `.beast/config.json`.

### Layer 4: Context Management

**Auto-compaction ("Dream Mode"):**
- Monitors context window usage
- When approaching limit, summarizes older context
- Preserves: recent tool calls, active task state, user preferences
- Loss: verbose output, older conversation turns

```typescript
interface CompactionStrategy {
  triggerThreshold: number      // e.g., 0.75 of context window
  preserveRecentTurns: number   // keep last N turns intact
  preserveToolResults: boolean  // keep recent tool outputs
  summarizeOlder: boolean       // compress older turns
}
```

### Layer 5: Skills & Hooks

**Skills** — Prompt templates that augment agent behavior:
```json
{
  "name": "security-review",
  "description": "Review code for security vulnerabilities",
  "prompt": "Analyze the following code for security issues...",
  "tools": ["FileRead", "Grep", "Bash"]
}
```

**Hooks** — Event-driven extensibility:
```json
{
  "afterToolCall": "scripts/log-usage.sh",
  "beforeFileWrite": "scripts/backup.sh",
  "onSessionEnd": "scripts/summarize.sh"
}
```

### Layer 6: Terminal UI

Built with Ink (React for CLI):
- Split-pane layout (code + chat)
- Streaming markdown rendering
- Syntax-highlighted code blocks
- Inline diffs for file changes
- Vim mode support
- Push-to-talk voice indicator
- Agent status panels (swarm view)

### Layer 7: Session Management

**Git-backed sessions:**
- Each session creates a git branch
- Tool calls committed atomically
- Session history = git log
- Resume any past session
- Review changes via standard git tools

## Tech Stack

| Component | Choice | Why |
|-----------|--------|-----|
| Language | TypeScript | Ecosystem, type safety, same as all 3 CLIs |
| Runtime | Bun (primary), Node.js (fallback) | Fast, native TS, compatible |
| Terminal UI | Ink (React) | Proven by Claude Code + OpenCode |
| Validation | Zod | Type-safe schemas |
| Build | Bun bundler | Fast, native |
| Package | npm | Widest reach |

## File Structure

```
beast-cli/
├── src/
│   ├── index.ts              # Entry point
│   ├── cli.ts                # CLI parser (Commander)
│   ├── providers/
│   │   ├── base.ts           # Provider interface
│   │   ├── openai.ts
│   │   ├── anthropic.ts
│   │   ├── google.ts
│   │   ├── zai.ts
│   │   ├── groq.ts
│   │   └── registry.ts       # Provider registry
│   ├── agents/
│   │   ├── plan.ts           # Plan agent
│   │   ├── execute.ts        # Execute agent
│   │   ├── swarm.ts          # Swarm coordinator
│   │   └── types.ts
│   ├── tools/
│   │   ├── base.ts           # Tool interface
│   │   ├── file.ts           # File operations
│   │   ├── bash.ts           # Shell commands
│   │   ├── search.ts         # Grep/Glob
│   │   ├── web.ts            # HTTP fetch
│   │   ├── git.ts            # Git operations
│   │   └── registry.ts       # Tool registry
│   ├── permissions/
│   │   ├── manager.ts        # Permission engine
│   │   ├── config.ts         # User config loader
│   │   └── types.ts
│   ├── skills/
│   │   ├── loader.ts         # Skill loader
│   │   ├── runner.ts         # Skill executor
│   │   └── builtins/         # Bundled skills
│   ├── hooks/
│   │   ├── manager.ts        # Hook runner
│   │   └── types.ts
│   ├── voice/
│   │   ├── capture.ts        # Audio capture
│   │   ├── transcribe.ts     # STT (Whisper API)
│   │   └── indicator.tsx     # UI indicator
│   ├── compaction/
│   │   ├── engine.ts         # Compaction logic
│   │   └── strategies.ts     # Built-in strategies
│   ├── mcp/
│   │   ├── client.ts         # MCP client
│   │   ├── server.ts         # MCP server
│   │   └── transport.ts      # Transport layer
│   ├── commands/
│   │   ├── help.ts
│   │   ├── model.ts          # Switch models
│   │   ├── skills.ts         # Manage skills
│   │   ├── config.ts         # Configuration
│   │   ├── session.ts        # Session management
│   │   └── swarm.ts          # Swarm control
│   ├── sessions/
│   │   ├── manager.ts        # Session lifecycle
│   │   ├── store.ts          # Git-backed storage
│   │   └── resume.ts         # Session resume
│   ├── ui/
│   │   ├── app.tsx           # Main UI
│   │   ├── chat.tsx          # Chat panel
│   │   ├── diff.tsx          # Inline diffs
│   │   ├── agents.tsx        # Agent status
│   │   ├── permissions.tsx   # Permission prompts
│   │   └── vim.ts            # Vim mode
│   └── utils/
│       ├── config.ts         # Config management
│       ├── logging.ts        # Logging
│       └── streaming.ts      # Stream utilities
├── docs/
│   ├── PROVIDERS.md          # Provider setup guides
│   ├── SKILLS.md             # Skill authoring guide
│   ├── HOOKS.md              # Hooks documentation
│   └── PERMISSIONS.md        # Permission configuration
├── scripts/
│   ├── build.sh
│   └── install.sh
├── tests/
│   ├── providers/
│   ├── agents/
│   └── tools/
├── package.json
├── tsconfig.json
├── bunfig.toml
└── README.md
```

## Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup (Bun + TypeScript + Ink)
- [ ] Provider interface + OpenAI adapter
- [ ] Basic tool system (File, Bash, Search)
- [ ] Simple chat UI

### Phase 2: Core Features (Week 3-4)
- [ ] Plan/Execute dual-agent mode
- [ ] Permission system
- [ ] Session management (git-backed)
- [ ] More providers (Anthropic, Google, ZAI)

### Phase 3: Advanced Features (Week 5-8)
- [ ] Agent swarms
- [ ] Auto-compaction
- [ ] Skills system
- [ ] Hooks system
- [ ] Vim mode
- [ ] Voice input

### Phase 4: Polish (Week 9-10)
- [ ] MCP client/server
- [ ] Free tier (Google Gemini)
- [ ] Plugin system
- [ ] Documentation
- [ ] npm package

## Configuration

`.beast/config.json`:
```json
{
  "provider": "openai",
  "model": "gpt-4.1",
  "agents": {
    "defaultMode": "dual",
    "swarmMaxTeammates": 4
  },
  "permissions": {
    "mode": "interactive",
    "tools": {
      "FileRead": "auto",
      "FileWrite": "ask",
      "Bash": "ask"
    }
  },
  "compaction": {
    "enabled": true,
    "threshold": 0.75
  },
  "voice": {
    "enabled": true,
    "pushToTalk": true
  },
  "vim": {
    "enabled": false
  },
  "hooks": {},
  "skills": {}
}
```

## Name

**Beast CLI** 🦁 — because it's a beast of a tool.
