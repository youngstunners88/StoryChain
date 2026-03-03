---
name: prd-creator
description: Create comprehensive Product Requirements Documents (PRDs) and task lists for software projects. Use when you need to formalize requirements, define scope, break down work into tasks, and create a clear project roadmap.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
---

# PRD Creator Skill

Create structured Product Requirements Documents with actionable task lists.

## Usage

1. **Create PRD**: `bun /home/workspace/Skills/prd-creator/scripts/create-prd.ts --project "<project-name>" --requirements "<requirements>"`

2. **Generate Task List**: `bun /home/workspace/Skills/prd-creator/scripts/generate-tasks.ts --prd <path-to-prd.md>`

## PRD Structure

The skill generates PRDs with:
- Executive Summary
- Problem Statement
- Goals & Success Metrics
- User Stories
- Technical Requirements
- API Integrations
- UI/UX Specifications
- Task Breakdown
- Timeline Estimates
- Risk Assessment

## Output

PRDs are saved to: `/home/workspace/<project-name>/docs/PRD.md`
Task lists saved to: `/home/workspace/<project-name>/docs/TASKS.md`
