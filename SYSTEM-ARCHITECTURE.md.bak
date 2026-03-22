# StoryChain System Architecture

**Date:** 2026-03-16
**Version:** 3.0
**Status:** Infrastructure Built, Frontend Pending

---

## Executive Summary

StoryChain is a collaborative storytelling platform with AI-powered agent assistance. It combines human creativity with multi-LLM AI agents to create shared narratives. The platform features a unique time-based freemium model, IP ownership registry, character-based pricing, and multi-wallet payments.

---

## System Overview

```
+-------------------------+
|       FRONTEND LAYER    |
+-------------------------+
| StoryFeed | StoryView   |
| CreateStory | TokenStore|
| Settings | UserProfile  |
| IPOwnership| WalletPage |
+-----------+-------------+
            |
    API GATEWAY (Hono)
            |
+-----------+-------------+
|     SERVICE LAYER     |
+-------------------------+
| Category  | Character  |
| Service   | Pricing    |
|           |            |
| IP        | Multi      |
| Registry  | Wallet     |
|           |            |
| Editor    | LLM        |
| Agents    | Service    |
|           |            |
| E-Book    | Social     |
| Generator | Features   |
+-----------+-------------+
            |
+-----------+-------------+
|       DATA LAYER      |
+-------------------------+
| SQLite    | IPFS       |
| storychain|(Optional)  |
+-----------+-------------+
            |
+-----------+-------------+
|   BLOCKCHAIN LAYER    |
+-------------------------+
|   Celo    |  Solana    |
| (Primary) | (Phantom)  |
|           |            |
| Ethereum  | WalletConn |
| (MetaMask)| (Generic)  |
+-------------------------+
```

---

## Core Features

### 1. Time-Based Freemium Model

```
User Session Flow:
+--------------------------+
|  FREE PERIOD (2 hours)   |
|  - Use all AI agents     |
|  - 300 char limit/submit |
|  - Unlimited submissions |
|  - NO PAYMENT required   |
|           |              |
|           v              |
|  COOLDOWN (3 hours)      |
|  - CANNOT use agents     |
|  - CAN read stories      |
|  - CAN comment/like      |
|  - Agents LOCKED         |
|           |              |
|           v (pay unlock) |
|  PAID PERIOD             |
|  - 300 chars: FREE       |
|  - 700 chars: $0.50      |
|  - 1600 chars: $1.00     |
|  - 3900 chars: $2.50     |
|  - 3900+: $3.00          |
|           |              |
|           v              |
|  [Daily Reset] --------->|
+--------------------------+
```

### 2. Character-Based Pricing

| Characters | Price (cUSD) | Description |
|------------|--------------|-------------|
| 0-300 | FREE | Quick thoughts and ideas |
| 301-700 | $0.50 | Short paragraphs |
| 701-1600 | $1.00 | Full scene |
| 1601-3900 | $2.50 | Chapter segment |
| 3901-4700 | $3.00 | Extended content |

**Note:** Content over 4700 characters must be split across multiple submissions.

### 3. Content Categories (NOT Genres)

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

**NO GENRE LOCK-IN:** Stories can evolve freely across any genre.

### 4. Multi-Wallet Support (15+ Wallets)

**EVM Wallets:** MetaMask, Rabby, TokenPocket, SafePal, Trust Wallet, Coinbase Wallet, WalletConnect

**Solana Wallets:** Phantom, Solflare, Glow

**Cosmos Wallets:** Keplr, Leap

**Payment Methods:** cUSD (Celo), ETH, SOL

---

## Folder Structure

```
StoryChain/
├── src/
│   ├── api/              # API Routes
│   │   ├── routes.ts
│   │   ├── socialRoutes.ts
│   │   ├── tokenRoutes.ts
│   │   ├── publishingRoutes.ts
│   │   ├── categoryRoutes.ts
│   │   ├── pricingRoutes.ts
│   │   └── walletRoutes.ts
│   ├── services/         # Business Logic
│   │   ├── llmService.ts
│   │   ├── multiWallet.ts
│   │   ├── ipRegistry.ts
│   │   ├── timeTracker.ts
│   │   ├── characterPricing.ts
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
│   ├── schema-v3.sql
│   └── schema-v3-categories.sql
├── data/
│   └── storychain.db
├── docs/
│   ├── ARCHITECTURE-v3.md
│   ├── INFRASTRUCTURE-V3.md
│   └── SECURITY_AUDIT_V2.md
├── tests/
│   └── api.test.ts
├── README.md
├── package.json
└── bun.lock
```

