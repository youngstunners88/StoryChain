#!/usr/bin/env bun
/**
 * Marketing Ad Generator
 * Generates multiple ad variations from a product brief
 * 
 * Usage:
 *   bun ad-generator.ts --product "iHhashi" --type "food_delivery" --tone "friendly"
 *   bun ad-generator.ts --help
 */

interface AdBrief {
  product: string;
  type: string;
  audience?: string;
  tone?: string;
  length?: "short" | "medium" | "long";
  channel?: string;
  insight?: string;
  cta?: string;
}

const TEMPLATES = {
  food_delivery: {
    hooks: [
      "Hungry? Your favourite restaurant misses you.",
      "Same old lunch again?",
      "Your cravings don't wait for traffic.",
    ],
    insights: [
      "Life's too short for boring meals.",
      "Great food should come to you, not the other way around.",
    ],
    ctas: [
      "Order now on {product}",
      "Download {product} today",
      "Tap. Order. Eat.",
    ],
  },
  groceries: {
    hooks: [
      "Fridge looking sad?",
      "Out of milk. Again.",
      "The queue is not your vibe.",
    ],
    insights: [
      "Grocery runs shouldn't feel like a workout.",
      "Everything you need, without the trolley wars.",
    ],
    ctas: [
      "Shop smart with {product}",
      "Get groceries in 30 mins",
      "Skip the queue with {product}",
    ],
  },
  fresh_produce: {
    hooks: [
      "Fresh fruit shouldn't cost a fortune.",
      "Your veggies travelled further than you did.",
      "Farm fresh, without the farm trip.",
    ],
    insights: [
      "The best produce doesn't sit in storage.",
      "From farm to table, minus the middlemen.",
    ],
    ctas: [
      "Get fresh with {product}",
      "Order farm-fresh today",
      "Taste the difference with {product}",
    ],
  },
  courier: {
    hooks: [
      "Need it there? Like, now?",
      "Your package deserves better than 'sometime next week'.",
      "Running errands is so 2023.",
    ],
    insights: [
      "Sometimes you need things to move fast.",
      "Personal courier shouldn't mean personal headache.",
    ],
    ctas: [
      "Send it with {product}",
      "Book a runner on {product}",
      "Move things with {product}",
    ],
  },
};

function generateAds(brief: AdBrief): string[] {
  const templates = TEMPLATES[brief.type as keyof typeof TEMPLATES] || TEMPLATES.food_delivery;
  const product = brief.product;
  const tone = brief.tone || "friendly";
  
  const ads: string[] = [];
  
  // Generate 3 variations
  for (let i = 0; i < 3; i++) {
    const hook = templates.hooks[i % templates.hooks.length];
    const insight = templates.insights[i % templates.insights.length];
    const cta = templates.ctas[i % templates.ctas.length].replace("{product}", product);
    
    let ad = `${hook}\n\n${insight}\n\n${cta}`;
    
    if (tone === "playful") {
      ad = ad.replace(/\./g, "!").toLowerCase();
    }
    
    ads.push(ad);
  }
  
  return ads;
}

function printHelp() {
  console.log(`
Marketing Ad Generator

Generates multiple ad variations from a product brief.

Usage:
  bun ad-generator.ts --product <name> --type <category> [options]

Options:
  --product     Product/brand name (required)
  --type        Category: food_delivery, groceries, fresh_produce, courier (required)
  --audience    Target audience description
  --tone        Tone: friendly, professional, playful (default: friendly)
  --length      Ad length: short, medium, long (default: short)
  --channel     Platform: social, radio, print, video
  --insight     Custom insight/angle
  --cta         Custom call-to-action
  --help        Show this help message

Example:
  bun ad-generator.ts --product "iHhashi" --type "food_delivery" --tone "friendly"
`);
}

// Parse command line args
const args = process.argv.slice(2);
const brief: AdBrief = { product: "", type: "" };

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--help") {
    printHelp();
    process.exit(0);
  }
  if (args[i].startsWith("--")) {
    const key = args[i].slice(2) as keyof AdBrief;
    brief[key] = args[i + 1] as any;
    i++;
  }
}

if (!brief.product || !brief.type) {
  console.log("Error: --product and --type are required\n");
  printHelp();
  process.exit(1);
}

const ads = generateAds(brief);
console.log("\n=== Generated Ads ===\n");
ads.forEach((ad, i) => {
  console.log(`--- Variation ${i + 1} ---`);
  console.log(ad);
  console.log("");
});
