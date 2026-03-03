#!/usr/bin/env bun
/**
 * Pain Point Hunter - Rotating Heartbeat System
 * Runs continuously, spawning agents based on cadence
 */

import { readFile, writeFile } from "fs/promises";
import { join } from "path";

const SKILL_DIR = join(process.env.HOME!, "workspace/Skills/pain-point-hunter");
const DATA_DIR = join(SKILL_DIR, "data");

interface HeartbeatState {
  lastChecks: {
    discovery: number;
    qualification: number;
    building: number;
    outreach: number;
    reconciliation: number;
  };
}

interface Config {
  heartbeat: {
    cadenceMinutes: number;
    workingHours: { start: number; end: number };
    timezone: string;
  };
}

interface Status {
  lastHeartbeat: string;
  stats: {
    painPointsDiscovered: number;
    solutionsBuilt: number;
    outreachSent: number;
    responsesReceived: number;
    dealsClosed: number;
  };
  activeWork: {
    building: string[];
    outreach: string[];
  };
  revenue: {
    target: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

// Cadence in milliseconds
const CADENCES = {
  discovery: 30 * 60 * 1000,      // 30 minutes
  qualification: 60 * 60 * 1000,  // 1 hour
  building: 2 * 60 * 60 * 1000,   // 2 hours
  outreach: 3 * 60 * 60 * 1000,   // 3 hours
  reconciliation: 6 * 60 * 60 * 1000 // 6 hours
};

// Time windows (hours in SAST)
const TIME_WINDOWS = {
  discovery: { start: 8, end: 22 },
  qualification: { start: 8, end: 22 },
  building: { start: 0, end: 24 },
  outreach: { start: 9, end: 18 },
  reconciliation: { start: 0, end: 24 }
};

function getCurrentHourSAST(): number {
  const now = new Date();
  // SAST is UTC+2
  return (now.getUTCHours() + 2) % 24;
}

function isInTimeWindow(check: keyof typeof TIME_WINDOWS): boolean {
  const hour = getCurrentHourSAST();
  const window = TIME_WINDOWS[check];
  return hour >= window.start && hour < window.end;
}

function getMostOverdueCheck(state: HeartbeatState): keyof typeof CADENCES | null {
  const now = Date.now();
  let mostOverdue: keyof typeof CADENCES | null = null;
  let maxOverdueMs = 0;

  for (const check of Object.keys(CADENCES) as (keyof typeof CADENCES)[]) {
    // Skip if outside time window
    if (!isInTimeWindow(check)) continue;

    const lastRun = state.lastChecks[check] || 0;
    const cadence = CADENCES[check];
    const overdueMs = now - lastRun - cadence;

    if (overdueMs > maxOverdueMs) {
      maxOverdueMs = overdueMs;
      mostOverdue = check;
    }
  }

  return mostOverdue;
}

async function runCheck(check: keyof typeof CADENCES): Promise<string> {
  console.log(`\n🔍 Running ${check} check...`);

  const timestamp = new Date().toISOString();

  switch (check) {
    case "discovery":
      return await runDiscoveryCheck();
    case "qualification":
      return await runQualificationCheck();
    case "building":
      return await runBuildingCheck();
    case "outreach":
      return await runOutreachCheck();
    case "reconciliation":
      return await runReconciliationCheck();
    default:
      return "HEARTBEAT_OK";
  }
}

async function runDiscoveryCheck(): Promise<string> {
  // This would spawn a researcher agent via /zo/ask API
  // For now, return a placeholder
  console.log("  → Would spawn researcher agent to find pain points");

  // Simulate spawning a researcher
  const prompt = `You are a researcher agent. Find pain points for potential clients.

Target markets: small businesses, restaurants, retail in South Africa

Search for:
- Businesses expressing frustration on Google Maps reviews
- Reddit posts about business challenges
- Twitter/X mentions of problems
- LinkedIn posts about difficulties

Return findings as JSON with: painPoint, affectedBusiness, urgency, solutionHint, source`;

  console.log("  → Researcher prompt prepared (would spawn via /zo/ask)");
  console.log(`  → Prompt length: ${prompt.length} chars`);

  return "DISCOVERY_PENDING - Researcher would be spawned";
}

async function runQualificationCheck(): Promise<string> {
  console.log("  → Would qualify and score discovered leads");

  // Read leads.json and score them
  try {
    const leadsPath = join(DATA_DIR, "leads.json");
    const leads = JSON.parse(await readFile(leadsPath, "utf-8"));

    if (leads.length === 0) {
      return "HEARTBEAT_OK - No leads to qualify";
    }

    console.log(`  → Found ${leads.length} leads to process`);
    return `QUALIFICATION_PENDING - ${leads.length} leads found`;
  } catch {
    return "HEARTBEAT_OK - No leads file yet";
  }
}

async function runBuildingCheck(): Promise<string> {
  console.log("  → Would build solutions for qualified leads");

  // Check for high-priority leads that need solutions
  try {
    const statusPath = join(DATA_DIR, "status.json");
    const status: Status = JSON.parse(await readFile(statusPath, "utf-8"));

    if (status.activeWork.building.length === 0) {
      return "HEARTBEAT_OK - No solutions to build";
    }

    console.log(`  → ${status.activeWork.building.length} solutions in progress`);
    return `BUILDING_PENDING - ${status.activeWork.building.length} in queue`;
  } catch {
    return "HEARTBEAT_OK - No status file yet";
  }
}

async function runOutreachCheck(): Promise<string> {
  console.log("  → Would send outreach to leads with solutions");

  try {
    const statusPath = join(DATA_DIR, "status.json");
    const status: Status = JSON.parse(await readFile(statusPath, "utf-8"));

    if (status.activeWork.outreach.length === 0) {
      return "HEARTBEAT_OK - No outreach pending";
    }

    console.log(`  → ${status.activeWork.outreach.length} outreach tasks pending`);
    return `OUTREACH_PENDING - ${status.activeWork.outreach.length} to contact`;
  } catch {
    return "HEARTBEAT_OK - No status file yet";
  }
}

async function runReconciliationCheck(): Promise<string> {
  console.log("  → Reconciling state and generating report");

  try {
    const statusPath = join(DATA_DIR, "status.json");
    const status: Status = JSON.parse(await readFile(statusPath, "utf-8"));

    // Update lastHeartbeat
    status.lastHeartbeat = new Date().toISOString();

    await writeFile(statusPath, JSON.stringify(status, null, 2));
    console.log("  → Status updated");

    // Generate brief report
    const report = `
📊 Pain Point Hunter Status
   Pain points discovered: ${status.stats.painPointsDiscovered}
   Solutions built: ${status.stats.solutionsBuilt}
   Outreach sent: ${status.stats.outreachSent}
   Responses: ${status.stats.responsesReceived}
   Deals closed: ${status.stats.dealsClosed}
   Revenue today: R${status.revenue.today} / R${status.revenue.target}
`;

    console.log(report);
    return "RECONCILIATION_COMPLETE";
  } catch {
    return "HEARTBEAT_OK - No status file yet";
  }
}

async function main() {
  console.log("🦁 Pain Point Hunter - Heartbeat Starting");
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log(`   SAST Hour: ${getCurrentHourSAST()}:00\n`);

  // Load state
  let state: HeartbeatState;
  try {
    const statePath = join(DATA_DIR, "heartbeat-state.json");
    state = JSON.parse(await readFile(statePath, "utf-8"));
  } catch {
    console.log("⚠ No heartbeat state found, initializing...");
    state = {
      lastChecks: {
        discovery: 0,
        qualification: 0,
        building: 0,
        outreach: 0,
        reconciliation: 0
      }
    };
  }

  // Find most overdue check
  const check = getMostOverdueCheck(state);

  if (!check) {
    console.log("✓ All checks are within cadence or outside time windows");
    console.log("  HEARTBEAT_OK");
    return;
  }

  console.log(`📌 Running overdue check: ${check}`);

  // Run the check
  const result = await runCheck(check);

  // Update state
  state.lastChecks[check] = Date.now();

  const statePath = join(DATA_DIR, "heartbeat-state.json");
  await writeFile(statePath, JSON.stringify(state, null, 2));

  console.log(`\n✓ Check complete: ${result}`);
  console.log(`  Updated ${check} timestamp`);
}

// Run if called directly
if (import.meta.main) {
  main().catch(console.error);
}

export { main as heartbeat };
