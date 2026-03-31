# Beast CLI Security Audit Report

**Date:** 2026-03-31
**Auditor:** Autoresearch Security Audit
**Branch:** autoresearch/mar31-security-audit

## Summary

| Category | Issues Found | Issues Fixed |
|----------|-------------|--------------|
| Path Traversal | 5 | 0 |
| Code Injection | 1 | 0 |
| Memory Leaks | 3 | 0 |
| Hardcoded Secrets | 0 | N/A |
| Dependency Vulnerabilities | 0 | N/A |

## Issues Found

### 1. Path Traversal Vulnerability (HIGH)
**Location:** `src/tools/builtin.ts`
**Files affected:** 
- `readFileTool` (line 29)
- `writeFileTool` (line 72)
- `editFileTool` (line 113)
- `globTool` (line 220)
- `grepTool` (line 267)

**Description:** The file tools use `path.resolve(ctx.workingDir, params.path)` but don't validate that the resolved path remains within `ctx.workingDir`. An attacker could use `../` sequences to escape the working directory and read/write arbitrary files.

**Example exploit:**
```javascript
readFileTool.execute({ path: "../../../etc/passwd" }, ctx)
```

**Fix:** Add path validation to ensure resolved path is within working directory.

### 2. Code Injection via new Function() (MEDIUM)
**Location:** `src/hooks/executor.ts` (line 200-206)

**Description:** The `evaluateCondition` method uses `new Function()` with the `condition` string directly interpolated. If hook configurations come from untrusted sources, this could lead to arbitrary code execution.

```javascript
const fn = new Function(
  "tool", "params", "result", "session",
  `return ${condition}`  // Unsanitized input
)
```

**Fix:** Sanitize the condition string or use a safe expression evaluator.

### 3. Event Listener Memory Leaks (LOW)
**Location:** 
- `src/tools/builtin.ts` (bashTool)
- `src/sandbox/manager.ts` (multiple execute methods)
- `src/hooks/executor.ts` (runCommand)

**Description:** Event listeners are attached to child process streams but not explicitly cleaned up in all error paths. While Node.js eventually cleans these up, explicit cleanup is better practice.

**Fix:** Add explicit cleanup in error handlers or use AbortController pattern.

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

## Recommendations

1. **Immediate:** Fix path traversal vulnerability in builtin tools
2. **Short-term:** Sanitize hook condition expressions
3. **Long-term:** Add explicit cleanup for event listeners in child processes
