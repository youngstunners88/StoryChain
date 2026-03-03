#!/usr/bin/env bun
import { parseArgs } from "util";

const SLANG: Record<string, string> = {
  "south africa": "Mzansi",
  loading: "Just now, just now...",
  hello: "Howzit",
  yes: "Yebo",
  great: "Lekker",
  nice: "Lekker",
  okay: "Shap",
  ok: "Shap",
  thanks: "Enkosi / Dankie",
  friend: "Boet / Sisi",
  brother: "Boet",
  sister: "Sisi",
  traffic_light: "Robot",
  pickup_truck: "Bakkie",
  barbecue: "Braai",
  corner_shop: "Spaza",
  guys: "everyone / folks",
  dude: "boet",
  yall: "all of you",
};

const AMERICAN_TO_SA: Record<string, string> = {
  color: "colour",
  favorite: "favourite",
  organize: "organise",
  organization: "organisation",
  center: "centre",
  meter: "metre",
  liter: "litre",
  analyze: "analyse",
  realize: "realise",
  recognize: "recognise",
  optimize: "optimise",
  maximize: "maximise",
  minimize: "minimise",
};

const PROHIBITED = ["y'all", "dude", "guys", "$", "USD", "dollars", "miles", "fahrenheit"];

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    content: { type: "string", short: "c" },
    file: { type: "string", short: "f" },
    help: { type: "boolean", short: "h" },
  },
  strict: false,
});

if (values.help || !values.content) {
  console.log(`
SA Brand Agent - Check content for South African style

Usage:
  bun check.ts --content "Hello guys, loading your order"
  bun check.ts --file "path/to/file.tsx"
`);
  process.exit(0);
}

const content = values.content as string;
const issues: string[] = [];
const suggestions: string[] = [];

// Check for prohibited terms
PROHIBITED.forEach((term) => {
  if (content.toLowerCase().includes(term)) {
    issues.push(`❌ Prohibited term: "${term}"`);
  }
});

// Check for American spelling
Object.entries(AMERICAN_TO_SA).forEach(([us, sa]) => {
  const regex = new RegExp(`\\b${us}\\b`, "gi");
  if (regex.test(content)) {
    suggestions.push(`💡 Use "${sa}" instead of "${us}"`);
  }
});

// Check for slang opportunities
Object.entries(SLANG).forEach(([eng, sa]) => {
  const regex = new RegExp(`\\b${eng}\\b`, "gi");
  if (regex.test(content)) {
    suggestions.push(`💬 Consider: "${sa}" for "${eng}"`);
  }
});

// Check for dollar sign
if (content.includes("$")) {
  issues.push('❌ Use "R" for Rand, not "$"');
}

// Check for USD
if (content.toLowerCase().includes("usd")) {
  issues.push('❌ Use "R" for Rand, not "USD"');
}

console.log("\n=== SA Brand Check ===\n");
console.log(`Content: "${content.slice(0, 100)}${content.length > 100 ? "..." : ""}"\n`);

if (issues.length === 0 && suggestions.length === 0) {
  console.log("✅ Content passes SA style check!");
} else {
  if (issues.length > 0) {
    console.log("Issues:");
    issues.forEach((i) => console.log(`  ${i}`));
  }
  if (suggestions.length > 0) {
    console.log("\nSuggestions:");
    suggestions.forEach((s) => console.log(`  ${s}`));
  }
}

console.log("");
