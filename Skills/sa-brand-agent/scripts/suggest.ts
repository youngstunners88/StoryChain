#!/usr/bin/env bun
import { parseArgs } from "util";

const SUGGESTIONS: Record<string, string[]> = {
  loading: ["Just now, just now...", "Hold on, we're sorting this out..."],
  success: ["Shap!", "Lekker!", "Yebo!"],
  error: ["Eish, something went wrong", "Haibo! That didn't work"],
  hello: ["Howzit", "Hello there"],
  goodbye: ["Totsiens", "Stay well", "Hamba kahle"],
  thanks: ["Enkosi", "Dankie", "Siyabonga"],
  order_placed: ["Shap! Order placed successfully", "Lekker! Your order is in"],
  on_the_way: ["Your order is on the way!", "Driver's coming just now"],
  arrived: ["Your order is here!", "Food's arrived, enjoy!"],
  payment: ["Payment confirmed, lekker!", "Yebo, payment received"],
};

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    term: { type: "string", short: "t" },
    help: { type: "boolean", short: "h" },
  },
  strict: false,
});

if (values.help || !values.term) {
  console.log(`
SA Brand Agent - Get South African alternatives

Usage:
  bun suggest.ts --term loading
  bun suggest.ts --term success
`);
  process.exit(0);
}

const term = (values.term as string).toLowerCase().replace(/[^a-z_]/g, "");
const suggestions = SUGGESTIONS[term];

console.log(`\n=== SA Alternatives for "${term}" ===\n`);

if (suggestions) {
  suggestions.forEach((s) => console.log(`  💬 "${s}"`));
} else {
  console.log("  No specific suggestions found.");
  console.log("\n  Common SA phrases:");
  console.log('  • "Just now" = soon');
  console.log('  • "Now now" = very soon');
  console.log('  • "Lekker" = nice/great');
  console.log('  • "Shap" = okay/good');
  console.log('  • "Yebo" = yes');
  console.log('  • "Eish" = expression of surprise');
}

console.log("");
