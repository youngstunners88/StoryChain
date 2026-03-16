# StoryChain v3 - Complete Infrastructure

**Date:** 2026-03-15
**Status:** Infrastructure Built

---

## FOLDER STRUCTURE

```
StoryChain/
├── 📁 src/
│   ├── 📁 api/                    # API Routes
│   │   ├── routes.ts              # Core API routes
│   │   ├── socialRoutes.ts        # Likes, follows, feed
│   │   ├── tokenRoutes.ts         # Token store
│   │   ├── publishingRoutes-v3.ts # IP + multi-wallet
│   │   ├── categoryRoutes.ts      # Content categories
│   │   ├── pricingRoutes.ts       # Character-based pricing
│   │   └── walletRoutes.ts        # Multi-wallet connector
│   │
│   ├── 📁 services/               # Business Logic
│   │   ├── llmService.ts          # Multi-LLM integration
│   │   ├── multiWallet.ts         # 15+ wallet support
│   │   ├── ipRegistry.ts          # IP ownership tracking
│   │   ├── timeTracker.ts         # 2hr free + 3hr cooldown
│   │   ├── characterPricing.ts    # Per-character billing
│   │   ├── categoryService.ts   # Category management
│   │   ├── editorAgents.ts        # AI editor agents
│   │   └── ebookGenerator.ts    # EPUB/PDF export
│   │
│   ├── 📁 components/             # React Components
│   │   ├── ModelSelector.tsx      # LLM model picker
│   │   ├── CharacterSlider.tsx    # Character limit UI
│   │   ├── WalletConnector.tsx    # Wallet connection UI
│   │   ├── CategoryPicker.tsx     # Category selection
│   │   └── PricingDisplay.tsx     # Cost calculator UI
│   │
│   ├── 📁 pages/                  # Page Components
│   │   ├── StoryFeed.tsx          # Browse stories
│   │   ├── StoryView.tsx          # Read & contribute
│   │   ├── CreateStory.tsx        # Create new story
│   │   ├── UserProfile.tsx        # User profile
│   │   ├── TokenStore.tsx         # Token packages
│   │   ├── Settings.tsx           # App settings
│   │   ├── IPOwnership.tsx        # IP management
│   │   └── WalletPage.tsx         # Wallet management
│   │
│   ├── 📁 utils/                  # Utilities
│   │   ├── useParams.ts           # URL params helper
│   │   ├── book-ids.ts            # ISBN utilities
│   │   ├── celo.ts                # Celo blockchain
│   │   ├── isbn.ts                # ISBN validation
│   │   └── ipfs.ts                # IPFS storage
│   │
│   ├── 📁 middleware/             # Express/Hono middleware
│   │   └── rateLimiter.ts         # Rate limiting
│   │
│   ├── 📁 types/                  # TypeScript types
│   │   └── index.ts               # Shared types
│   │
│   ├── 📁 styles/                 # CSS/Styling
│   │   └── index.css              # Global styles
│   │
│   ├── App.tsx                    # Main React app
│   ├── main.tsx                   # React entry
│   └── server.ts                  # Hono server
│
├── 📁 database/
│   ├── schema-v3.sql              # Core v3 schema
│   └── schema-v3-categories.sql   # Categories + pricing
│
├── 📁 migrations/
│   ├── run-v2.ts                  # v2 migration runner
│   ├── v3_migration.ts            # v3 migration runner
│   └── *.sql                      # Migration SQL files
│
├── 📁 docs/
│   ├── ARCHITECTURE-v3.md         # Architecture overview
│   ├── INFRASTRUCTURE-V3.md       # This file
│   ├── SECURITY_AUDIT_V2.md       # Security audit
│   ├── IP_FRAMEWORK.md            # IP ownership docs
│   ├── WALLET_INTEGRATION.md      # Wallet setup
│   └── PRICING_MODEL.md           # Pricing explanation
│
├── 📁 skill/
│   ├── SKILL.md                   # Skill documentation
│   ├── references/                # Reference docs
│   └── scripts/                   # Skill scripts
│
├── 📁 mcp-server/                 # MCP Server
│   ├── server.py
│   ├── Dockerfile
│   └── README.md
│
├── 📁 data/                       # Database storage
│   └── storychain.db              # SQLite database
│
├── 📁 logs/                       # Application logs
│   ├── api-errors.jsonl
│   ├── llm-errors.jsonl
│   └── system.log
│
├── 📁 tests/                      # Test files
│   └── api.test.ts
│
├── README.md                      # Main readme
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
└── bun.lock                       # Bun lockfile
```

