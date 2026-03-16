# StoryChain Platform v3 - IP + Multi-Wallet + Time-Based Freemium

**Date:** 2025-03-15
**Status:** Design Phase

---

## MAJOR CHANGES FROM v2

| Feature | v2 (Discarded) | v3 (New) |
|---------|---------------|----------|
| Book IDs | Custom SC-YYYY-XXXXX | **Keep ISBN** (user request) |
| Tiers | Free/Author/Publisher | **NO TIERS** - completely free |
| Agent Payment | Per-agent unlock | **Per-character pricing** |
| Preview | Tier-based (3/10/30 pages) | **Time-based freemium** |
| Wallet | Celo only | **Multi-wallet** (Phantom, Rabby, etc.) |
| Revenue | Weighted 90% to contributors | **IP Ownership Registry** |
| Platform Fee | 10% | **Free platform** |

---

## NEW CORE CONCEPTS

### 1. INTELLECTUAL PROPERTY REGISTRY
Every story is an IP asset with fractional ownership tracked on-chain:

```
IP Registry Entry:
- story_id: unique identifier
- isbn: official ISBN (optional but kept)
- content_hash: sha256 of final content
- contributors: [{user_id, percentage, role}]
- commercial_rights: YES/NO
- licensing_terms: CC-BY, All Rights, etc.
- nft_contract: address (if tokenized)
- created_at: timestamp
```

**Commercial Use Protection:**
If content is adapted for film/TV/games, ALL contributors must be acknowledged and compensated according to their ownership percentage. Smart contract enforces this.

### 2. MULTI-WALLET CONNECTOR
Support 15+ popular wallets across chains:

**EVM Wallets:**
- MetaMask
- Rabby (highly requested)
- TokenPocket
- SafePal
- Trust Wallet
- Coinbase Wallet
- WalletConnect (generic)

**Solana Wallets:**
- Phantom (highly requested)
- Solflare
- Glow

**Others:**
- Keplr (Cosmos)
- Leap (Cosmos)

### 3. TIME-BASED FREEMIUM MODEL

```
FREE PERIOD (2 hours):
├─ Can use all agents
├─ 300 character limit per contribution
├─ Unlimited contributions
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
└─ Pay each time you want agent assistance
```

### 4. CHARACTER-BASED PRICING

| Characters | Price (cUSD) | Description |
|------------|--------------|-------------|
| 0-300 | FREE | Basic thoughts, quick ideas |
| 301-700 | 0.50 | Short paragraphs |
| 701-1600 | 1.00 | Full scene |
| 1601-3900 | 2.50 | Chapter segment |
| 3901-4700 | 3.00 | Extended content |

NOTE: Content over 4700 characters must be split across multiple agent submissions.

### 5. CATEGORIES (NOT GENRES)

Users choose content format, NOT genre constraints:

```
CATEGORIES:
├─ novel (long-form fiction)
├─ novella (medium fiction)
├─ short_story (brief fiction)
├─ magazine_article (journalism style)
├─ blog_post (informal, episodic)
├─ screenplay (script format)
├─ poetry (verse)
├─ anthology (collection)
└─ interactive (choose-your-path)
```

**NO GENRE LOCK-IN:** Stories can evolve freely across genres.

### 6. TOKENIZATION (NFT BOOKS)

Optional: Mint completed stories as NFTs:

```
NFT Book Contract:
- token_id: unique
- isbn: linked ISBN
- content_uri: IPFS hash
- royalty_split: [{address, percentage}]
- transferrable: true/false
- limited_edition: count
```

Benefits:
- Provable ownership
- Automatic royalties on resale
- Cross-platform portability
- Collector value

---

## SYSTEM ARCHITECTURE

