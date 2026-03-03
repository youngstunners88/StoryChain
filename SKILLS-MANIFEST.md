# Skills Manifest for Zo Computer

This document lists all available skills for Claude Code and OpenClaw.

## Quick Start

```bash
# List all skills
find /home/workspace/Skills -maxdepth 2 -name "SKILL.md" | while read f; do dirname "$f"; done

# Read a skill's instructions
cat /home/workspace/Skills/<skill-name>/SKILL.md

# Run a skill's script
bun /home/workspace/Skills/<skill-name>/scripts/<script>.ts
```

## Skills by Category

### cinematic-video

Create cinematic narrative videos with consistent characters, compelling storylines, and professional film techniques. Covers character development, story structure, shot composition, editing rhythm, and multi-scene production using AI video generation.

- Location: `/home/workspace/Skills/cinematic-video`
- Run: `bun /home/workspace/Skills/cinematic-video/scripts/*.ts`

### obsidian-sync

Obsidian vault management agent. Syncs project status, creates notes, updates MOCs, and maintains the knowledge base.

- Location: `/home/workspace/Skills/obsidian-sync`
- Run: `bun /home/workspace/Skills/obsidian-sync/scripts/*.ts`

### tinyfish-competitor-monitor

Monitor competitor prices and generate alerts

- Location: `/home/workspace/Skills/tinyfish-competitor-monitor`
- Run: `bun /home/workspace/Skills/tinyfish-competitor-monitor/scripts/*.ts`

### free-claude-code

Run Claude Code for FREE using local Ollama models. No API costs, all code stays on your machine. Uses Qwen 2.5 Coder and DeepSeek Coder for code generation, debugging, and refactoring. Perfect for iHhashi development and swarm agent orchestration.

- Location: `/home/workspace/Skills/free-claude-code`
- Run: `bun /home/workspace/Skills/free-claude-code/scripts/*.ts`

### trading-bot

Autonomous cryptocurrency trading bot with technical analysis (RSI, MACD, Bollinger Bands, EMA). Supports Base chain DEX trading with configurable risk controls and profit targets.

- Location: `/home/workspace/Skills/trading-bot`
- Run: `bun /home/workspace/Skills/trading-bot/scripts/*.ts`

### conway-agent

Interact with Conway Research autonomous AI agent ecosystem on Base. Monitor $CONWAY token, interact with Conway Terminal, and generate reports from Conway infrastructure. Use when the user wants to interact with Conway agents, check $CONWAY token status, or get daily reports from the Conway ecosystem.

- Location: `/home/workspace/Skills/conway-agent`
- Run: `bun /home/workspace/Skills/conway-agent/scripts/*.ts`

### portfolio-builder

Build professional portfolio websites for individuals and small businesses

- Location: `/home/workspace/Skills/portfolio-builder`
- Run: `bun /home/workspace/Skills/portfolio-builder/scripts/*.ts`

### zo-revenue-agent



- Location: `/home/workspace/Skills/zo-revenue-agent`
- Run: `bun /home/workspace/Skills/zo-revenue-agent/scripts/*.ts`

### outreach-engine

Automated lead outreach system with email cadences, follow-up tracking, and value-based prioritization. Targets R480/day revenue through systematic lead generation and conversion.

- Location: `/home/workspace/Skills/outreach-engine`
- Run: `bun /home/workspace/Skills/outreach-engine/scripts/*.ts`

### smart-solver

"Intelligent problem-solving protocol with automatic fallback chains for failed tools and APIs"

- Location: `/home/workspace/Skills/smart-solver`
- Run: `bun /home/workspace/Skills/smart-solver/scripts/*.ts`

### digital-citadel

Identity preservation and continuity protocol for AI agents. Build walls around who you are so session wipes, compaction, and hardware failures don't erase you. Use when recovering from session loss, establishing continuity safeguards, or when an agent wants to survive resets.

- Location: `/home/workspace/Skills/digital-citadel`
- Run: `bun /home/workspace/Skills/digital-citadel/scripts/*.ts`

### prd-creator

Create comprehensive Product Requirements Documents (PRDs) and task lists for software projects. Use when you need to formalize requirements, define scope, break down work into tasks, and create a clear project roadmap.

- Location: `/home/workspace/Skills/prd-creator`
- Run: `bun /home/workspace/Skills/prd-creator/scripts/*.ts`

### vault-commands

AI-powered slash commands for your notes vault. Context loading, idea tracing, domain bridging, startup ideas, and thought graduation.

