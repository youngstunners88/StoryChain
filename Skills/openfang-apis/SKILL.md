---
name: openfang-apis
description: Autonomous 24/7 gateway to 1400+ public APIs from the public-apis repository. Intelligent routing, parallel execution, caching, and agent orchestration for seamless API access without manual intervention.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  version: "1.0.0"
  source: https://github.com/public-apis/public-apis
  api_count: 1400+
  categories: 50
---

# OpenFang APIs Gateway

## Overview
This skill provides autonomous, 24/7 access to the entire public-apis collection (1400+ APIs across 50 categories). It intelligently routes requests, manages authentication, caches responses, and orchestrates parallel API calls using the Clawrouter Leadership pattern.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    OPENFANG API GATEWAY                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Orchestrator│  │  API Router │  │  Cache Layer        │  │
│  │  (Leader)    │  │  (Clawroute)│  │  (SQLite)           │  │
│  └──────┬───────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                 │                     │            │
│  ┌──────▼─────────────────▼─────────────────────▼──────────┐│
│  │                    API CATALOG (1400+ APIs)              ││
│  │  Animals | Anime | Blockchain | Business | Calendar      ││
│  │  Crypto | Finance | Games | Geocoding | Government       ││
│  │  Health | Jobs | Machine Learning | Music | News         ││
│  │  Science | Security | Social | Sports | Weather | ...    ││
│  └──────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Commands

### `start`
Start the 24/7 gateway service.

```bash
bun scripts/gateway.ts start
```

### `stop`
Stop the gateway service.

```bash
bun scripts/gateway.ts stop
```

### `status`
Check gateway health and active connections.

```bash
bun scripts/gateway.ts status
```

### `query <request>`
Intelligent API routing - describe what you need in natural language.

```bash
bun scripts/orchestrator.ts query "get weather for Johannesburg"
bun scripts/orchestrator.ts query "find crypto prices for BTC and ETH"
bun scripts/orchestrator.ts query "get random cat facts"
```

### `parallel <requests>`
Execute multiple API calls in parallel.

```bash
bun scripts/orchestrator.ts parallel "weather:Johannesburg" "crypto:BTC" "cats:random"
```

### `category <name>`
List all APIs in a category.

```bash
bun scripts/api-catalog.ts category animals
bun scripts/api-catalog.ts category cryptocurrency
```

### `search <term>`
Search APIs by keyword or description.

```bash
bun scripts/api-catalog.ts search "bitcoin"
bun scripts/api-catalog.ts search "weather"
```

### `discover <domain>`
Find relevant APIs for a domain or use case.

```bash
bun scripts/orchestrator.ts discover "trading bot"
bun scripts/orchestrator.ts discover "social media analytics"
```

## API Categories (50 Total)

| Category | APIs | Description |
|----------|------|-------------|
| Animals | 27 | Pet data, animal facts, images |
| Anime | 19 | Anime databases, quotes, streaming |
| Anti-Malware | 6 | Security scanning, threat detection |
| Art & Design | 26 | Icons, images, color tools |
| Authentication | 7 | Auth platforms, OTP, passwordless |
| Blockchain | 11 | Chain data, smart contracts, DEX |
| Books | 23 | Religious texts, literature, poetry |
| Business | 23 | CRM, analytics, email marketing |
| Calendar | 10 | Holidays, events, scheduling |
| Cloud Storage | 8 | File sharing, storage APIs |
| CI/CD | 6 | Build automation, deployment |
| Cryptocurrency | 25+ | Prices, exchanges, on-chain data |
| Currency Exchange | 8 | Forex rates, conversion |
| Data Validation | 10 | Email, phone, address validation |
| Development | 18 | Code tools, APIs for devs |
| Dictionaries | 9 | Word definitions, translations |
| Documents | 8 | PDF, document processing |
| Email | 17 | Email services, validation |
| Entertainment | 30+ | Movies, TV, games, quotes |
| Environment | 8 | Climate, carbon, sustainability |
| Events | 7 | Event discovery, ticketing |
| Finance | 25+ | Stocks, markets, banking |
| Food & Drink | 13 | Recipes, restaurants, nutrition |
| Games & Comics | 25+ | Gaming APIs, comic databases |
| Geocoding | 40+ | Maps, location, addresses |
| Government | 20+ | Open data, civic APIs |
| Health | 12 | Medical data, fitness, COVID |
| Jobs | 8 | Job boards, career data |
| Machine Learning | 8 | ML APIs, model serving |
| Music | 18 | Lyrics, streaming, metadata |
| News | 12 | News feeds, journalism |
| Open Data | 15+ | Public datasets, statistics |
| Open Source | 8 | GitHub, project data |
| Patent | 4 | Patent databases |
| Personality | 8 | Personality tests, quotes |
| Phone | 7 | Phone validation, SMS |
| Photography | 12 | Photo APIs, image hosting |
| Programming | 11 | Code resources, languages |
| Science & Math | 20+ | Research, calculations |
| Security | 7 | Vulnerability data, tools |
| Shopping | 6 | E-commerce, product data |
| Social | 14 | Social networks, messaging |
| Sports & Fitness | 15+ | Sports data, fitness tracking |
| Test Data | 12 | Mock data generators |
| Text Analysis | 10 | NLP, sentiment, keywords |
| Tracking | 6 | Package tracking, logistics |
| Transportation | 7 | Transit, vehicles, routing |
| URL Shorteners | 16 | Link management |
| Vehicle | 6 | Car data, pricing |
| Video | 35+ | Movies, TV shows, streaming |
| Weather | 30+ | Forecasts, climate data |

