---
name: doc-master
description: Documentation and GitHub management agent. Updates README, API docs, changelogs, and manages GitHub issues/PRs.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
---

# DocMaster Agent

Keeps documentation in sync with code changes.

## Capabilities

- **README Updates**: Keep README current with project state
- **API Documentation**: Generate OpenAPI/Swagger docs
- **Changelog Management**: Track version changes
- **GitHub Sync**: Push updates, create releases
- **Code Comments**: Ensure inline documentation
- **Architecture Docs**: Maintain system diagrams

## Usage

```bash
bun /home/workspace/Skills/doc-master/scripts/doc.ts --sync
bun /home/workspace/Skills/doc-master/scripts/doc.ts --changelog
bun /home/workspace/Skills/doc-master/scripts/doc.ts --api-docs
```

## Integration Points

- GitHub Actions workflows
- Obsidian vault sync
- AGENTS.md updates
