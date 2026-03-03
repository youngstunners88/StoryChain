---
name: smart-solver
description: "Intelligent problem-solving protocol with automatic fallback chains for failed tools and APIs"
compatibility: "Created for Zo Computer"
metadata:
  author: kofi.zo.computer
  version: "1.0.0"
  created: "2026-02-20"
---

# Smart Solver Protocol

## When to Use
- Any task requires external tools/APIs
- Bash/curl commands fail
- Need fallback strategies

## Protocol Steps

1. **Try Primary** - Attempt the intended tool/command first

2. **Check Alternatives** - If primary fails, try:
   - Alternative npm packages (e.g., `node-fetch` instead of curl)
   - Different APIs or endpoints
   - Simpler approaches

3. **Fallback Chain**:
   | Primary Tool | Fallback 1 | Fallback 2 | Fallback 3 | Last Resort |
   |--------------|------------|------------|------------|-------------|
   | node-fetch | axios | got | curl (bash) | Python requests |
   | openclaw CLI | direct API | conway-terminal | manual implementation | skip feature |
   | docker | podman | npm container | manual install | use local |
   | pnpm | npm | yarn | bun | skip package |
   | git clone | curl tarball | wget | manual download | use cache |

4. **Log & Report**:
   - Log what failed and why
   - Suggest the fix if a workaround wasn't available
   - Update this skill with new solutions discovered

## Example Usage

```
# Primary attempt failed
$ npm install better-sqlite3
# Error: node-gyp rebuild failed

# Fallback chain activated
→ Try: npm install better-sqlite3 --build-from-source
→ If fails: npm install sql.js (pure JS alternative)
→ Success: Use sql.js for SQLite operations
```

## Integration Notes

- Always try the simplest solution first
- Check if the issue is authentication, network, or dependency
- Consider using Zo's built-in tools before external dependencies
- When all else fails, ask the user for guidance or alternative requirements

## Updates

- 2026-02-20: Initial skill creation for Zo Computer