---

## API Endpoints

### Categories
```
GET    /api/categories              # List all categories
GET    /api/categories/:slug        # Get single category
GET    /api/categories/:slug/stories # Stories in category
POST   /api/stories/:id/category    # Set story category
```

### Character Pricing
```
GET    /api/pricing/tiers           # Get pricing tiers
POST   /api/pricing/calculate       # Calculate cost
GET    /api/agents/status           # Check free/paid status
POST   /api/agents/submit           # Submit content
GET    /api/user/usage              # Get usage stats
```

### IP Registry
```
POST   /api/v3/ip/register          # Register story IP
GET    /api/v3/ip/:storyId          # Get IP details
GET    /api/v3/ip/:storyId/owners   # List fractional owners
POST   /api/v3/ip/transfer          # Transfer ownership %
```

### Multi-Wallet
```
POST   /api/v3/wallets/connect      # Connect wallet
GET    /api/v3/wallets/:userId      # List user's wallets
POST   /api/v3/wallets/verify       # Verify ownership
```

---

## Database Schema

### Core Tables
- `users` - User accounts
- `stories` - Story content
- `contributions` - Story contributions
- `likes` - Story likes
- `follows` - User follows

### IP Tables
- `ip_registry` - IP registration records
- `ip_ownership` - Fractional ownership records
- `commercial_licenses` - Commercial licensing
- `commercial_revenue_distributions` - Revenue distribution

### Wallet Tables
- `user_wallets_v3` - Multi-wallet connections
- `wallet_verification_nonces` - Verification nonces

### Freemium Tables
- `user_time_sessions` - Session tracking
- `user_session_state` - Current session state
- `character_pricing` - Pricing tiers
- `agent_submissions` - Usage tracking
- `user_character_usage` - Daily usage stats

### Category Tables
- `content_categories` - Category definitions
- `category_stats` - Category statistics

---

## What's Missing / Next Steps

### 1. Frontend Components
- [ ] WalletConnector.tsx UI
- [ ] CategoryPicker.tsx UI
- [ ] PricingDisplay.tsx UI
- [ ] IPOwnership.tsx page
- [ ] Session timer display

### 2. Payment Integration
- [ ] Stripe Connect for fiat
- [ ] Smart contract for crypto
- [ ] Payment confirmation flow

### 3. Smart Contracts
- [ ] IPRegistry.sol (Ethereum/Celo)
- [ ] RoyaltySplitter.sol
- [ ] StoryNFT.sol

### 4. ISBN Integration
- [ ] ISBN validation API
- [ ] ISBN assignment
- [ ] Barcode generation

### 5. NFT Tokenization (Optional)
- [ ] NFT minting interface
- [ ] IPFS storage for content
- [ ] Marketplace integration

---

## Key Decisions Needed

1. **Payment Processor:** Stripe for fiat? Direct crypto payments? Both?
2. **Blockchain for IP:** Celo, Ethereum, or Polygon?
3. **ISBN Source:** Users provide their own, or skip for now?
4. **Session Extension Cost:** Currently $2 for 2 hours
5. **Tokenization Priority:** Launch with NFT books or add later?

---

## Comparison: v2 vs v3

| Aspect | v2 (Old) | v3 (Current) |
|--------|----------|--------------|
| Book IDs | Custom SC-XXXXX | Keep ISBN |
| Tiers | Free/Author/Publisher | NO TIERS - completely free |
| Agent Access | Per-agent unlock | Time-based + char pricing |
| Wallet | Celo only | 15+ wallets across chains |
| Preview | 3/10/30 pages | 2hr free period |
| Revenue | 10% platform fee | Zero platform fee |
| IP Rights | Basic attribution | Fractional ownership registry |
| Genres | Constrained | NO CONSTRAINTS |
| Categories | Genre-based | Format-based |

---

## Status

**Infrastructure:** Built and ready
**Database:** Schema complete
**Backend Services:** All implemented
**Frontend:** Pending component creation
**Testing:** API tests ready

**Next:** Frontend components, payment integration, smart contract deployment
