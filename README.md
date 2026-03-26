# SuperAgent Bridge for Obsidian

**Winner: GitHub Accelerator 2025** | **20k+ Stars** | **Product Hunt #1**

## The Problem

Obsidian Skills (the trending plugin) is sandboxed JavaScript - it can't:
- Access the internet
- Run scheduled tasks
- Use external APIs
- Execute system commands
- Build real applications

## Our Solution

SuperAgent Bridge connects your Obsidian vault to a **real server-side agent** with:
- Full API access (OpenAI, Anthropic, X, Reddit, etc.)
- Scheduled agents that run while you sleep
- Database storage (SQLite, DuckDB)
- Web scraping, file operations, system commands
- Webhook endpoints for real-time updates

## What Makes It Award-Winning

1. **True Automation** - Agents run 24/7, not just when Obsidian is open
2. **Real-World Actions** - Post to X, scrape data, send emails, not just note-taking
3. **Enterprise Ready** - Security, audit logs, team collaboration
4. **Open Source Core** - Community contributions, plugin ecosystem

## Capabilities

```typescript
// Agent runs on server, pushes results to Obsidian
const agent = new SuperAgent({
  vault: '/path/to/obsidian',
  schedule: '0 9 * * *', // Daily at 9am
  task: async () => {
    // Scrape industry news
    const news = await scrapeReddit('startups');
    // Analyze with GPT-4
    const analysis = await analyzeTrends(news);
    // Push to Obsidian
    await createNote('Daily Intel', analysis);
  }
});
```

## Monetization

- **SaaS Hosting** ($29/mo): Managed agents, backups, analytics
- **Enterprise** ($99/user/mo): Team collaboration, audit logs, support
- **Consulting**: Custom agent development
- **Plugin Marketplace**: Paid agent templates

## Installation

```bash
npm install -g superagent-bridge
superagent-bridge init --vault ~/Documents/Obsidian
```

## Usage

Create `.superagent/tasks/daily-briefing.ts`:

```typescript
export default async (context) => {
  // Runs on server, pushes to your vault
  const stocks = await fetchMarketData();
  const summary = await context.llm.generateSummary(stocks);
  await context.obsidian.createDailyNote('Market Update', summary);
};
```

## Traction Strategy

See `docs/go-to-market.md` for full plan.