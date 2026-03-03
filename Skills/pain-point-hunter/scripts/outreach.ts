#!/usr/bin/env bun
/**
 * Pain Point Hunter - Outreach Agent
 * Sends personalized outreach to leads with solutions
 */

import { readFile, writeFile, appendFile } from "fs/promises";
import { join } from "path";

const SKILL_DIR = join(process.env.HOME!, "workspace/Skills/pain-point-hunter");
const DATA_DIR = join(SKILL_DIR, "data");

const ZO_API = "https://api.zo.computer/zo/ask";
const MODEL_NAME = "openrouter:z-ai/glm-5";

interface Lead {
  id: string;
  painPoint: string;
  business: {
    name: string;
    industry: string;
    location: string;
    contactInfo?: string;
  };
  urgency: "high" | "medium" | "low";
  solutionHint: string;
  source: string;
  status: string;
  solutionReady?: boolean;
  estimatedValue?: number;
  outreachSent?: boolean;
  lastContact?: string;
}

async function generateOutreach(lead: Lead): Promise<string> {
  console.log(`\n📧 Generating outreach for: ${lead.business.name || "Unknown business"}\n`);

  // Load the solution if available
  let solutionContent = "";
  try {
    const solutionPath = join(SKILL_DIR, "solutions", `${lead.id}.md`);
    solutionContent = await readFile(solutionPath, "utf-8");
  } catch {
    // Solution not found
  }

  const prompt = `You are an outreach agent. Your mission: write a personalized message to a potential client.

LEAD INFORMATION:
- Business: ${lead.business.name || "Unknown"}
- Industry: ${lead.business.industry || "Unknown"}
- Location: ${lead.business.location || "Unknown"}
- Contact: ${lead.business.contactInfo || "Not available"}

PAIN POINT:
${lead.painPoint}

SOLUTION CREATED:
${solutionContent ? solutionContent.substring(0, 500) + "..." : "A custom solution has been designed for this problem"}

YOUR TASK:
Write a personalized outreach message that:
1. Shows you understand their specific problem
2. References something specific about their business
3. Offers a concrete solution
4. Includes a clear call to action
5. Is brief (under 200 words)
6. Sounds human, not robotic

STYLE GUIDELINES:
- No excessive punctuation (em dashes, ellipses)
- No filler phrases ("Great question!", "I'd be happy to help!")
- No AI-sounding language
- Direct and professional
- Genuine, not salesy

OUTPUT:
Just the message text, ready to send. No meta-commentary.`;

  try {
    const response = await fetch(ZO_API, {
      method: "POST",
      headers: {
        "Authorization": process.env.ZO_CLIENT_IDENTITY_TOKEN || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: prompt,
        model_name: MODEL_NAME
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.output as string;
  } catch (error) {
    console.error("Error generating outreach:", error);
    return "";
  }
}

async function getNextLeadForOutreach(): Promise<Lead | null> {
  try {
    const leadsPath = join(DATA_DIR, "leads.json");
    const leads: Lead[] = JSON.parse(await readFile(leadsPath, "utf-8"));

    // Find first lead with solution ready, no outreach sent yet
    return leads.find(l => l.solutionReady && !l.outreachSent && l.status !== "contacted") || null;
  } catch {
    return null;
  }
}

async function updateLeadAfterOutreach(leadId: string, message: string): Promise<void> {
  try {
    const leadsPath = join(DATA_DIR, "leads.json");
    const leads: Lead[] = JSON.parse(await readFile(leadsPath, "utf-8"));

    const index = leads.findIndex(l => l.id === leadId);
    if (index !== -1) {
      leads[index] = {
        ...leads[index],
        outreachSent: true,
        status: "contacted",
        lastContact: new Date().toISOString()
      };
      await writeFile(leadsPath, JSON.stringify(leads, null, 2));
    }
  } catch (error) {
    console.error("Error updating lead:", error);
  }
}

async function logOutreach(lead: Lead, message: string): Promise<void> {
  const logPath = join(DATA_DIR, "outreach.log");
  const timestamp = new Date().toISOString();

  const logEntry = `
[${timestamp}] OUTREACH
To: ${lead.business.name || "Unknown"} (${lead.business.contactInfo || "no contact"})
Lead ID: ${lead.id}
Pain Point: ${lead.painPoint.substring(0, 100)}...

MESSAGE:
${message}

---
`;

  await appendFile(logPath, logEntry);
}

async function updateStatus(): Promise<void> {
  try {
    const statusPath = join(DATA_DIR, "status.json");
    const status = JSON.parse(await readFile(statusPath, "utf-8"));
    status.stats.outreachSent += 1;
    status.lastHeartbeat = new Date().toISOString();
    await writeFile(statusPath, JSON.stringify(status, null, 2));
  } catch {
    // Ignore
  }
}

async function main() {
  const args = process.argv.slice(2);
  let leadId: string | null = null;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--lead" && args[i + 1]) {
      leadId = args[i + 1];
      i++;
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    } else if (args[i] === "--help") {
      console.log(`
Pain Point Hunter - Outreach Agent

Usage:
  bun scripts/outreach.ts [options]

Options:
  --lead <id>    Send outreach for specific lead ID
  --dry-run      Generate message without sending
  --help         Show this help

If no lead ID specified, uses the next lead with a ready solution.
`);
      return;
    }
  }

  console.log("📧 Pain Point Hunter - Outreach Agent\n");

  // Get the lead
  let lead: Lead | null = null;

  if (leadId) {
    try {
      const leadsPath = join(DATA_DIR, "leads.json");
      const leads: Lead[] = JSON.parse(await readFile(leadsPath, "utf-8"));
      lead = leads.find(l => l.id === leadId) || null;
    } catch {
      console.error("Could not load leads file");
      return;
    }
  } else {
    lead = await getNextLeadForOutreach();
  }

  if (!lead) {
    console.log("⚠ No leads ready for outreach.");
    console.log("  Run 'bun scripts/build.ts' to create solutions first.");
    return;
  }

  console.log(`Generating outreach for:`);
  console.log(`  Lead ID: ${lead.id}`);
  console.log(`  Business: ${lead.business.name || "Unknown"}`);
  console.log(`  Contact: ${lead.business.contactInfo || "Not available"}`);

  // Generate the outreach message
  const message = await generateOutreach(lead);

  if (!message) {
    console.log("\n❌ Failed to generate outreach message");
    return;
  }

  console.log("\n📨 OUTREACH MESSAGE:\n");
  console.log("─".repeat(60));
  console.log(message);
  console.log("─".repeat(60));

  if (dryRun) {
    console.log("\n⚠ Dry run - message not sent");
    return;
  }

  // In a real implementation, we would send via email or Telegram
  // For now, we just log it
  await logOutreach(lead, message);
  await updateLeadAfterOutreach(lead.id, message);
  await updateStatus();

  console.log("\n✅ Outreach logged (would send via configured channel)");
  console.log(`   To: ${lead.business.contactInfo || "No contact info"}`);
  console.log(`   Channel: email (configure in config.json)`);
}

main().catch(console.error);
