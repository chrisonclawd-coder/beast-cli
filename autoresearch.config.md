# Autoresearch Configuration

## Goal
Build Beast CLI by researching all 4 source CLIs, extracting best features, and iteratively implementing them into a working CLI.

## Metric
- **Name**: Feature completion score
- **Direction**: higher is better (0-100)
- **Extract command**: Count implemented features from checklist below, divide by total, multiply by 100

## Feature Checklist (Target: implement all)
1. Provider interface (multi-LLM support)
2. Provider registry (auto-discover)
3. Tool system with permissions
4. Plan agent (read-only)
5. Execute agent (write mode)
6. Swarm coordinator (parallel agents)
7. Skills system
8. Hooks system (before/after events)
9. OS-level sandbox config
10. Cloud delegation interface
11. Web search (cached + live)
12. Feature flags
13. Git-backed session management
14. Session resume/recovery
15. Voice input interface
16. Auto-compaction
17. Vim mode support
18. Ink TUI with streaming
19. CLI entry point with all commands
20. Config file management

## Target Files
- `src/**/*.ts` (all source files — full implementation)
- `package.json` (dependencies as needed)
- `tsconfig.json` (compiler config)

## Read-Only Files
- `docs/DESIGN.md` (design doc — reference only)
- `autoresearch.config.md` (this file)

## Run Command
```bash
npx tsc --noEmit 2>&1 | tail -1 && echo "BUILD_OK"
```

## Guard Command
```bash
npx tsc --noEmit 2>&1 | head -20
```

## Time Budget
- **Per experiment**: 60 seconds
- **Kill timeout**: 120 seconds

## Constraints
- TypeScript only
- No paid dependencies (use open-source only)
- Must compile with `tsc --noEmit` after each iteration
- Each iteration implements ONE feature from the checklist
- Reference all 4 CLIs: Gemini CLI, OpenCode/Crush, Claude Code, Codex CLI

## Branch
autoresearch/mar31-build-beast

## Source CLI Repos for Research
- Gemini CLI: https://github.com/google-gemini/gemini-cli
- OpenCode: https://github.com/opencode-ai/opencode (archived → charmbracelet/crush)
- Claude Code: https://github.com/instructkr/claude-code (leaked source)
- Codex CLI: https://github.com/openai/codex

## Notes
- For each feature, research the source CLI first, extract best pattern, implement
- Iteration flow: Research → Hypothesize → Implement → Compile → Keep/Revert
- Record which CLI inspired each feature in results.tsv