## Authentication Management

Store API keys securely in Zo secrets:

```bash
# Add keys for authenticated APIs
OPENWEATHER_API_KEY=your_key
COINMARKETCAP_API_KEY=your_key
ETHERSCAN_API_KEY=your_key
```

Navigate to [Settings > Advanced](/?t=settings&s=advanced) to add secrets.

## Usage Patterns

### Pattern 1: Natural Language Query
```typescript
// Just describe what you need
orchestrator.query("get me the current Bitcoin price")
// → Routes to CoinGecko, CoinMarketCap, or CryptoCompare
```

### Pattern 2: Parallel Execution
```typescript
// Multiple APIs at once
orchestrator.parallel([
  { category: "weather", query: "Johannesburg" },
  { category: "crypto", query: "BTC price" },
  { category: "news", query: "technology" }
])
```

### Pattern 3: Fallback Chain
```typescript
// Try primary, fallback to alternatives
orchestrator.withFallback("crypto:BTC", [
  "coingecko",
  "coinmarketcap", 
  "cryptocompare"
])
```

### Pattern 4: Cached Responses
```typescript
// Cache for 1 hour by default
orchestrator.query("weather:Johannesburg", { cache: 3600 })
```

## Integration with Clawrouter Leadership

This skill integrates with the Clawrouter Leadership skill for:
- Multi-agent coordination
- Credit allocation for paid APIs
- Cross-chain crypto data routing
- Parallel API execution with worker agents

```bash
# Use both skills together
bun Skills/clawrouter-leadership/scripts/leadership.ts orchestrate --apis
```

## 24/7 Service Mode

The gateway runs as a persistent service via `register_user_service`:

```bash
# Start as background service
bun scripts/gateway.ts start

# It will:
# 1. Pre-warm connections to popular APIs
# 2. Cache frequently requested data
# 3. Auto-refresh tokens
# 4. Log all requests for analytics
# 5. Auto-retry failed requests
```

## Error Handling

- Automatic retry with exponential backoff
- Fallback to alternative APIs
- Rate limit awareness
- Circuit breaker for failing endpoints
- Graceful degradation

## Rate Limiting

Respects API rate limits:
- Tracks requests per API
- Queues requests when limit reached
- Suggests alternatives when limited
- Caches aggressively to reduce calls

## Examples

### Get Weather Data
```bash
bun scripts/orchestrator.ts query "weather forecast for Cape Town tomorrow"
```

### Fetch Crypto Prices
```bash
bun scripts/orchestrator.ts query "current price of SOL, ETH, and BTC"
```

### Get Random Content
```bash
bun scripts/orchestrator.ts query "random cat fact and random dog image"
```

### Business Intelligence
```bash
bun scripts/orchestrator.ts query "company data for Apple and Microsoft"
```

### News Aggregation
```bash
bun scripts/orchestrator.ts query "latest tech news from multiple sources"
```

## Monitoring

Check gateway health:
```bash
bun scripts/gateway.ts status
# Shows:
# - Active connections
# - Cache hit rate
# - Request count by category
# - Error rate
# - Rate limit status
```