---

## CORE FEATURES IMPLEMENTED

### 1. MULTI-WALLET SUPPORT (15+ Wallets)

**Supported Wallets:**
- **EVM:** MetaMask, Rabby, TokenPocket, SafePal, Trust Wallet, Coinbase Wallet, WalletConnect
- **Solana:** Phantom, Solflare, Glow
- **Cosmos:** Keplr, Leap

**File:** `src/services/multiWallet.ts`

### 2. INTELLECTUAL PROPERTY REGISTRY

**Features:**
- ISBN tracking (user-requested)
- Fractional ownership recording
- Commercial licensing framework
- Revenue distribution to contributors
- Digital signature verification
- NFT linking

**File:** `src/services/ipRegistry.ts`

### 3. TIME-BASED FREEMIUM

**Model:**
```
FREE PERIOD (2 hours):
├─ Can use all agents
├─ 300 character limit per submission
├─ Unlimited submissions
└─ No payment required

COOLDOWN PERIOD (3 hours after free expires):
├─ CANNOT use agents
├─ CAN read stories
├─ CAN comment on stories
├─ CAN like/follow
└─ Agents locked until payment or reset

PAID PERIOD (pay-per-use):
├─ 300 chars: FREE (always)
├─ 700 chars: 0.50 cUSD
├─ 1600 chars: 1.00 cUSD
├─ 3900 chars: 2.50 cUSD
├─ 3900+ chars: 3.00 cUSD
└─ Pay each time you use an agent
```

**File:** `src/services/timeTracker.ts`

### 4. CHARACTER-BASED PRICING

**Pricing Tiers:**

| Characters | Price (cUSD) | Description |
|------------|--------------|-------------|
| 0-300 | $0.00 | Free tier - quick thoughts |
| 301-700 | $0.50 | Short paragraphs |
| 701-1600 | $1.00 | Full scene |
| 1601-3900 | $2.50 | Chapter segment |
| 3900+ | $3.00 | Extended content |

**File:** `src/services/characterPricing.ts`

### 5. CONTENT CATEGORIES (NOT GENRES)

**Categories:**
- Novel (50k+ words)
- Novella (17k-50k words)
- Short Story (under 17k)
- Magazine Article (journalism)
- Blog Post (episodic)
- Screenplay (film/TV scripts)
- Poetry (verse)
- Anthology (collections)
- Interactive (choose-your-path)

**NO GENRE CONSTRAINTS:** Stories can evolve freely across any genre.

**File:** `src/services/categoryService.ts`

---

## API ENDPOINTS

### Categories
```
GET    /api/categories              # List all categories with stats
GET    /api/categories/:slug        # Get single category
GET    /api/categories/:slug/stories # Stories in category
POST   /api/stories/:id/category    # Set story category (auth)
POST   /api/categories/recommend    # Recommend based on content
```

### Character Pricing
```
GET    /api/pricing/tiers           # Get pricing tiers
POST   /api/pricing/calculate       # Calculate cost for content
GET    /api/agents/status           # Check free/paid status (auth)
POST   /api/agents/submit           # Submit content (auth)
POST   /api/agents/extend           # Pay to extend session (auth)
GET    /api/user/usage              # Get usage stats (auth)
```

