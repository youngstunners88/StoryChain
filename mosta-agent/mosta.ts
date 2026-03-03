#!/usr/bin/env bun

/**
 * Mosta - iHhashi Marketing Agent Runner
 * 
 * This script orchestrates the Mosta marketing agent for iHhashi,
 * generating TikTok content every 2 hours and collaborating hourly.
 */

import { execSync, spawn } from "child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const AGENT_DIR = "/home/workspace/mosta-agent";
const CONFIG_PATH = join(AGENT_DIR, "config.json");
const STATE_PATH = join(AGENT_DIR, "state.json");
const CONTENT_LOG_PATH = join(AGENT_DIR, "content-log.json");
const OLLAMA_MODEL = "llama3.2:latest";

interface AgentState {
  lastContentGeneration: string | null;
  lastCollaboration: string | null;
  contentCount: number;
  lastLanguage: string;
  performanceData: Record<string, any>;
}

interface ContentLog {
  timestamp: string;
  type: "image" | "video";
  language: string;
  hook: string;
  path: string;
  posted: boolean;
  views?: number;
  engagement?: number;
}

// Initialize or load state
function loadState(): AgentState {
  if (existsSync(STATE_PATH)) {
    return JSON.parse(readFileSync(STATE_PATH, "utf-8"));
  }
  return {
    lastContentGeneration: null,
    lastCollaboration: null,
    contentCount: 0,
    lastLanguage: "Zulu",
    performanceData: {},
  };
}

