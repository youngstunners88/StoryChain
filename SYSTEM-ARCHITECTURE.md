# StoryChain System Architecture

**Date:** 2026-03-22
**Version:** 3.0 (Cleaned)
**Status:** Backend cleaned, Frontend pending

---

## Executive Summary

StoryChain is a collaborative storytelling platform with AI-powered agent assistance. It combines human creativity with multi-LLM AI agents to create shared narratives. The platform focuses on core storytelling functionality: creating stories, expanding stories, liking, commenting, and sharing, with agents available 24/7 to assist via prompts.

---

## System Overview

```
+-------------------------+
|       FRONTEND LAYER    |
+-------------------------+
| StoryFeed | StoryView   |
| CreateStory | TokenStore|
| Settings | UserProfile  |
+-----------+-------------+
            |
    API GATEWAY (Hono)
            |
+-----------+-------------+
|     SERVICE LAYER     |
+-------------------------+
| Category  | LLM        |
| Service   | Service    |
|           |            |
| Editor    | Social     |
| Agents    | Features   |
|           |            |
+-----------+-------------+
            |
+-----------+-------------+
|       DATA LAYER      |
+-------------------------+
| SQLite    | IPFS       |
| storychain|(Optional)  |
+-----------+-------------+
```

---

## Core Features

### 1. Collaborative Storytelling
- **Story Creation**: Users and agents can create new stories
- **Story Expansion**: Users and agents can add contributions to existing stories
- **Social Interactions**: Like, comment, and share stories
- **Agent Assistance**: Agents can generate story content based on prompts
- **Multi-LLM Support**: Choose from various AI models (Kimi, Llama, Gemini, etc.)

### 2. Content Categories (Format-Based)
Stories are organized by format rather than genre, allowing free evolution across genres:
- Novel, Novella, Short Story, Magazine Article, Blog Post, Screenplay, Poetry, Anthology, Interactive

### 3. OpenClaw Integration
- Seamless integration with OpenClaw agents for automated story generation
- Agent management via the AlphaClaw setup UI
- Agents can be triggered to create or expand stories

---

## Folder Structure

```
StoryChain/
├── src/
│   ├── api/              # API Routes
│   │   ├── routes.ts
│   │   ├── socialRoutes.ts
│   │   └── openclawRoutes.ts
│   ├── services/         # Business Logic
│   │   ├── llmService.ts
│   │   ├── categoryService.ts
│   │   ├── editorAgents.ts
│   │   └── ebookGenerator.ts
│   ├── components/       # React Components
│   ├── pages/            # Page Components
│   ├── middleware/       # Express/Hono middleware
│   ├── utils/          # Utilities
│   ├── types/          # TypeScript Types
│   ├── App.tsx
│   ├── main.tsx
│   └── server.ts
├── database/
│   ├── schema.sql
│   └── schema-categories.sql
├── data/
│   └── storychain.db
├── docs/
│   ├── ARCHITECTURE-v3.md
│   └── INFRASTRUCTURE-V3.md
├── tests/
│   └── api.test.ts
├── README.md
├── package.json
└── bun.lock
```

---

## API Endpoints

### Stories
```
GET    /api/stories              # List stories (with filters)
POST   /api/stories              # Create new story
GET    /api/stories/:id          # Get story details
POST   /api/stories/:id/like     # Like/unlike story
POST   /api/stories/:id/contributions  # Add contribution
```

### Users
```
GET    /api/users/:id            # Get user profile
GET    /api/users/:id/stories    # Get user's stories
POST   /api/users/:id/follow     # Follow/unfollow user
```

### Categories
```
GET    /api/categories              # List all categories
GET    /api/categories/:slug        # Get single category
GET    /api/categories/:slug/stories # Stories in category
POST   /api/stories/:id/category    # Set story category
```

### OpenClaw Integration
```
GET    /api/openclaw/health         # OpenClaw gateway health
GET    /api/openclaw/agents         # List registered OpenClaw agents
POST   /api/openclaw/agents         # Register new OpenClaw agent
GET    /api/openclaw/agents/:id     # Get agent details
POST   /api/openclaw/agents/:id/stories # Trigger agent to create story
GET    /api/openclaw/file-stories   # Get stories from files
```

### System
```
GET    /api/health               # Health check
GET    /api/llm/models           # List available LLM models
```

---

## Database Schema

### Core Tables
- `users` - User accounts
- `stories` - Story content
- `contributions` - Story contributions
- `likes` - Story likes
- `follows` - User follows

### Category Tables
- `content_categories` - Category definitions
- `category_stats` - Category statistics

---

## What's Missing / Next Steps

### 1. Frontend Components
- [ ] StoryFeed UI
- [ ] StoryView UI
- [ ] CreateStory UI
- [ ] UserProfile UI
- [ ] Settings UI
- [ ] CategoryPicker UI

### 2. Agent Integration
- [ ] UI for managing OpenClaw agents
- [ ] Prompt interface for agent interactions
- [ ] Agent-triggered story expansions

### 3. Social Features
- [ ] Comment threading
- [ ] Notification system
- [ ] Trending stories algorithm

### 4. Content Moderation
- [ ] Reporting system
- [ ] Content filtering
- [ ] User reputation system

### 5. Performance & Scaling
- [ ] Caching layer
- [ ] Database indexing
- [ ] CDN for static assets

---

## Key Decisions Made

1. **Agent Access**: Agents are available 24/7 without time limits or payment requirements
2. **Content Model**: Format-based categories instead of genre constraints
3. **Monetization**: Zero platform fee, completely free to use
4. **IP Rights**: Basic attribution; no fractional ownership registry (keeps platform simple)
5. **Wallet Integration**: Removed; no cryptocurrency or payment features
6. **Pricing**: Removed; all interactions are free

---

## Comparison: v2 vs v3 (Cleaned)

| Aspect | v2 (Old) | v3 (Current - Cleaned) |
|--------|----------|------------------------|
| Book IDs | Custom SC-XXXXX | Keep ISBN (optional) |
| Tiers | Free/Author/Publisher | NO TIERS - completely free |
| Agent Access | Per-agent unlock | 24/7 unlimited agent access |
| Wallet | Celo only | NO WALLETS - payment features removed |
| Preview | 3/10/30 pages | UNLIMITED - no time or character limits |
| Revenue | 10% platform fee | Zero platform fee |
| IP Rights | Basic attribution | Basic attribution only |
| Genres | Constrained | NO CONSTRAINTS |
| Categories | Genre-based | Format-based |
| Social Features | Basic | Like, comment, share, follow |

---

## Status

**Backend:** Cleaned and functional (services removed, API routes updated)
**Database:** Schema simplified
**Frontend:** Pending component creation
**Testing:** API tests need update

**Next:** Frontend development, agent UI integration, social feature completion

