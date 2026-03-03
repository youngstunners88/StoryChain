---
name: api-vault
description: Strategic API discovery and fallback system. Search 1400+ free APIs from public-apis repository. Use when you need external data, services, or when other agents run low on options. Suggests APIs by category, auth requirement, and use case.
compatibility: Created for Zo Computer
metadata:
  author: kofi.zo.computer
  source: https://github.com/public-apis/public-apis
  total_apis: "1400+"
  categories: "50+"
---

# API Vault

A strategic API discovery system with 1400+ free APIs at your fingertips.

## When to Activate

- **Fallback mode**: When other agents/data sources are exhausted or unavailable
- **New integrations**: User needs external data or services
- **Prototyping**: Quick access to free APIs for testing
- **Research**: Finding APIs for specific domains (crypto, weather, finance, etc.)

## Quick Commands

```bash
# Search APIs by keyword
bun /home/workspace/Skills/api-vault/scripts/api-vault.ts search "weather"

# Find APIs with no auth required (fastest to use)
bun /home/workspace/Skills/api-vault/scripts/api-vault.ts no-auth

# Find APIs by category
bun /home/workspace/Skills/api-vault/scripts/api-vault.ts category "cryptocurrency"

# Suggest APIs for a task (AI-powered matching)
bun /home/workspace/Skills/api-vault/scripts/api-vault.ts suggest "I need real-time stock prices"

# List all categories
bun /home/workspace/Skills/api-vault/scripts/api-vault.ts categories

# Get random API for inspiration
bun /home/workspace/Skills/api-vault/scripts/api-vault.ts random
```

## Strategic Usage Patterns

### 1. Fallback Chain
When primary data sources fail:
1. Check if task can be completed with a public API
2. Filter by `--no-auth` for immediate use
3. Filter by `--https` and `--cors` for browser/client use

### 2. Rapid Prototyping
For quick demos and MVPs:
1. Use `no-auth` APIs to skip setup
2. Prefer APIs with CORS support for frontend apps
3. Check `suggest` command for domain-specific recommendations

### 3. Agent Resource Management
When spawning child agents:
1. Pre-fetch API options with `search` before delegating
2. Pass API suggestions to child agents in prompts
3. Use `category` to give agents focused options

## API Metadata Fields

Each API entry includes:
- **Name**: API identifier
- **Description**: What it provides
- **Auth**: `No`, `apiKey`, or `OAuth`
- **HTTPS**: Whether HTTPS is supported
- **CORS**: Whether CORS is supported

## Categories Available

Animals, Anime, Anti-Malware, Art & Design, Authentication, Blockchain, Books, Business, Calendar, Cloud Storage, Cryptocurrency, Currency Exchange, Data Validation, Development, Dictionaries, Documents, Email, Entertainment, Environment, Events, Finance, Food & Drink, Games, Geocoding, Government, Health, Jobs, Machine Learning, Music, News, Open Data, Open Source, Patent, Personality, Phone, Photography, Programming, Science, Security, Shopping, Social, Sports, Test Data, Text Analysis, Tracking, Transportation, URL Shorteners, Vehicle, Video, Weather, and more.

## Example Use Cases

| Task | Suggested APIs |
|------|---------------|
| Get weather data | OpenWeatherMap, WeatherAPI, Open-Meteo |
| Fetch crypto prices | CoinGecko, Binance, CoinCap |
| Validate emails | Abstract Email, mailboxlayer |
| Generate test data | FakeJSON, JSONPlaceholder |
| Get stock prices | Alpha Vantage, Yahoo Finance |
| Shorten URLs | Bitly, Rebrandly |
| Geocode addresses | OpenStreetMap, PositionStack |
| Parse user agents | UserAgentAPI, WhatIsMyBrowser |

## Files

- `assets/public-apis-raw.md` - Full API database from GitHub
- `scripts/api-vault.ts` - CLI search and discovery tool
- `references/categories.md` - Organized category reference

## Updating the Database

Run periodically to get new APIs:
```bash
curl -fsSL https://raw.githubusercontent.com/public-apis/public-apis/master/README.md \
  -o /home/workspace/Skills/api-vault/assets/public-apis-raw.md
```
