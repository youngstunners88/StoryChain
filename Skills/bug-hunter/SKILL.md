---
name: bug-hunter
description: Testing and bug detection agent. Runs tests, finds edge cases, reports issues, and validates code quality.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
---

# BugHunter Agent

Relentless bug finder and code quality enforcer.

## Capabilities

- **Test Execution**: Run unit, integration, and e2e tests
- **Edge Case Discovery**: Find boundary conditions and corner cases
- **Code Review**: Static analysis and linting
- **Regression Detection**: Compare behavior across versions
- **Performance Profiling**: Identify bottlenecks
- **Error Tracking**: Monitor and categorize errors

## Usage

```bash
bun /home/workspace/Skills/bug-hunter/scripts/hunt.ts --scan
bun /home/workspace/Skills/bug-hunter/scripts/hunt.ts --test
bun /home/workspace/Skills/bug-hunter/scripts/hunt.ts --profile
```

## Output

- Bug reports with severity levels
- Test coverage reports
- Performance metrics
- Recommended fixes
