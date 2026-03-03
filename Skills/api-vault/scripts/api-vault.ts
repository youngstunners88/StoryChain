#!/usr/bin/env bun
/**
 * API Vault - Strategic API Discovery Tool
 * Search and filter 1400+ free APIs from public-apis repository
 */

import { readFileSync } from "fs";
import { join } from "path";

const ASSETS_DIR = join(import.meta.dir, "..", "assets");
const API_FILE = join(ASSETS_DIR, "public-apis-raw.md");

interface API {
  name: string;
  description: string;
  auth: string;
  https: boolean;
  cors: string;
  category: string;
  url?: string;
}

function parseAPIs(content: string): API[] {
  const apis: API[] = [];
  const lines = content.split("\n");
  let currentCategory = "";
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect category headers (### CategoryName)
    const categoryMatch = line.match(/^### (.+)$/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
      inTable = false;
      continue;
    }

    // Detect table start - header row without pipes OR with pipes
    // Format: "API | Description | Auth | HTTPS | CORS" or "| API | Description | Auth | HTTPS | CORS |"
    if (line.includes("API") && line.includes("Description") && line.includes("Auth") && line.includes("HTTPS") && line.includes("CORS")) {
      inTable = true;
      continue;
    }

    // Skip table separator (|:---|:---|...)
    if (line.match(/^\|:?[-]+:?/) || line.match(/^:?[-]+:?$/)) {
      continue;
    }

    // Parse table rows - must start with | and have content
    if (inTable && line.startsWith("|") && line.length > 5) {
      const parts = line.split("|").map(p => p.trim()).filter(Boolean);
      if (parts.length >= 5) {
        // Extract URL from markdown link [Name](URL)
        const namePart = parts[0];
        const urlMatch = namePart.match(/\[([^\]]+)\]\(([^)]+)\)/);
        
        // Clean up auth field - remove backticks
        const auth = parts[2].replace(/`/g, "").trim();
        
        apis.push({
          name: urlMatch ? urlMatch[1] : namePart,
          description: parts[1],
          auth: auth,
          https: parts[3].toLowerCase() === "yes",
          cors: parts[4] || "Unknown",
          category: currentCategory,
          url: urlMatch ? urlMatch[2] : undefined
        });
      }
    }
  }

  return apis;
}

function loadAPIs(): API[] {
  try {
    const content = readFileSync(API_FILE, "utf-8");
    return parseAPIs(content);
  } catch (e) {
    console.error("Error: Could not load API database. Run update command first.");
    process.exit(1);
  }
}

function formatAPI(api: API, index?: number): string {
  const idx = index !== undefined ? `${index + 1}. ` : "";
  const authBadge = api.auth === "No" ? "✓ FREE" : `🔑 ${api.auth}`;
  const httpsBadge = api.https ? "🔒 HTTPS" : "⚠ HTTP";
  const corsBadge = api.cors === "Yes" ? "🌐 CORS" : api.cors === "No" ? "🚫 No CORS" : "";
  
  return `${idx}${api.name}
   ${api.description}
   ${[authBadge, httpsBadge, corsBadge].filter(Boolean).join(" | ")}
   Category: ${api.category}${api.url ? `\n   URL: ${api.url}` : ""}`;
}

function searchAPIs(query: string, apis: API[]): API[] {
  const q = query.toLowerCase();
  return apis.filter(api => 
    api.name.toLowerCase().includes(q) ||
    api.description.toLowerCase().includes(q) ||
    api.category.toLowerCase().includes(q)
  );
}

function getCategories(apis: API[]): string[] {
  return [...new Set(apis.map(api => api.category))].sort();
}

function suggestAPIs(task: string, apis: API[]): API[] {
  const taskLower = task.toLowerCase();
  
  // Keyword mapping for suggestions
  const keywords: Record<string, string[]> = {
    weather: ["weather", "forecast", "temperature", "climate"],
    crypto: ["crypto", "bitcoin", "ethereum", "blockchain", "coin", "token"],
    finance: ["stock", "market", "finance", "trading", "price", "currency", "exchange"],
    email: ["email", "mail", "smtp"],
    phone: ["phone", "sms", "call", "number"],
    map: ["map", "geo", "location", "address", "place", "coordinate"],
    image: ["image", "photo", "picture", "thumbnail", "icon"],
    video: ["video", "stream", "youtube", "vimeo"],
    music: ["music", "song", "audio", "spotify", "sound"],
    news: ["news", "article", "headline", "press"],
    data: ["data", "json", "api", "dataset", "open"],
    ai: ["ai", "ml", "machine learning", "nlp", "gpt", "ai"],
    test: ["test", "fake", "mock", "dummy", "placeholder"],
    health: ["health", "medical", "fitness", "hospital", "drug"],
    food: ["food", "recipe", "restaurant", "meal", "drink"],
    sports: ["sport", "game", "score", "team", "athlete", "fitness"],
    book: ["book", "literature", "novel", "author", "publishing"],
    anime: ["anime", "manga", "japan", "animation"],
    animal: ["animal", "pet", "cat", "dog", "bird", "zoo"],
    shopping: ["shop", "store", "product", "buy", "cart", "ecommerce"],
    social: ["social", "twitter", "facebook", "instagram", "reddit"],
    government: ["government", "gov", "public", "civic", "election"],
    science: ["science", "nasa", "space", "physics", "chemistry", "biology"],
    security: ["security", "auth", "password", "encryption", "malware"]
  };

  let matchedKeywords: string[] = [];
  for (const [key, terms] of Object.entries(keywords)) {
    if (terms.some(term => taskLower.includes(term))) {
      matchedKeywords.push(key);
    }
  }

  if (matchedKeywords.length === 0) {
    // Return random no-auth APIs if no match
    return apis.filter(api => api.auth === "No").slice(0, 10);
  }

  // Score APIs by relevance
  const scored = apis.map(api => {
    let score = 0;
    const apiLower = `${api.name} ${api.description} ${api.category}`.toLowerCase();
    
    for (const kw of matchedKeywords) {
      if (apiLower.includes(kw)) score += 3;
      if (api.category.toLowerCase().includes(kw)) score += 5;
    }
    
    // Boost free APIs
    if (api.auth === "No") score += 2;
    if (api.https) score += 1;
    if (api.cors === "Yes") score += 1;
    
    return { api, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)
    .map(s => s.api);
}

function printHelp() {
  console.log(`
API Vault - Strategic API Discovery Tool

USAGE:
  bun api-vault.ts <command> [options]

COMMANDS:
  search <query>     Search APIs by name, description, or category
  category <name>    List all APIs in a category
  no-auth            List APIs requiring no authentication (fastest to use)
  cors               List APIs with CORS support (browser-ready)
  categories         List all available categories
  suggest <task>     Get API suggestions for a specific task
  random             Get a random API for inspiration
  stats              Show database statistics
  update             Update the API database from GitHub

OPTIONS:
  --limit <n>        Limit results to n items (default: 20)
  --json             Output as JSON

EXAMPLES:
  bun api-vault.ts search weather --limit 10
  bun api-vault.ts category cryptocurrency
  bun api-vault.ts no-auth --limit 30
  bun api-vault.ts suggest "I need real-time crypto prices"
  bun api-vault.ts stats
`);
}

// Main CLI
const args = process.argv.slice(2);
if (args.length === 0 || args[0] === "help" || args[0] === "--help") {
  printHelp();
  process.exit(0);
}

const command = args[0];
const apis = loadAPIs();
const limitIndex = args.indexOf("--limit");
const limit = limitIndex > -1 ? parseInt(args[limitIndex + 1]) || 20 : 20;
const asJson = args.includes("--json");

switch (command) {
  case "search": {
    const query = args.slice(1).filter(a => !a.startsWith("--")).join(" ");
    if (!query) {
      console.error("Error: Please provide a search query");
      process.exit(1);
    }
    const results = searchAPIs(query, apis).slice(0, limit);
    if (asJson) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log(`\nFound ${results.length} APIs matching "${query}":\n`);
      results.forEach((api, i) => console.log(formatAPI(api, i) + "\n"));
    }
    break;
  }

  case "category": {
    const cat = args.slice(1).filter(a => !a.startsWith("--")).join(" ");
    if (!cat) {
      console.error("Error: Please provide a category name");
      process.exit(1);
    }
    const results = apis.filter(api => 
      api.category.toLowerCase().includes(cat.toLowerCase())
    ).slice(0, limit);
    if (asJson) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log(`\nAPIs in "${cat}" category (${results.length}):\n`);
      results.forEach((api, i) => console.log(formatAPI(api, i) + "\n"));
    }
    break;
  }

  case "no-auth": {
    const results = apis.filter(api => api.auth === "No").slice(0, limit);
    if (asJson) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log(`\nAPIs requiring NO authentication (${results.length} shown):\n`);
      results.forEach((api, i) => console.log(formatAPI(api, i) + "\n"));
    }
    break;
  }

  case "cors": {
    const results = apis.filter(api => 
      api.cors === "Yes" && api.https
    ).slice(0, limit);
    if (asJson) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log(`\nBrowser-ready APIs (HTTPS + CORS) (${results.length} shown):\n`);
      results.forEach((api, i) => console.log(formatAPI(api, i) + "\n"));
    }
    break;
  }

  case "categories": {
    const categories = getCategories(apis);
    if (asJson) {
      console.log(JSON.stringify(categories, null, 2));
    } else {
      console.log(`\nAvailable categories (${categories.length}):\n`);
      console.log(categories.map((c, i) => `${(i + 1).toString().padStart(2)}. ${c}`).join("\n"));
    }
    break;
  }

  case "suggest": {
    const task = args.slice(1).filter(a => !a.startsWith("--")).join(" ");
    if (!task) {
      console.error("Error: Please describe your task");
      process.exit(1);
    }
    const results = suggestAPIs(task, apis);
    if (asJson) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log(`\nSuggested APIs for: "${task}"\n`);
      results.forEach((api, i) => console.log(formatAPI(api, i) + "\n"));
    }
    break;
  }

  case "random": {
    const noAuth = apis.filter(api => api.auth === "No");
    const random = noAuth[Math.floor(Math.random() * noAuth.length)];
    if (asJson) {
      console.log(JSON.stringify(random, null, 2));
    } else {
      console.log("\n🎲 Random API (no auth required):\n");
      console.log(formatAPI(random) + "\n");
    }
    break;
  }

  case "stats": {
    const categories = getCategories(apis);
    const noAuth = apis.filter(api => api.auth === "No").length;
    const withHttps = apis.filter(api => api.https).length;
    const withCors = apis.filter(api => api.cors === "Yes").length;
    
    console.log(`
API Vault Statistics
====================

Total APIs:        ${apis.length}
Categories:        ${categories.length}
No Auth Required:  ${noAuth} (${((noAuth/apis.length)*100).toFixed(1)}%)
HTTPS Support:     ${withHttps} (${((withHttps/apis.length)*100).toFixed(1)}%)
CORS Support:      ${withCors} (${((withCors/apis.length)*100).toFixed(1)}%)

Top Categories by API Count:
`);
    
    const catCounts = categories.map(c => ({
      name: c,
      count: apis.filter(a => a.category === c).length
    })).sort((a, b) => b.count - a.count).slice(0, 10);
    
    catCounts.forEach((c, i) => {
      console.log(`  ${(i + 1)}. ${c.name}: ${c.count} APIs`);
    });
    break;
  }

  case "update": {
    console.log("Updating API database from GitHub...");
    const { execSync } = require("child_process");
    try {
      execSync(`curl -fsSL https://raw.githubusercontent.com/public-apis/public-apis/master/README.md -o ${API_FILE}`, { stdio: "inherit" });
      console.log("\n✓ Database updated successfully!");
      console.log(`  Total APIs: ${loadAPIs().length}`);
    } catch (e) {
      console.error("Failed to update database");
      process.exit(1);
    }
    break;
  }

  default:
    console.error(`Unknown command: ${command}`);
    console.log("Run 'bun api-vault.ts help' for usage information");
    process.exit(1);
}