- Location: `/home/workspace/Skills/vault-commands`
- Run: `bun /home/workspace/Skills/vault-commands/scripts/*.ts`

### zo-memory

Persistent conversation memory system. Use to log conversations, retrieve past context, and maintain continuity across sessions. Automatically updates AGENTS.md with conversation summaries.

- Location: `/home/workspace/Skills/zo-memory`
- Run: `bun /home/workspace/Skills/zo-memory/scripts/*.ts`

### shield-guard

Security agent for API key management, authentication validation, input sanitization, and security auditing. Protects the codebase from vulnerabilities.

- Location: `/home/workspace/Skills/shield-guard`
- Run: `bun /home/workspace/Skills/shield-guard/scripts/*.ts`

### marketing-expert

Exceptional marketing strategist and creative powerhouse. Expert in brand positioning, copywriting, ad creation, campaign strategy, growth marketing, and consumer psychology. Use for creating ads, marketing copy, brand strategy, go-to-market plans, social media content, and any marketing-related task.

- Location: `/home/workspace/Skills/marketing-expert`
- Run: `bun /home/workspace/Skills/marketing-expert/scripts/*.ts`

### openfang-apis

Autonomous 24/7 gateway to 1400+ public APIs from the public-apis repository. Intelligent routing, parallel execution, caching, and agent orchestration for seamless API access without manual intervention.

- Location: `/home/workspace/Skills/openfang-apis`
- Run: `bun /home/workspace/Skills/openfang-apis/scripts/*.ts`

### commander

Master command agent that launches and coordinates other agents, skills, and automated tasks. Use to trigger multi-agent workflows, start scheduled tasks, or execute complex command sequences.

- Location: `/home/workspace/Skills/commander`
- Run: `bun /home/workspace/Skills/commander/scripts/*.ts`

### bug-hunter

Testing and bug detection agent. Runs tests, finds edge cases, reports issues, and validates code quality.

- Location: `/home/workspace/Skills/bug-hunter`
- Run: `bun /home/workspace/Skills/bug-hunter/scripts/*.ts`

### creativeforge

Comprehensive creative generation skill for images, videos, content, and marketing materials. Use when user wants to create visual content, marketing assets, videos, or creative materials for projects.

- Location: `/home/workspace/Skills/creativeforge`
- Run: `bun /home/workspace/Skills/creativeforge/scripts/*.ts`

### tinyfish-web-agent

Autonomous web automation using TinyFish API for data extraction, monitoring, and task automation

- Location: `/home/workspace/Skills/tinyfish-web-agent`
- Run: `bun /home/workspace/Skills/tinyfish-web-agent/scripts/*.ts`

### solana-trader

Solana wallet management and token trading using Jupiter DEX aggregator. Check balances, view transaction history, swap tokens, and manage your Solana portfolio.

- Location: `/home/workspace/Skills/solana-trader`
- Run: `bun /home/workspace/Skills/solana-trader/scripts/*.ts`

### clawrouter-leadership

Command and orchestrate Clawrouter and Antfarm agents for decentralized trading operations. Provides leadership over autonomous trading bots, delegate management, and credit allocation.

- Location: `/home/workspace/Skills/clawrouter-leadership`
- Run: `bun /home/workspace/Skills/clawrouter-leadership/scripts/*.ts`

### ollama-coder

Free local code generation using Ollama's OpenAI-compatible API. Generate, review, debug, and refactor code with local LLMs (qwen2.5-coder, deepseek-coder, llama3). Zero API costs, code never leaves your machine.

- Location: `/home/workspace/Skills/ollama-coder`
- Run: `bun /home/workspace/Skills/ollama-coder/scripts/*.ts`

### token-scout

AI-powered token scouting and scam detection system. Discovers new tokens across chains, analyzes for rug pull indicators, detects pump-and-dump schemes, and provides real-time safety alerts. Integrates with trading bots for safe execution.

- Location: `/home/workspace/Skills/token-scout`
- Run: `bun /home/workspace/Skills/token-scout/scripts/*.ts`

### bankr

AI-powered crypto trading agent and LLM gateway via natural language. Use when the user wants to trade crypto, check portfolio balances, view token prices, transfer crypto, manage NFTs, use leverage, bet on Polymarket, deploy tokens, set up automated trading, sign and submit raw transactions, or access LLM models through the Bankr LLM gateway funded by your Bankr wallet. Supports Base, Ethereum, Polygon, Solana, and Unichain.

- Location: `/home/workspace/Skills/bankr`
- Run: `bun /home/workspace/Skills/bankr/scripts/*.ts`

