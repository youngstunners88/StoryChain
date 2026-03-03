#!/usr/bin/env bun
import { $ } from "bun";

console.log("\n=== agenticSeek Status Check ===\n");

// Check if agenticSeek is installed
const agenticSeekDir = "/home/workspace/agenticSeek";
const agenticSeekExists = await Bun.file(agenticSeekDir).exists();

if (!agenticSeekExists) {
  console.log("❌ agenticSeek not installed");
  console.log("\nTo install:");
  console.log("  cd /home/workspace && git clone https://github.com/Fosowl/agenticSeek.git");
  process.exit(0);
}

console.log("✅ agenticSeek directory exists");

// Check .env
const envFile = `${agenticSeekDir}/.env`;
const envExists = await Bun.file(envFile).exists();
console.log(envExists ? "✅ .env file configured" : "⚠️  .env not found (copy from .env.example)");

// Check Docker
try {
  const dockerVersion = await $`docker --version`.quiet();
  console.log(`✅ Docker: ${dockerVersion.stdout.toString().trim()}`);
} catch {
  console.log("❌ Docker not available");
}

// Check Docker Compose
try {
  const composeVersion = await $`docker compose version`.quiet();
  console.log(`✅ Docker Compose: ${composeVersion.stdout.toString().trim()}`);
} catch {
  console.log("❌ Docker Compose not available");
}

// Check if services are running
try {
  const ps = await $`docker ps --filter name=agenticseek --format {{.Names}}`.quiet();
  const running = ps.stdout.toString().trim();
  if (running) {
    console.log(`✅ Running containers: ${running.replace(/\n/g, ", ")}`);
  } else {
    console.log("⚠️  No agenticSeek containers running");
    console.log("\n  To start: cd /home/workspace/agenticSeek && ./start_services.sh full");
  }
} catch {
  console.log("⚠️  Could not check running containers");
}

console.log("\n=== Integration Ready ===");
console.log("\nUsage:");
console.log("  cd /home/workspace/agenticSeek && ./start_services.sh full");
console.log("  Then open: http://localhost:3000");