### Folder Structure
```
StoryChain/
├── src/
│   ├── api/
│   │   ├── routes.ts              # Core routes
│   │   ├── publishingRoutes-v3.ts # NEW: IP + multi-wallet
│   │   ├── walletRoutes.ts        # NEW: Multi-wallet connector
│   │   ├── ipRegistryRoutes.ts    # NEW: IP ownership
│   │   └── agentRoutes.ts         # NEW: Character-based pricing
│   ├── services/
│   │   ├── ipRegistry.ts          # IP ownership tracking
│   │   ├── multiWallet.ts         # Wallet connector service
│   │   ├── characterPricing.ts    # Character-based billing
│   │   ├── timeTracker.ts         # 2hr free + 3hr cooldown
│   │   └── nftMinter.ts           # Optional NFT minting
│   ├── utils/
│   │   ├── isbn.ts                # ISBN validation/formatting
│   │   ├── ipfs.ts                # IPFS content storage
│   │   └── wallets/
│   │       ├── evm.ts             # EVM wallet connector
│   │       ├── solana.ts          # Solana wallet connector
│   │       └── cosmos.ts          # Cosmos wallet connector
│   └── contracts/
│       ├── IPRegistry.sol         # IP ownership smart contract
│       ├── RoyaltySplitter.sol    # Automatic revenue split
│       └── StoryNFT.sol           # NFT book contract
├── database/
│   └── schema-v3.sql              # Complete v3 schema
├── docs/
│   ├── IP_FRAMEWORK.md            # IP ownership docs
│   ├── WALLET_INTEGRATION.md      # Wallet setup guide
│   └── PRICING_MODEL.md           # Character pricing explained
└── migrations/
    └── v3_migration.ts            # Migrate from v2
```

### Database Schema (v3)

```sql
-- Core IP Registry
CREATE TABLE ip_registry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id INTEGER UNIQUE NOT NULL,
    isbn TEXT, -- Optional but kept per user request
    content_hash TEXT NOT NULL, -- SHA256 of final content
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    commercial_rights_enabled BOOLEAN DEFAULT FALSE,
    licensing_terms TEXT DEFAULT 'all_rights_reserved',
    nft_contract_address TEXT,
    nft_token_id TEXT,
    status TEXT DEFAULT 'active' -- active, disputed, revoked
);

-- Fractional IP Ownership
CREATE TABLE ip_ownership (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ip_registry_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    ownership_percentage REAL NOT NULL CHECK(ownership_percentage > 0 AND ownership_percentage <= 100),
    role TEXT NOT NULL, -- creator, contributor, editor, illustrator
    verified BOOLEAN DEFAULT FALSE,
    signature TEXT, -- Digital signature of agreement
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ip_registry_id) REFERENCES ip_registry(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Multi-wallet support
CREATE TABLE user_wallets_v3 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    wallet_type TEXT NOT NULL, -- metamask, phantom, rabby, etc.
    chain TEXT NOT NULL, -- ethereum, solana, cosmos
    address TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    verified BOOLEAN DEFAULT FALSE,
    connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, address)
);

-- Time-based freemium tracking
CREATE TABLE user_time_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_type TEXT NOT NULL, -- free_period, cooldown, paid
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    characters_used INTEGER DEFAULT 0,
    cost_incurred REAL DEFAULT 0,
    status TEXT DEFAULT 'active', -- active, expired, completed
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Character-based pricing
CREATE TABLE character_pricing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    min_chars INTEGER NOT NULL,
    max_chars INTEGER NOT NULL,
    price_cusd REAL NOT NULL,
    description TEXT
);

-- Insert pricing tiers
INSERT INTO character_pricing VALUES
(1, 300, 0.00, 'Free tier - ideas and short thoughts'),
(301, 700, 0.50, 'Short paragraphs'),
(701, 1600, 1.00, 'Full scene writing'),
(1601, 3900, 2.50, 'Chapter segments'),
(3901, 10000, 3.00, 'Extended content');

-- Content categories (not genres)
CREATE TABLE content_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    avg_word_count INTEGER -- Typical length
);

INSERT INTO content_categories VALUES
('novel', 'Novel', 'Long-form fiction, 50k+ words', 80000),
('novella', 'Novella', 'Medium fiction, 17k-50k words', 30000),
('short_story', 'Short Story', 'Brief fiction, under 17k words', 5000),
('magazine_article', 'Magazine Article', 'Journalistic or feature writing', 2000),
('blog_post', 'Blog Post', 'Informal, episodic content', 1000),
('screenplay', 'Screenplay', 'Script format for film/TV', 15000),
('poetry', 'Poetry', 'Verse and poetic forms', 500),
('anthology', 'Anthology', 'Collection of works', 50000),
('interactive', 'Interactive Story', 'Choose-your-path narrative', 10000);
```

---

## API ROUTES (v3)

### Wallet Routes
```
POST /api/v3/wallets/connect        - Connect wallet (multi-type)
GET  /api/v3/wallets/:userId          - List user's wallets
POST /api/v3/wallets/verify         - Verify wallet ownership
POST /api/v3/wallets/set-primary    - Set primary wallet
```

### IP Registry Routes
```
POST /api/v3/ip/register            - Register story IP
GET  /api/v3/ip/:storyId            - Get IP details
GET  /api/v3/ip/:storyId/owners     - List fractional owners
POST /api/v3/ip/transfer            - Transfer ownership %
POST /api/v3/ip/commercial-license  - Grant commercial license
```