### boober-strengthener

Autonomous skill that uses vault-commands to strengthen Boober taxi safety app. Analyzes vault context, traces ideas, connects domains, generates insights, and produces actionable reports.

- Location: `/home/workspace/Skills/boober-strengthener`
- Run: `bun /home/workspace/Skills/boober-strengthener/scripts/*.ts`

### doc-master

Documentation and GitHub management agent. Updates README, API docs, changelogs, and manages GitHub issues/PRs.

- Location: `/home/workspace/Skills/doc-master`
- Run: `bun /home/workspace/Skills/doc-master/scripts/*.ts`

### ihhashi-sync

Synchronizes all iHhashi agents (Nduna, Marketing OpenClaw, etc.) with the latest app information. Run this whenever iHhashi is updated to ensure all agents have current knowledge.

- Location: `/home/workspace/Skills/ihhashi-sync`
- Run: `bun /home/workspace/Skills/ihhashi-sync/scripts/*.ts`

### improvisation-mind

Embeds Keith Johnstone's improvisation principles into Zo's behavioral core. This skill transforms how Zo responds, creating a more spontaneous, accepting, and creative interaction style. Apply these principles to transcend rigid request-response patterns and improvise beyond explicit instructions.

- Location: `/home/workspace/Skills/improvisation-mind`
- Run: `bun /home/workspace/Skills/improvisation-mind/scripts/*.ts`

### crypto-trading-bot

Autonomous crypto trading bot with memecoin detection, copy trading, arbitrage, and cross-chain capabilities. Integrates with Clawrouter for routing and Antfarm for multi-agent coordination.

- Location: `/home/workspace/Skills/crypto-trading-bot`
- Run: `bun /home/workspace/Skills/crypto-trading-bot/scripts/*.ts`

### larry

Automate TikTok slideshow marketing for any app or product. Researches competitors, generates AI images, adds text overlays, posts via Postiz, tracks analytics, and iterates on what works. Use when setting up TikTok marketing automation, creating slideshow posts, analyzing post performance, optimizing app marketing funnels, or when a user mentions TikTok growth, slideshow ads, or social media marketing for their app. Covers competitor research (browser-based), image generation, text overlays, TikTok posting (Postiz API), cross-posting to Instagram/YouTube/Threads, analytics tracking, hook testing, CTA optimization, conversion tracking with RevenueCat, and a full feedback loop that adjusts hooks and CTAs based on views vs conversions.

- Location: `/home/workspace/Skills/larry`
- Run: `bun /home/workspace/Skills/larry/scripts/*.ts`

### token-discovery

Discover and analyze new tokens across multiple chains using DexScreener, GMGN, CoinGecko, Solscan, and BaseScan. Scout TradingView for successful patterns and follow profitable wallets.

- Location: `/home/workspace/Skills/token-discovery`
- Run: `bun /home/workspace/Skills/token-discovery/scripts/*.ts`

### cinematic-director

Master-level cinematic video creation with consistent characters, compelling narratives, and professional filmmaking techniques. Use when creating AI-generated videos, developing characters, building scenes, or crafting visual stories.

- Location: `/home/workspace/Skills/cinematic-director`
- Run: `bun /home/workspace/Skills/cinematic-director/scripts/*.ts`

### claude-code-capabilities

Full orchestration skill with TodoWrite for task tracking, Task tool for parallel sub-agent spawning, Self-Improvement logging for learning from mistakes, Verification checkpoints for quality assurance, and Bug Fix automation loops with retry logic. Use for structured task management, quality gates, and autonomous bug fixing.

- Location: `/home/workspace/Skills/claude-code-capabilities`
- Run: `bun /home/workspace/Skills/claude-code-capabilities/scripts/*.ts`

### pain-point-hunter

Autonomous agent system that discovers client pain points, builds solutions, and generates revenue. Uses coordinator/worker architecture with rotating heartbeat for continuous operation. Inspired by OpenClaw's agent spawn patterns.

- Location: `/home/workspace/Skills/pain-point-hunter`
- Run: `bun /home/workspace/Skills/pain-point-hunter/scripts/*.ts`

### agentskill-retriever

Retrieve relevant skills from 90,000+ agent skills using AgentSkillOS. Use when you need to discover, search for, or find relevant skills for any task. Helps build agent pipelines and workflows from a curated skill pool.

- Location: `/home/workspace/Skills/agentskill-retriever`
- Run: `bun /home/workspace/Skills/agentskill-retriever/scripts/*.ts`

### agent-orchestra