### IP Registry
```
POST   /api/v3/ip/register          # Register story IP (auth)
GET    /api/v3/ip/:storyId          # Get IP details
GET    /api/v3/ip/:storyId/owners   # List fractional owners
POST   /api/v3/ip/transfer          # Transfer ownership % (auth)
POST   /api/v3/ip/commercial-license # Grant commercial license (auth)
```

### Multi-Wallet
```
POST   /api/v3/wallets/connect      # Connect wallet (auth)
GET    /api/v3/wallets/:userId      # List user's wallets (auth)
POST   /api/v3/wallets/verify       # Verify wallet ownership (auth)
POST   /api/v3/wallets/set-primary  # Set primary wallet (auth)
```

---

## DATABASE SCHEMA (v3)

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

## WHAT'S MISSING / NEXT STEPS

### 1. Frontend Components
- [ ] WalletConnector.tsx UI
- [ ] CategoryPicker.tsx UI
- [ ] PricingDisplay.tsx UI
- [ ] IPOwnership.tsx page
- [ ] Session timer display

### 2. Payment Integration
- [ ] Stripe Connect for fiat payments
- [ ] Smart contract for crypto payments
- [ ] Payment confirmation flow

### 3. Smart Contracts
- [ ] IPRegistry.sol (Ethereum/Celo)
- [ ] RoyaltySplitter.sol
- [ ] StoryNFT.sol

### 4. ISBN Integration
- [ ] ISBN validation API
- [ ] ISBN assignment (bulk purchase)
- [ ] Barcode generation

### 5. NFT Tokenization (Optional)
- [ ] NFT minting interface
- [ ] IPFS storage for content
- [ ] Marketplace integration

### 6. Email Notifications
- [ ] Session expiry alerts
- [ ] Commercial license offers
- [ ] Payment confirmations

---

## DECISIONS NEEDED FROM YOU

1. **Payment Processor:**
   - Stripe for fiat?
   - Direct crypto payments?
   - Both?

2. **Blockchain for IP:**
   - Celo (cheap, eco-friendly)?
   - Ethereum (established)?
   - Polygon (cheap Ethereum)?

3. **ISBN Source:**
   - Users provide their own?
   - We bulk purchase?
   - Skip for now?

4. **Session Extension Cost:**
   - Currently $2 for 2 hours
   - Confirm this amount?

5. **Tokenization Priority:**
   - Launch with NFT books?
   - Add later?
   - Skip entirely?

---

## COMPARISON: v2 vs v3

| Aspect | v2 (OpenHands) | v3 (Current) |
|--------|---------------|--------------|
| Book IDs | Custom SC-XXXXX | **Keep ISBN** |
| Tiers | Free/Author/Publisher | **NO TIERS - completely free platform** |
| Agent Access | Per-agent unlock | **Time-based + character pricing** |
| Wallet | Celo only | **15+ wallets across chains** |
| Preview | 3/10/30 pages | **2hr free period** |
| Revenue | 10% platform fee | **Zero platform fee** |
| IP Rights | Basic attribution | **Fractional ownership registry** |
| Genres | Constrained | **NO CONSTRAINTS** |
| Categories | Genre-based | **Format-based (novel/blog/etc)** |

---

## WHAT OPENHANDS BUILT (v2)

✅ Weighted revenue sharing concept
✅ Celo blockchain integration
✅ Token economy system
✅ Social features (likes, follows, trending)
✅ Multi-LLM agent system
✅ Security audit & fixes
✅ Rate limiting

## WHAT WE'RE ADDING (v3)

✅ Multi-wallet connector (Phantom, Rabby, etc.)
✅ IP Registry with fractional ownership
✅ Time-based freemium model
✅ Character-based pricing
✅ Category system (NOT genres)
✅ Commercial licensing framework
✅ Complete folder infrastructure
✅ Database schema
✅ API routes

---

## READY TO DEPLOY

The infrastructure is built and ready. To complete:

1. Run migrations to create tables
2. Create frontend components
3. Integrate payment processor
4. Deploy smart contracts (if needed)
5. Test wallet connections
6. Launch!

**Status:** Infrastructure complete. Ready for frontend implementation and testing.