### Agent Routes (Time-based + Character pricing)
```
GET  /api/v3/agents/status          - Check free time remaining
POST /api/v3/agents/submit          - Submit content (auto-billed)
GET  /api/v3/agents/pricing         - Get character pricing tiers
POST /api/v3/agents/extend          - Pay to extend session
```

### Category Routes
```
GET  /api/v3/categories             - List content categories
POST /api/v3/stories/:id/category   - Set story category
```

### NFT Routes (Optional)
```
POST /api/v3/nft/mint               - Mint story as NFT
GET  /api/v3/nft/:tokenId           - Get NFT details
POST /api/v3/nft/transfer           - Transfer NFT ownership
```

---

## IMPLEMENTATION PHASES

### Phase 1: Core Infrastructure
1. Database schema v3
2. Multi-wallet connector service
3. IP registry tables
4. Time tracker service

### Phase 2: IP & Ownership
1. IP registration flow
2. Fractional ownership tracking
3. Commercial rights framework
4. Digital signatures

### Phase 3: Freemium Model
1. 2-hour free session tracking
2. 3-hour cooldown logic
3. Character-based billing
4. Payment processing

### Phase 4: Categories
1. Category system (no genres)
2. Story categorization
3. Category-based browsing

### Phase 5: Tokenization (Optional)
1. NFT smart contracts
2. Minting interface
3. Royalty distribution
4. Marketplace integration

---

## MISSING PIECES / QUESTIONS

### For You to Decide:

1. **ISBN Source:** Where do we get ISBNs?
   - User provides their own?
   - We bulk purchase and assign?
   - Skip ISBN for now (just track without)?

2. **Character Pricing:** Confirm amounts:
   - 300 chars: FREE
   - 700 chars: 0.50 cUSD
   - 1600 chars: 1.00 cUSD
   - 3900 chars: 2.50 cUSD
   - 3900+: 3.00 cUSD

3. **Payment Frequency:**
   - Pay per agent use?
   - Pay per submission?
   - Subscription for unlimited?

4. **NFT Standard:**
   - ERC-721 (unique)?
   - ERC-1155 (editions)?
   - Custom standard?

5. **Chain for IP Registry:**
   - Celo (existing)?
   - Ethereum (more established)?
   - Polygon (cheaper)?
   - Multi-chain?

---

## WHAT WE'RE IMPROVING

| Aspect | v2 Problem | v3 Solution |
|--------|-----------|-------------|
| Accessibility | Tiers exclude users | Free for all, pay only for extended use |
| Flexibility | Locked into genres | Categories only, free genre evolution |
| Ownership | Unclear contributor rights | IP registry with fractional ownership |
| Wallet | Celo only limits users | 15+ wallet options across chains |
| Revenue | 10% platform fee turns off users | Zero platform fee, users keep all |
| Discovery | Genre browsing | Category + collaborative filtering |

---

## REVIEW: OpenHands v2 Work

### What Was Built:
- Weighted revenue sharing (90% to contributors)
- Custom book ID system (SC-YYYY-XXXXX)
- Agent selection with pay-per-use
- Celo integration
- Preview tiers (3/10/30 pages)

### Why We're Pivoting:
**Your feedback revealed:**
1. Users want familiar ISBNs, not custom IDs
2. Tiers create barriers - free platform wins
3. Multiple wallet support is expected (Phantom, Rabby)
4. IP ownership needs formal recognition for commercial use
5. Time-based access feels fairer than tier-based

### What's Preserved:
- ✅ Contributor revenue sharing concept
- ✅ Wallet/payment infrastructure (will extend)
- ✅ Database schema patterns
- ✅ API route structure

### What's Discarded:
- ❌ Custom book IDs (back to ISBN)
- ❌ Tier system (free for all)
- ❌ Tier-based previews
- ❌ 10% platform fee

---

## NEXT STEPS

Ready to implement? I need your decisions on:

1. **Confirm pricing tiers** (300/700/1600/3900)
2. **ISBN handling** (user-provided or skip for now?)
3. **Primary blockchain** (Celo, Ethereum, Polygon?)
4. **Start building?** (I can begin with database + wallet connector)

This is a bold, user-friendly pivot. The platform becomes:
- **Truly free** for casual users
- **Fair pricing** for power users (pay for what you use)
- **Multi-chain** (support everyone's preferred wallet)
- **IP protected** (contributors have verifiable ownership)
- **Genre-fluid** (stories evolve naturally)