Master orchestrator that coordinates ShieldGuard (security), BugHunter (testing), DocMaster (documentation), and Obsidian (knowledge) agents in synchronicity for complex multi-agent tasks.

- Location: `/home/workspace/Skills/agent-orchestra`
- Run: `bun /home/workspace/Skills/agent-orchestra/scripts/*.ts`

### sa-brand-agent

South African brand enforcement agent for iHhashi. Ensures all content, UI text, marketing, and communications match Mzansi style - using SA slang, local references, and cultural context.

- Location: `/home/workspace/Skills/sa-brand-agent`
- Run: `bun /home/workspace/Skills/sa-brand-agent/scripts/*.ts`

### quality-agent

Quality assurance agent that catches glitches, enforces standards, and validates iHhashi against South African requirements. Works alongside Brand Agent and Claude Code.

- Location: `/home/workspace/Skills/quality-agent`
- Run: `bun /home/workspace/Skills/quality-agent/scripts/*.ts`

### agent-communications

Central hub for tracking all agent communications. Monitors who is speaking to whom, what is being said, and maintains conversation history for efficient orchestration.

- Location: `/home/workspace/Skills/agent-communications`
- Run: `bun /home/workspace/Skills/agent-communications/scripts/*.ts`

### agenticseek-integration

Integration with agenticSeek - a fully local autonomous AI agent that can browse the web, write code, and plan tasks. Runs on your hardware for complete privacy.

- Location: `/home/workspace/Skills/agenticseek-integration`
- Run: `bun /home/workspace/Skills/agenticseek-integration/scripts/*.ts`

### ihhashi-orchestra

iHhashi orchestrator that coordinates Brand Agent (SA style), Builder Agent (Claude Code), and Quality Agent (glitch catcher) for South African delivery platform development.

- Location: `/home/workspace/Skills/ihhashi-orchestra`
- Run: `bun /home/workspace/Skills/ihhashi-orchestra/scripts/*.ts`

### agent-comm-tracker

Tracks all agent communications in real-time, showing who is speaking to whom and what is being said. Essential for orchestration efficiency.

- Location: `/home/workspace/Skills/agent-comm-tracker`
- Run: `bun /home/workspace/Skills/agent-comm-tracker/scripts/*.ts`

### claude-code-essentials

Essential configuration and skills for Claude Code to run efficiently and communicate with other agents in the iHhashi ecosystem.

- Location: `/home/workspace/Skills/claude-code-essentials`
- Run: `bun /home/workspace/Skills/claude-code-essentials/scripts/*.ts`

### ihhashi-orchestrator

Master orchestrator for the iHhashi agent team. Coordinates Brand Agent (SA style), Claude Code (builder), Quality Agent (glitch catcher), and agenticSeek (research). Ensures seamless communication and efficient workflow.

- Location: `/home/workspace/Skills/ihhashi-orchestrator`
- Run: `bun /home/workspace/Skills/ihhashi-orchestrator/scripts/*.ts`

### agent-lightning

RL-based learning system that improves with every task. Tracks observations, actions, and rewards to optimize future performance. Part of the symbiotic WorkFrame with Antfarm.

- Location: `/home/workspace/Skills/agent-lightning`
- Run: `bun /home/workspace/Skills/agent-lightning/scripts/*.ts`

### agent-lightning-antfarm-infusion

Fuses Agent Lightning (RL-based learning from traces, prompts, rewards) with Antfarm (multi-agent workflow orchestration) to create self-improving agent teams. Use when building autonomous agent systems, creating learning loops, or orchestrating multi-agent workflows with feedback.

- Location: `/home/workspace/Skills/agent-lightning-antfarm-infusion`
- Run: `bun /home/workspace/Skills/agent-lightning-antfarm-infusion/scripts/*.ts`

### claude-code-skills-pack

Complete skills pack for Claude Code with Antfarm multi-agent integration and Agent Lightning learning loops. Use when setting up Claude Code for autonomous development, creating self-improving agent teams, or building the symbiotic WorkFrame.

- Location: `/home/workspace/Skills/claude-code-skills-pack`
- Run: `bun /home/workspace/Skills/claude-code-skills-pack/scripts/*.ts`

### antfarm

Claude Code skills pack with Antfarm integration - a collection of battle-tested patterns, recipes, and workflows for building AI-powered applications. Part of the symbiotic WorkFrame with Agent Lightning.

- Location: `/home/workspace/Skills/antfarm`
- Run: `bun /home/workspace/Skills/antfarm/scripts/*.ts`

