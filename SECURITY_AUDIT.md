# Beast CLI Security Audit Report

**Date:** 2026-03-31
**Auditor:** Autoresearch Security Audit
**Branch:** autoresearch/mar31-security-audit

## Summary

| Category | Issues Found | Issues Fixed |
|----------|-------------|--------------|
| Path Traversal | 5 | 5 ✅ |
| Code Injection | 1 | 1 ✅ |
| Memory Leaks | 3 | 3 ✅ |
| Hardcoded Secrets | 0 | N/A |
| Dependency Vulnerabilities | 0 | N/A |

## Issues Fixed

### 1. Path Traversal Vulnerability (HIGH) ✅ FIXED
**Location:** `src/tools/builtin.ts`
**Commit:** `fa7b186`

**Description:** The file tools used `path.resolve(ctx.workingDir, params.path)` without validating that the resolved path remains within `ctx.workingDir`. An attacker could use `../` sequences to escape the working directory and read/write arbitrary files.

**Fix Applied:**
- Added `validatePath()` helper function that checks if resolved path stays within working directory
- Applied validation to `readFileTool`, `writeFileTool`, `editFileTool`, `globTool`, and `grepTool`
- Paths with `../` sequences that escape working directory are now rejected with error message

### 2. Code Injection via new Function() (MEDIUM) ✅ FIXED
**Location:** `src/hooks/executor.ts`
**Commit:** `c36f4bb`

**Description:** The `evaluateCondition` method used `new Function()` with the `condition` string directly interpolated. If hook configurations came from untrusted sources, this could lead to arbitrary code execution.

**Fix Applied:**
- Added input validation with safe character whitelist pattern
- Blocked dangerous patterns (eval, require, process, global, constructor, etc.)
- Added `'use strict'` to evaluated expressions
- Converted legacy `contains` syntax to `.includes()` for backwards compatibility

### 3. Event Listener Memory Leaks (LOW) ✅ FIXED
**Location:** 
- `src/tools/builtin.ts` (bashTool) - Commit: `1032941`
- `src/sandbox/manager.ts` (multiple execute methods) - Commit: `c86f276`
- `src/hooks/executor.ts` (runCommand) - Commit: `8b4dc88`

**Description:** Event listeners were attached to child process streams but not explicitly cleaned up in all error paths. While Node.js eventually cleans these up, explicit cleanup is better practice.

**Fix Applied:**
- Created `spawnWithCleanup()` helper function in sandbox/manager.ts
- Added `cleanup()` function to remove all listeners after process completes
- Added `resolved` flag to prevent duplicate resolution
- Added process kill on error if still running
- Updated all spawn calls to use proper cleanup pattern

## No Issues Found

### Hardcoded Secrets
- ✅ No hardcoded API keys, tokens, or passwords found in source code
- ✅ All providers correctly read credentials from environment variables
- ✅ No .env files with credentials found

### Dependency Vulnerabilities
- ✅ `npm audit` reports 0 vulnerabilities

### File Permissions
- ✅ `bin/beast.js` has correct permissions (rwxr-xr-x, not world-writable)

### Git History
- ✅ No accidentally committed secrets found in git history

## Commits

1. `fa7b186` - fix(security): add path traversal validation to file tools
2. `c36f4bb` - fix(security): sanitize hook condition evaluation to prevent code injection
3. `1032941` - fix(security): add proper cleanup to bash tool to prevent memory leaks
4. `c86f276` - fix(security): add spawnWithCleanup helper to prevent memory leaks in sandbox
5. `8b4dc88` - fix(security): add proper cleanup to hook executor to prevent memory leaks

## Recommendations

### Immediate (Completed)
- ✅ Fix path traversal vulnerability in builtin tools
- ✅ Sanitize hook condition expressions
- ✅ Add explicit cleanup for event listeners in child processes

### Future Improvements
1. Consider adding rate limiting to bash commands
2. Add audit logging for security-sensitive operations
3. Consider implementing a capability-based security model
4. Add tests for security boundary conditions