function saveState(state: AgentState) {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

// Load content log
function loadContentLog(): ContentLog[] {
  if (existsSync(CONTENT_LOG_PATH)) {
    return JSON.parse(readFileSync(CONTENT_LOG_PATH, "utf-8"));
  }
  return [];
}

function saveContentLog(log: ContentLog[]) {
  writeFileSync(CONTENT_LOG_PATH, JSON.stringify(log, null, 2));
}

// Get current South African time
function getSATime(): Date {
  const now = new Date();
  // SAST is UTC+2
  return new Date(now.getTime() + 2 * 60 * 60 * 1000);
}

// Determine optimal language based on time
function getLanguageForTime(date: Date): string {
  const hour = date.getHours();
  const languages = ["Zulu", "Xhosa", "Sotho", "Afrikaans", "English"];
  
  // Language rotation strategy from AGENT.md
  if (hour >= 6 && hour < 10) return Math.random() > 0.5 ? "English" : "Zulu";
  if (hour >= 10 && hour < 14) return Math.random() > 0.5 ? "Zulu" : "Xhosa";
  if (hour >= 14 && hour < 18) return Math.random() > 0.5 ? "English" : "Afrikaans";
  if (hour >= 18 && hour < 22) return languages[Math.floor(Math.random() * languages.length)];
  return "English";
}

// Generate content hook based on time and language
function generateHook(language: string, timeOfDay: string): string {
  const hooks: Record<string, Record<string, string[]>> = {
    Zulu: {
      morning: [
        "Indaba yami nge-iHhashi - sengivele ngibuyekeze after 20 minutes!",
        "Umama wami wayengalindele ukuthi ukudla kufike kushisile.",
      ],
      afternoon: [
        "ISouth Africa iyaphilisa! iHhashi iletha kahle kahle.",
        "Angikaze ngibone ukudla okumnaka kufike kushisile kanjalo!",
      ],
      evening: [
        "Siyabonga iHhashi - fridge yami manje ijwele.",
        "December mode: iHhashi iletha konke okudingayo!",
      ],
    },
    English: {
      morning: [
        "POV: You're a student and the canteen closed early",
        "When your mom asks you to buy groceries but you're at varsity",
      ],
      afternoon: [
        "Empty fridge → Full feast (30 mins with iHhashi)",
        "South Africans when they realise they can get KOTA delivered",
      ],
      evening: [
        "Hungry at 2AM → Full stomach (iHhashi got you)",
        "Treat yourself without the effort",
      ],
    },
    Xhosa: {
      morning: ["Molo! iHhashi iletha ukutya okushushu."],
      afternoon: ["Ndiyabulela iHhashi - fridge yam igcwele."],
      evening: ["ISouth Africa iyaphilisa nge-iHhashi!"],
    },
    Sotho: {
      morning: ["Dumelang! iHhashi e tlisitse lijosi tse chesang."],
      afternoon: ["Re leboga iHhashi - fridge ea rona e tlala."],
      evening: ["Aforika Borwa e phelisa ka iHhashi!"],
    },
    Afrikaans: {
      morning: ["Haai! iHhashi bring die ontbyt reg."],
      afternoon: ["Dankie iHhashi - my yskas is vol."],
      evening: ["Suid-Afrika lewe met iHhashi!"],
    },
  };

  const langHooks = hooks[language] || hooks.English;
  const timeHooks = langHooks[timeOfDay] || langHooks.afternoon;
  return timeHooks[Math.floor(Math.random() * timeHooks.length)];
}

// Generate content using the appropriate skills
async function generateContentPackage(language: string, hook: string): Promise<{
  image: string | null;
  video15s: string | null;
  video5s: string | null;
}> {
  const saTime = getSATime();
  const timeOfDay = saTime.getHours() < 12 ? "morning" : 
                    saTime.getHours() < 18 ? "afternoon" : "evening";
  
  const timestamp = saTime.toISOString().replace(/[:.]/g, "-");
  const outputDir = join(AGENT_DIR, "output", timestamp);
  
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log(`\n🎨 Generating content package...`);
  console.log(`   Language: ${language}`);
  console.log(`   Hook: ${hook}`);
  console.log(`   Output: ${outputDir}\n`);

  // In a real implementation, this would call the actual skill tools
  // For now, we'll structure the prompts that would be used
  
  const imagePrompt = `TikTok slideshow image for iHhashi delivery app. 
South African ${timeOfDay} scene. ${hook}
Authentic South African setting, diverse people, warm earth tones.
Text overlay: "${hook.slice(0, 40)}..."
1024x1536 portrait, vibrant, eye-catching.`;

  const video15sPrompt = `15 second TikTok video for iHhashi delivery.
Scene: South African ${timeOfDay}, person ordering food/groceries on phone.
Sequence: Bored/hungry → Opens iHhashi → Order arrives → Happy reaction
Authentic township or suburban setting, diverse cast.
End card: iHhashi logo with tagline "Delivery that understands Mzansi"`;

  const video5sPrompt = `5 second TikTok video bumper.
Quick montage: Food items → iHhashi logo → Tagline
Vibrant colours, South African flag inspired.
Fast cuts, high energy, memorable.`;

  // Log the content generation
  const log = loadContentLog();
  const contentEntry: ContentLog = {
    timestamp: timestamp,
    type: "image",
    language: language,
    hook: hook,
    path: outputDir,
    posted: false,
  };
  log.push(contentEntry);
  saveContentLog(log);

  return {
    image: `${outputDir}/image.png`,
    video15s: `${outputDir}/video-15s.mp4`,
    video5s: `${outputDir}/video-5s.mp4`,
  };
}

// Send collaboration update to Monster Leader
async function sendCollaborationUpdate(state: AgentState, contentGenerated: boolean) {
  const saTime = getSATime();
  const log = loadContentLog();
  const recentContent = log.slice(-5);

  const update = {
    timestamp: saTime.toISOString(),
    type: contentGenerated ? "content_update" : "status_check",
    agent: "Mosta",
    summary: contentGenerated 
      ? `Generated content package at ${saTime.toLocaleTimeString()} SAST`
      : `Hourly status check at ${saTime.toLocaleTimeString()} SAST`,
    recentContent: recentContent.map(c => ({
      language: c.language,
      hook: c.hook,
      posted: c.posted,
    })),
    totalContentGenerated: log.length,
    nextSteps: [
      "Continue 2-hour content cycle",
      "Monitor performance of recent posts",
      "Adjust language mix based on engagement",
    ],
  };

  console.log("\n📤 COLLABORATION UPDATE TO MONSTER LEADER:");
  console.log("─".repeat(50));
  console.log(JSON.stringify(update, null, 2));
  console.log("─".repeat(50) + "\n");

  // In production, this would send via Telegram
  // For now, we save to a collaboration log
  const collabLogPath = join(AGENT_DIR, "collaboration-log.json");
  const collabLog = existsSync(collabLogPath) 
    ? JSON.parse(readFileSync(collabLogPath, "utf-8"))
    : [];
  collabLog.push(update);
  writeFileSync(collabLogPath, JSON.stringify(collabLog, null, 2));

  return update;
}

// Main agent loop
async function runAgentCycle() {
  console.log("\n🦞 MOSTA - iHhashi Marketing Agent");
  console.log("═".repeat(50));
  
  const state = loadState();
  const saTime = getSATime();
  const now = saTime.getTime();

  // Check if we need to generate content (every 2 hours)
  const lastContent = state.lastContentGeneration 
    ? new Date(state.lastContentGeneration).getTime()
    : 0;
  const hoursSinceContent = (now - lastContent) / (1000 * 60 * 60);

  // Check if we need to collaborate (every 1 hour)
  const lastCollab = state.lastCollaboration
    ? new Date(state.lastCollaboration).getTime()
    : 0;
  const hoursSinceCollab = (now - lastCollab) / (1000 * 60 * 60);

  let contentGenerated = false;

  // Generate content if 2+ hours have passed
  if (hoursSinceContent >= 2) {
    console.log("⏰ Time to generate content!");
    
    const language = getLanguageForTime(saTime);
    const timeOfDay = saTime.getHours() < 12 ? "morning" : 
                      saTime.getHours() < 18 ? "afternoon" : "evening";
    const hook = generateHook(language, timeOfDay);

    await generateContentPackage(language, hook);
    
    state.lastContentGeneration = saTime.toISOString();
    state.contentCount++;
    state.lastLanguage = language;
    contentGenerated = true;
  } else {
    console.log(`⏳ Next content in: ${Math.ceil(2 - hoursSinceContent)} hours`);
  }

  // Collaborate if 1+ hour has passed
  if (hoursSinceCollab >= 1) {
    console.log("🤝 Time to collaborate with Monster Leader!");
    await sendCollaborationUpdate(state, contentGenerated);
    state.lastCollaboration = saTime.toISOString();
  } else {
    console.log(`⏳ Next collaboration in: ${Math.ceil(1 - hoursSinceCollab)} hours`);
  }

  saveState(state);
  console.log("\n✅ Cycle complete!\n");
}

// CLI interface
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case "run":
    runAgentCycle();
    break;
  
  case "generate":
    const lang = args[1] || getLanguageForTime(getSATime());
    const hook = args[2] || generateHook(lang, "afternoon");
    generateContentPackage(lang, hook);
    break;
  
  case "status":
    const state = loadState();
    console.log("\n📊 MOSTA STATUS:");
    console.log(JSON.stringify(state, null, 2));
    break;
  
  case "collab":
    const s = loadState();
    sendCollaborationUpdate(s, false);
    break;
  
  default:
    console.log(`
MOSTA - iHhashi Marketing Agent

Usage:
  bun mosta.ts run        - Run one agent cycle
  bun mosta.ts generate   - Generate content package
  bun mosta.ts status     - Show agent status
  bun mosta.ts collab     - Send collaboration update
`);
}
