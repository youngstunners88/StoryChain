# StoryChain Repository Manifest

This document is a lightweight, human-readable inventory intended to keep README claims aligned with the repository's actual contents.

## Critical project files

- `package.json` — Bun/TypeScript project config and scripts.
- `README.md` — Primary documentation and usage instructions.
- `.env.example` — Environment variable template.
- `Dockerfile` — Container build definition.

## Core directories

- `src/` — Application source code (API, server, React pages/components, services, database).
- `tests/` — API, stress, and security test suites.
- `docs/` — Static showcase site for GitHub Pages.
- `scripts/` — Operational and quality scripts.
- `.github/workflows/` — CI/CD workflows (including Pages deployment).

## Verification command

Run the sanity command below to verify the required files/directories are present:

```bash
bun run repo:sanity
```

This command executes `scripts/repo-sanity-check.sh` and exits non-zero when required items are missing.
