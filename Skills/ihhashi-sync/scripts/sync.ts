#!/usr/bin/env bun

/**
 * iHhashi Agent Synchronizer
 * Updates all iHhashi-related agents with the latest app information
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";

const IHHASHI_DIR = "/home/workspace/iHhashi";
const MOSTA_DIR = "/home/workspace/mosta-agent";
const KNOWLEDGE_BASE_PATH = join(MOSTA_DIR, "knowledge-base.json");
const MARKETING_PROMPTS_PATH = join(MOSTA_DIR, "prompts", "marketing-prompts.md");

interface KnowledgeBase {
  brand: any;
  logo: any;
  IMPORTANT: any;
  services: any;
  user_types: any;
  features: any;
  south_africa: any;
  tech_stack: any;
  content_guidelines: any;
  [key: string]: any;
}

function log(message: string) {
  console.log(`[SYNC] ${message}`);
}

function readAgentsMd(): string {
  const path = join(IHHASHI_DIR, "AGENTS.md");
  if (existsSync(path)) {
    return readFileSync(path, "utf-8");
  }
  return "";
}

function extractVersion(agentsMd: string): string {
  const match = agentsMd.match(/Version:\s*([\d.]+)/i);
  return match ? match[1] : "0.3.0";
}

function extractFeatures(agentsMd: string): string[] {
  const features: string[] = [];
  
  // Extract from FEATURES IMPLEMENTED sections
  const featureMatches = agentsMd.matchAll(/###\s+(.+?)(?:\n|$)/g);
  for (const match of featureMatches) {
    const feature = match[1].trim();
    if (!feature.includes("IMPLEMENTED") && !feature.includes("INFRASTRUCTURE")) {
      features.push(feature);
    }
  }
  
  return features;
}

function extractUserTypes(agentsMd: string): any {
  return {
    customers: {
      description: "People who order food, groceries, or use courier services",
      capabilities: [
        "Browse merchants by category/location",
        "View menus and item details",
        "Place and track orders",
        "Rate merchants and riders"
      ]
    },
    merchants: {
      description: "Restaurants, grocery stores, and vendors who sell on the platform",
      capabilities: [
        "Manage menu and orders",
        "View analytics",
        "Handle promotions"
      ]
    },
    riders: {
      description: "Delivery servicemen who deliver orders to customers",
      capabilities: [
        "Accept delivery requests",
        "Navigate to pickup/delivery",
        "View earnings"
      ],
      transport_options: [
        "Car", "Motorcycle", "Scooter", "Bicycle", "On-foot",
        "Wheelchair", "Running", "Rollerblade"
      ]
    }
  };
}

function extractServices(agentsMd: string): any {
  return {
    food_delivery: {
      description: "Order food from local South African restaurants",
      examples: ["Kota", "Bunny Chow", "Gatsby", "Braai"]
    },
    groceries: {
      description: "Grocery delivery from local stores"
    },
    fresh_produce: {
      description: "Fresh fruits and vegetables delivery"
    },
    courier: {
      description: "Personal courier services for packages and documents"
    }
  };
}

function generateKnowledgeBase(agentsMd: string, existingKnowledge: KnowledgeBase | null): KnowledgeBase {
  const version = extractVersion(agentsMd);
  
  // Start with existing knowledge and update specific fields
  const kb: KnowledgeBase = existingKnowledge ? { ...existingKnowledge } : {} as KnowledgeBase;
  
  // Update version
  if (!kb.brand) kb.brand = {};
  kb.brand.version = version;
  
  // Ensure IMPORTANT section exists
  if (!kb.IMPORTANT) {
    kb.IMPORTANT = {
      clarification: "iHhashi is a DELIVERY platform, NOT a taxi/ride-hailing app. It does NOT transport passengers. It delivers: groceries, food, fruits, vegetables, dairy products, and provides personal courier services.",
      evolution: "iHhashi evolved from Boober (a ride-hailing project), but pivoted on 2026-02-25 to focus on delivery services due to lower regulatory barriers and faster path to revenue in the SA market."
    };
  }
  
  // Update user types
  kb.user_types = extractUserTypes(agentsMd);
  
  // Update services
  kb.services = extractServices(agentsMd);
  
  // Ensure brand info
  if (!kb.brand.name) kb.brand.name = "iHhashi";
  if (!kb.brand.tagline) kb.brand.tagline = "Delivery platform for South Africa - Riders, Merchants, Customers";
  
  return kb;
}

function generateMarketingPrompts(knowledgeBase: KnowledgeBase): string {
  return `# iHhashi Marketing Prompts

## Brand Voice
- Tone: Authentic, culturally-relevant, inclusive
- Primary languages: English, Zulu, Xhosa, Sotho, Afrikaans, Tswana
- Never reference: Taxi, ride-hailing, passenger transport

## Key Messages

### Food Delivery
- "Your favourite restaurant, your couch"
- "From kitchen to door in minutes"
- "Taste the township, delivered"

### Grocery Delivery
- "Fridge restocking in 30 mins"
- "Family grocery run without the run"

### Courier Services
- "Documents across town, no stress"
- "Urgent delivery? We got you"

## South African Context
- Currency: ZAR (R)
- VAT: 15%
- Local foods: Kota, Bunny Chow, Gatsby, Braai
- All 9 provinces supported

## Features to Highlight
- Blue Horse Verification (trust & safety)
- Multi-language support (6 SA languages)
- Inclusive transport options (bicycle, walking, wheelchair)
- 100% tips to riders
- Sunday payouts at 11:11 AM SAST

## Content Guidelines
- Emphasize speed and reliability
- Celebrate local South African culture
- Support local merchants and riders
- Never confuse with taxi/ride-hailing

## Updated: ${new Date().toISOString().split('T')[0]}
## Version: ${knowledgeBase.brand.version}
`;
}

function syncAgents(): void {
  log("Starting iHhashi agent synchronization...");
  
  // Read current state
  const agentsMd = readAgentsMd();
  if (!agentsMd) {
    log("ERROR: Could not read AGENTS.md");
    process.exit(1);
  }
  
  // Read existing knowledge base
  let existingKnowledge: KnowledgeBase | null = null;
  if (existsSync(KNOWLEDGE_BASE_PATH)) {
    try {
      existingKnowledge = JSON.parse(readFileSync(KNOWLEDGE_BASE_PATH, "utf-8"));
      log("Loaded existing knowledge base");
    } catch (e) {
      log("Could not parse existing knowledge base, will create new one");
    }
  }
  
  // Generate updated knowledge base
  const knowledgeBase = generateKnowledgeBase(agentsMd, existingKnowledge);
  
  // Write knowledge base
  writeFileSync(KNOWLEDGE_BASE_PATH, JSON.stringify(knowledgeBase, null, 2));
  log(`Updated knowledge-base.json (version ${knowledgeBase.brand.version})`);
  
  // Generate and write marketing prompts
  const marketingPrompts = generateMarketingPrompts(knowledgeBase);
  
  // Ensure prompts directory exists
  const promptsDir = join(MOSTA_DIR, "prompts");
  if (!existsSync(promptsDir)) {
    const { mkdirSync } = require("fs");
    mkdirSync(promptsDir, { recursive: true });
  }
  
  writeFileSync(MARKETING_PROMPTS_PATH, marketingPrompts);
  log("Updated marketing-prompts.md");
  
  // Summary
  log("\n=== Synchronization Complete ===");
  log(`Version: ${knowledgeBase.brand.version}`);
  log(`Agents updated:`);
  log(`  - Nduna (knowledge-base.json)`);
  log(`  - Marketing OpenClaw (marketing-prompts.md)`);
  log(`\nFeatures synced:`);
  log(`  - Services: ${Object.keys(knowledgeBase.services).join(", ")}`);
  log(`  - User types: ${Object.keys(knowledgeBase.user_types).join(", ")}`);
  log(`  - Languages: ${knowledgeBase.features?.multi_language?.languages?.join(", ") || "6 SA languages"}`);
}

// Run
syncAgents();
