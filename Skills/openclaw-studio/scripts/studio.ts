#!/usr/bin/env bun

/**
 * OpenClaw Studio Helper Script
 * 
 * Usage:
 *   bun openclaw-studio.ts start     - Start the studio
 *   bun openclaw-studio.ts status    - Check if running
 *   bun openclaw-studio.ts config    - Show configuration
 */

const STUDIO_PATH = "/home/workspace/Projects/openclaw-studio";
const DEFAULT_PORT = 3000;

const args = process.argv.slice(2);
const command = args[0] || "help";

switch (command) {
  case "start":
    console.log(`Starting OpenClaw Studio...`);
    console.log(`Path: ${STUDIO_PATH}`);
    console.log(`URL: http://localhost:${DEFAULT_PORT}`);
    console.log(`\nRun manually:`);
    console.log(`  cd ${STUDIO_PATH} && npm run dev`);
    break;

  case "status":
    console.log(`OpenClaw Studio Status:`);
    console.log(`  Installed at: ${STUDIO_PATH}`);
    console.log(`  Default port: ${DEFAULT_PORT}`);
    // Check if running
    const { execSync } = require("child_process");
    try {
      const result = execSync("lsof -i :3000 2>/dev/null | grep LISTEN || true").toString();
      if (result.includes("node")) {
        console.log(`  Status: RUNNING`);
      } else {
        console.log(`  Status: NOT RUNNING`);
      }
    } catch {
      console.log(`  Status: NOT RUNNING`);
    }
    break;

  case "config":
    console.log(`OpenClaw Studio Configuration:`);
    console.log(`  Config path: ~/.openclaw/openclaw-studio/settings.json`);
    console.log(`  Default gateway: ws://localhost:18789`);
    console.log(`  Environment variables:`);
    console.log(`    NEXT_PUBLIC_GATEWAY_URL - Override gateway URL`);
    console.log(`    STUDIO_ACCESS_TOKEN - Auth token for public hosts`);
    break;

  case "help":
  default:
    console.log(`OpenClaw Studio Helper`);
    console.log(``);
    console.log(`Commands:`);
    console.log(`  start   - Show how to start the studio`);
    console.log(`  status  - Check if studio is running`);
    console.log(`  config  - Show configuration info`);
    console.log(`  help    - Show this help`);
    break;
}
