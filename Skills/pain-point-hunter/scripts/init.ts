#!/usr/bin/env bun
/**
 * Initialize the Pain Point Hunter system
 * Creates necessary directories, files, and default configuration
 */

import { mkdir, writeFile, exists } from "fs/promises";
import { join } from "path";

const SKILL_DIR = join(process.env.HOME!, "workspace/Skills/pain-point-hunter");
const DATA_DIR = join(SKILL_DIR, "data");

const DEFAULT_CONFIG = {
  heartbeat: {
    cadenceMinutes: 30,
    workingHours: { start: 8, end: 22 },
    timezone: "Africa/Johannesburg"
  },
  discovery: {
    sources: [
      "google_maps_reviews",
      "reddit_complaints",
      "twitter_mentions",
      "linkedin_posts",
      "industry_forums"
    ],
    keywords: [
      "struggling with",
      "need help with",
      "frustrated by",
      "looking for solution",
      "pain point",
      "challenge",
      "problem",
      "issue",
      "doesn't work",
      "terrible experience"
    ],
    industries: [
      "small business",
      "restaurants",
      "retail",
      "professional services",
      "e-commerce",
      "real estate",
      "healthcare",
      "education"
    ],
    locations: ["South Africa", "Johannesburg", "Cape Town", "Durban", "Pretoria"]
  },
  solutionBuilder: {
    capabilities: [
      "website",
      "automation",
      "integration",
      "dashboard",
      "mobile_app",
      "api"
    ],
    maxBuildTimeMinutes: 60,
    autoDeploy: false
  },
  outreach: {
    channels: ["email", "telegram"],
    templates: "templates/",
    maxDailyOutreach: 20,
    followUpCadence: [3, 7, 14]
  },
  revenue: {
    targetPerDay: 480,
    currency: "ZAR",
    minProjectValue: 2000,
    pricingModel: "value-based"
  }
};

const DEFAULT_LEADS: any[] = [];
const DEFAULT_STATUS = {
  lastHeartbeat: new Date().toISOString(),
  stats: {
    painPointsDiscovered: 0,
    solutionsBuilt: 0,
    outreachSent: 0,
    responsesReceived: 0,
    dealsClosed: 0
  },
  activeWork: {
    building: [],
    outreach: []
  },
  revenue: {
    target: 480,
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  }
};

const DEFAULT_HEARTBEAT_STATE = {
  lastChecks: {
    discovery: 0,
    qualification: 0,
    building: 0,
    outreach: 0,
    reconciliation: 0
  }
};

async function init() {
  console.log("🦁 Initializing Pain Point Hunter...\n");

  // Create data directory
  await mkdir(DATA_DIR, { recursive: true });
  console.log("✓ Created data directory");

  // Check and create config
  const configPath = join(DATA_DIR, "config.json");
  if (!(await exists(configPath))) {
    await writeFile(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
    console.log("✓ Created default config.json");
  } else {
    console.log("✓ config.json already exists");
  }

  // Check and create leads.json
  const leadsPath = join(DATA_DIR, "leads.json");
  if (!(await exists(leadsPath))) {
    await writeFile(leadsPath, JSON.stringify(DEFAULT_LEADS, null, 2));
    console.log("✓ Created empty leads.json");
  } else {
    console.log("✓ leads.json already exists");
  }

  // Check and create status.json
  const statusPath = join(DATA_DIR, "status.json");
  if (!(await exists(statusPath))) {
    await writeFile(statusPath, JSON.stringify(DEFAULT_STATUS, null, 2));
    console.log("✓ Created default status.json");
  } else {
    console.log("✓ status.json already exists");
  }

  // Check and create heartbeat-state.json
  const heartbeatPath = join(DATA_DIR, "heartbeat-state.json");
  if (!(await exists(heartbeatPath))) {
    await writeFile(heartbeatPath, JSON.stringify(DEFAULT_HEARTBEAT_STATE, null, 2));
    console.log("✓ Created default heartbeat-state.json");
  } else {
    console.log("✓ heartbeat-state.json already exists");
  }

  // Create heartbeat.md
  const heartbeatMd = `# HEARTBEAT.md

## Rotating Heartbeat System

Read \`heartbeat-state.json\`. Run whichever check is most overdue.

**Cadences:**
- Discovery: every 30 min (8 AM - 10 PM)
- Qualification: every 1 hour (8 AM - 10 PM)
- Building: every 2 hours (anytime)
- Outreach: every 3 hours (9 AM - 6 PM)
- Reconciliation: every 6 hours (anytime)

**Process:**
1. Load timestamps from heartbeat-state.json
2. Calculate which check is most overdue
3. Run that check via spawned agent
4. Update timestamp
5. Report if actionable, otherwise HEARTBEAT_OK
`;
  const heartbeatMdPath = join(DATA_DIR, "heartbeat.md");
  if (!(await exists(heartbeatMdPath))) {
    await writeFile(heartbeatMdPath, heartbeatMd);
    console.log("✓ Created heartbeat.md");
  } else {
    console.log("✓ heartbeat.md already exists");
  }

  console.log("\n✅ Pain Point Hunter initialized successfully!");
  console.log("\nNext steps:");
  console.log("  1. Edit data/config.json to customize targets");
  console.log("  2. Run: bun scripts/hunt.ts --mode discover --target 'small businesses'");
  console.log("  3. Or start autonomous mode: bun scripts/heartbeat.ts");
}

init().catch(console.error);
