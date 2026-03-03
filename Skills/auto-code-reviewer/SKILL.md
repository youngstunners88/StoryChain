---
name: auto-code-reviewer
description: Automatically reviews code and applies improvements using AI. Can review files, directories, or git diffs and automatically fix issues, improve code quality, add documentation, and optimize performance.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
---

# Auto Code Reviewer

Automatically reviews code and applies improvements using AI via OpenRouter.

## Features

- Reviews code for bugs, security issues, and performance problems
- Automatically applies fixes and improvements
- Adds missing documentation
- Improves code structure and readability
- Supports multiple languages (Python, TypeScript, JavaScript, etc.)

## Usage

### Review a single file
```bash
bun /home/workspace/Skills/auto-code-reviewer/scripts/review.ts --file path/to/file.ts
```

### Review a directory
```bash
bun /home/workspace/Skills/auto-code-reviewer/scripts/review.ts --dir path/to/src
```

### Review git changes
```bash
bun /home/workspace/Skills/auto-code-reviewer/scripts/review.ts --git
```

### Auto-fix issues
```bash
bun /home/workspace/Skills/auto-code-reviewer/scripts/review.ts --file path/to/file.ts --auto-fix
```

### Review with specific focus
```bash
bun /home/workspace/Skills/auto-code-reviewer/scripts/review.ts --file path/to/file.ts --focus security
bun /home/workspace/Skills/auto-code-reviewer/scripts/review.ts --file path/to/file.ts --focus performance
bun /home/workspace/Skills/auto-code-reviewer/scripts/review.ts --file path/to/file.ts --focus documentation
```

## Configuration

The skill uses the OPENROUTER_API_KEY from your Zo secrets. Default model is Claude for high-quality reviews.

## Review Categories

1. **Security**: SQL injection, XSS, auth issues, secrets in code
2. **Performance**: N+1 queries, memory leaks, inefficient algorithms
3. **Quality**: Code smells, duplication, complexity
4. **Documentation**: Missing comments, unclear names
5. **Testing**: Missing tests, edge cases
