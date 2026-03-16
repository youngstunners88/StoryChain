# StoryChain v3 - Implementation Guide

## Overview
StoryChain v3 introduces two major features:
1. **Content Categories** - Format-based organization (NOT genres)
2. **Character-Based Pricing** - Pay per character when using agents

## Quick Start

### 1. Database Setup
```bash
# Initialize V3 schema
bun run database/schema-v3-categories.sql
```

### 2. Start Server
```bash
bun run src/server-v3.ts
```

## API Endpoints

### Categories
```
GET    /api/v3/categories              # List all categories
GET    /api/v3/categories/:slug        # Category details
GET    /api/v3/categories/:slug/stories # Stories in category
GET    /api/v3/categories/stats        # Stats for all categories
GET    /api/v3/categories/recommend?wordCount=5000  # Recommend category
```

### Pricing
```
GET    /api/v3/pricing/tiers           # All pricing tiers
GET    /api/v3/pricing/summary        # Public pricing summary
POST   /api/v3/pricing/calculate      # Calculate cost for content
POST   /api/v3/pricing/check-free     # Check if content is free tier
GET    /api/v3/pricing/usage          # User usage stats (auth)
```

## Pricing Tiers

| Characters | Price (cUSD) | Description |
|------------|--------------|-------------|
| 0-300      | FREE         | Quick thoughts and ideas |
| 301-700    | $0.50        | Short paragraphs |
| 701-1600   | $1.00        | Full scene |
| 1601-3900  | $2.50        | Chapter segment |
| 3901-4700  | $3.00        | Extended content |

**Note**: Content over 4700 characters must be split across multiple submissions.

## Free Period
- **2 hours daily**: All agents FREE (up to 300 chars per use)
- **3 hour cooldown**: Agents locked, reading still free
- **Resets daily**: 2-hour free window starts fresh each day

## Content Categories

| Category | Typical Length | Description |
|----------|----------------|-------------|
| Novel | 80,000 words | Long-form fiction |
| Novella | 30,000 words | Medium fiction |
| Short Story | 5,000 words | Brief complete narratives |
| Magazine Article | 2,000 words | Journalistic writing |
| Blog Post | 1,000 words | Episodic content |
| Screenplay | 15,000 words | Script format |
| Poetry | 500 words | Verse and poetic forms |
| Anthology | 50,000 words | Multi-author collections |
| Interactive | 10,000 words | Choose-your-path stories |

**Key Point**: Categories are format-based only. Stories can have ANY genre regardless of category.

## File Structure
```
StoryChain/
├── database/
│   └── schema-v3-categories.sql      # V3 database schema
├── src/
│   ├── services/
│   │   ├── categoryService.ts       # Category management
│   │   └── characterPricing.ts      # Pricing calculations
│   ├── routes/
│   │   ├── categories.ts            # Category API routes
│   │   ├── pricing.ts               # Pricing API routes
│   │   └── index-v3.ts              # V3 router
│   └── server-v3.ts                 # Main server
├── ARCHITECTURE-v3.md               # V3 design document
└── README-v3.md                     # This file
```

## Integration Guide

### Set Story Category
```typescript
import categoryService from './services/categoryService';

await categoryService.setStoryCategory(storyId, 'short_story');
```

### Calculate Content Cost
```typescript
import characterPricing from './services/characterPricing';

const cost = await characterPricing.calculateCost(content);
console.log(`Cost: $${cost.priceCusd} cUSD for ${cost.characterCount} chars`);
```

### Record Usage After Payment
```typescript
await characterPricing.recordCharacterUsage(
  userId,
  content,
  cost.tierId,
  cost.priceCusd,
  storyId,
  sessionId,
  modelUsed
);
```

## What's Always Free
- Reading stories (no limits)
- Commenting on stories
- Liking/following users
- Browsing categories
- Writing WITHOUT agents (manual)

## What's Paid
- Using AI agents (character-based pricing)
- Only during non-free periods OR exceeding 300 chars

## Payment Methods
- cUSD (Celo stablecoin)
- ETH
- SOL

## Testing
```bash
# Test categories
curl http://localhost:3000/api/v3/categories

# Test pricing calculation
curl -X POST http://localhost:3000/api/v3/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{"content":"This is a test with 42 characters."}'

# Test free tier check
curl -X POST http://localhost:3000/api/v3/pricing/check-free \
  -H "Content-Type: application/json" \
  -d '{"content":"Short text."}'
```
