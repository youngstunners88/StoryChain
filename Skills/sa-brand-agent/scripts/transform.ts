#!/usr/bin/env bun
import { parseArgs } from "util";

const SLANG: Record<string, string> = {
  loading: "Just now, just now...",
  hello: "Howzit",
  yes: "Yebo",
  great: "Lekker",
  nice: "Lekker",
  okay: "Shap",
  ok: "Shap",
  thanks: "Enkosi",
  "thank you": "Enkosi",
  friend: "boet",
  brother: "boet",
  sister: "sisi",
  guys: "everyone",
  dude: "boet",
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

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    input: { type: "string", short: "i" },
    help: { type: "boolean", short: "h" },
  },
  strict: false,
});

if (values.help || !values.input) {
  console.log(`
SA Brand Agent - Transform text to South African style

Usage:
  bun transform.ts --input "Hello guys, loading your order"
`);
  process.exit(0);
}

let text = values.input as string;

// Replace American spelling
Object.entries(AMERICAN_TO_SA).forEach(([us, sa]) => {
  const regex = new RegExp(`\\b${us}\\b`, "gi");
  text = text.replace(regex, sa);
});

// Replace common terms with SA slang
Object.entries(SLANG).forEach(([eng, sa]) => {
  const regex = new RegExp(`\\b${eng}\\b`, "gi");
  text = text.replace(regex, sa);
});

// Replace $ with R
text = text.replace(/\$/g, "R");

// Replace USD with R
text = text.replace(/USD/gi, "R");

console.log(`\nOriginal: ${values.input}`);
console.log(`SA Style: ${text}\n`);
