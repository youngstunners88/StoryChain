#!/usr/bin/env bun
/**
 * MOSTA - Generate branded marketing images for iHhashi
 * 
 * Usage:
 *   bun generate-branded-image.ts --type "instagram" --concept "delivery-speed" --message "Fast delivery!"
 *   bun generate-branded-image.ts --help
 */

import { parseArgs } from "util";
import fs from "fs";
import path from "path";

const LOGO_PATH = "/home/workspace/marketing/ihhashi-assets/ihhashi-logo-official.png";
const OUTPUT_DIR = "/home/workspace/marketing/ihhashi-creatives";

// Image dimension presets
const DIMENSIONS: Record<string, { width: number; height: number; description: string }> = {
  "instagram-post": { width: 1080, height: 1080, description: "Square Instagram post" },
  "instagram-story": { width: 1080, height: 1920, description: "Vertical Instagram story" },
  "twitter-post": { width: 1600, height: 900, description: "Twitter/X landscape post" },
  "linkedin-post": { width: 1200, height: 627, description: "LinkedIn post" },
  "facebook-post": { width: 1200, height: 630, description: "Facebook post" },
  "web-banner": { width: 1200, height: 628, description: "Web promotional banner" },
  "app-screenshot": { width: 1080, height: 1920, description: "App store screenshot" },
};

// Logo placement strategies
const PLACEMENTS: Record<string, string> = {
  "corner-br": "Bottom-right corner with subtle shadow",
  "corner-tl": "Top-left corner, prominent",
  "hero": "Centered as main visual element",
  "split-left": "Left side of split composition",
  "watermark": "Subtle watermark overlay",
  "badge": "Badge style with glow effect",
};

// Creative concepts
const CONCEPTS: Record<string, { prompt: string; tagline: string }> = {
  "speed-demon": {
    prompt: "Motion blur effects, yellow streak across the image, the horse at full gallop with wind effects, dynamic energy, urban backdrop",
    tagline: "Fast. Friendly. iHhashi.",
  },
  "friendly-runner": {
    prompt: "The grinning horse carrying delivery items (pizza, groceries, packages), cheerful and approachable, warm community vibe",
    tagline: "Service with a smile",
  },
  "township-pride": {
    prompt: "Split image showing township scene transitioning to delivered items, the horse bridging both worlds, local South African context",
    tagline: "Your neighbourhood, delivered",
  },
  "all-weather": {
    prompt: "Horse powering through different weather conditions (rain, sun, wind), determined expression, reliability theme",
    tagline: "Rain or shine, we're on time",
  },
  "local-legend": {
    prompt: "Horse alongside recognizable South African landmarks, community pride, local hero energy, diverse backgrounds",
    tagline: "Your local delivery hero",
  },
  "fresh-delivery": {
    prompt: "Fresh produce and groceries around the horse, vibrant colors, healthy eating theme, farm-to-table freshness",
    tagline: "Fresh to your door",
  },
  "night-rider": {
    prompt: "Evening delivery scene, city lights, the horse illuminated, late-night delivery service, urban nightlife",
    tagline: "We deliver when others don't",
  },
  "celebration": {
    prompt: "Festive atmosphere, the horse celebrating with confetti or sparkles, special occasion delivery, party vibes",
    tagline: "Every moment, delivered",
  },
};

function generateImagePrompt(
  imageType: string,
  concept: string,
  message: string,
  placement: string,
  includeLogo: boolean
): string {
  const dims = DIMENSIONS[imageType] || DIMENSIONS["instagram-post"];
  const conceptData = CONCEPTS[concept] || CONCEPTS["friendly-runner"];
  const placementDesc = PLACEMENTS[placement] || PLACEMENTS["corner-br"];

  let prompt = `Create a ${dims.width}x${dims.height} marketing image for iHhashi delivery service.

CONCEPT: ${conceptData.prompt}

MAIN MESSAGE: "${message}"
TAGLINE: "${conceptData.tagline}"

BRAND REQUIREMENTS:
- Primary color: Bright yellow (#FFD600) as accent or background
- The image should feel energetic, friendly, and local
- South African context and vibes
- Mobile-first design (clear text, bold visuals)
`;

  if (includeLogo) {
    prompt += `
LOGO INTEGRATION:
- Place the iHhashi logo using the "${placement}" strategy: ${placementDesc}
- The logo features a black rearing horse with white eye and grin on yellow background
- Ensure the logo is clearly visible and maintains brand integrity
- Add subtle shadow or glow if needed for visibility
`;
  }

  prompt += `
STYLE: Bold, modern, energetic, friendly
TARGET: South African audience, mobile users, young professionals and families
FORMAT: High quality, suitable for social media`;

  return prompt;
}

function listOptions(): void {
  console.log("\n📋 MOSTA - iHhashi Marketing Image Generator\n");
  
  console.log("🖼️  IMAGE TYPES:");
  for (const [key, val] of Object.entries(DIMENSIONS)) {
    console.log(`   ${key.padEnd(20)} ${val.width}x${val.height} - ${val.description}`);
  }
  
  console.log("\n🎨 CONCEPTS:");
  for (const [key, val] of Object.entries(CONCEPTS)) {
    console.log(`   ${key.padEnd(20)} ${val.tagline}`);
  }
  
  console.log("\n📍 LOGO PLACEMENTS:");
  for (const [key, val] of Object.entries(PLACEMENTS)) {
    console.log(`   ${key.padEnd(20)} ${val}`);
  }
  
  console.log("\n📁 OUTPUT:");
  console.log(`   Directory: ${OUTPUT_DIR}`);
  console.log(`   Logo source: ${LOGO_PATH}`);
  console.log("");
}

async function main() {
  const { values } = parseArgs({
    options: {
      type: { type: "string", short: "t", default: "instagram-post" },
      concept: { type: "string", short: "c", default: "friendly-runner" },
      message: { type: "string", short: "m", default: "Order now!" },
      placement: { type: "string", short: "p", default: "corner-br" },
      "no-logo": { type: "boolean", default: false },
      output: { type: "string", short: "o" },
      list: { type: "boolean", short: "l" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });

  if (values.help) {
    console.log(`
MOSTA - iHhashi Marketing Image Generator

USAGE:
  bun generate-branded-image.ts [OPTIONS]

OPTIONS:
  -t, --type <type>       Image type (default: instagram-post)
  -c, --concept <concept> Creative concept (default: friendly-runner)
  -m, --message <msg>     Main message text
  -p, --placement <pos>   Logo placement strategy (default: corner-br)
  -o, --output <file>     Output filename
  --no-logo               Generate without logo integration
  -l, --list              List all available options
  -h, --help              Show this help

EXAMPLES:
  bun generate-branded-image.ts -t instagram-story -c speed-demon -m "50% off first order!"
  bun generate-branded-image.ts -t twitter-post -c township-pride -p hero
`);
    process.exit(0);
  }

  if (values.list) {
    listOptions();
    process.exit(0);
  }

  // Check logo exists
  if (!fs.existsSync(LOGO_PATH)) {
    console.error(`❌ Logo not found at: ${LOGO_PATH}`);
    console.log("   Please ensure the official logo is in place.");
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created output directory: ${OUTPUT_DIR}`);
  }

  // Generate the prompt
  const prompt = generateImagePrompt(
    values.type!,
    values.concept!,
    values.message!,
    values.placement!,
    !values["no-logo"]
  );

  // Generate output filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outputFile = values.output || `${values.concept}-${values.type}-${timestamp}.txt`;
  const outputPath = path.join(OUTPUT_DIR, path.basename(outputFile).replace(/\.[^.]+$/, ".txt"));

  // Save the prompt
  fs.writeFileSync(outputPath, prompt);

  console.log("\n✅ MOSTA Generated Marketing Brief:\n");
  console.log(`📄 Type: ${values.type}`);
  console.log(`🎨 Concept: ${values.concept}`);
  console.log(`📍 Placement: ${values.placement}`);
  console.log(`💬 Message: "${values.message}"`);
  console.log(`\n📁 Prompt saved to: ${outputPath}\n`);
  
  console.log("─".repeat(60));
  console.log("GENERATED PROMPT:");
  console.log("─".repeat(60));
  console.log(prompt);
  console.log("─".repeat(60));
  console.log("\n💡 Use this prompt with an image generation tool to create the visual.");
  console.log("   Or ask Zo to generate the image using: generate_image tool\n");
}

main();
