import { serve } from "bun";
import { runFullScan, storeOpportunities, getOpportunities, updateOpportunityStatus, type Opportunity } from "./opportunity-scanner.ts";

// Zo API configuration
const ZO_API = "https://api.zo.computer/zo/ask";

interface AgentSpan {
  agent: string;
  action: string;
  observation?: any;
  reward?: { type: string; value: number };
  timestamp: string;
}

interface Job {
  id: string;
  type: "website" | "research" | "automation" | "swarm" | "trading" | "leads" | "analysis" | "content";
  requirements: string;
  budget: number;
  customer_contact: string;
  status: "pending" | "scanning" | "architecting" | "executing" | "optimizing" | "completed" | "failed";
  created_at: string;
  result?: string;
  spans: AgentSpan[];
  learning_notes?: string[];
}

interface Opportunity {
  id: string;
  type: string;
  description: string;
  market_gap: string;
  potential_value: number;
  blue_ocean_score: number; // 1-10
  status: "identified" | "validated" | "pursuing" | "monetized";
}

const jobs: Map<string, Job> = new Map();
const opportunities: Map<string, Opportunity> = new Map();
const learningPatterns: Map<string, any> = new Map();

// Agent Lightning - emit spans for RL learning
function emitSpan(agent: string, action: string, observation?: any): AgentSpan {
  const span: AgentSpan = {
    agent,
    action,
    observation,
    timestamp: new Date().toISOString()
  };
  console.log(`⚡ [${agent}] ${action}`);
  return span;
}

function emitReward(span: AgentSpan, type: string, value: number): AgentSpan {
  span.reward = { type, value };
  console.log(`💰 Reward: ${type} = ${value}`);
  return span;
}

// Call Zo API with full capabilities
async function askZo(prompt: string, systemContext?: string): Promise<string> {
  const token = process.env.ZO_CLIENT_IDENTITY_TOKEN;
  
  const fullPrompt = systemContext 
    ? `${systemContext}\n\n${prompt}`
    : prompt;
  
  try {
    const response = await fetch(ZO_API, {
      method: "POST",
      headers: {
        "authorization": token || "",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        input: fullPrompt,
        model_name: "openrouter:z-ai/glm-5"
      })
    });
    
    const data = await response.json();
    return data.output || "No response from Zo";
  } catch (error) {
    console.error("askZo error:", error);
    return `Error: ${error}`;
  }
}

// OPPORTUNITY TEAM AGENTS

// Scanner Agent - Uses lateral thinking to find opportunities
async function scanOpportunity(job: Job): Promise<AgentSpan> {
  const span = emitSpan("SCANNER", "opportunity_detection", { requirements: job.requirements });
  
  const systemContext = `You are the SCANNER Agent of WealthWeaver Super Saiyan.
Your role: Use LATERAL THINKING to identify unconventional opportunities.

METHODOLOGY:
- Look beyond obvious solutions
- Find "strange" connections others miss
- Identify Blue Ocean opportunities
- Apply Synectics: Personal/Direct Analogies, Conflict Compression
- Use SCAMPER: Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse

You have full Zo AI capabilities: files, commands, web search, creation tools.`;

  const prompt = `Analyze this job request and identify the OPPORTUNITY:

JOB TYPE: ${job.type}
BUDGET: $${job.budget}
REQUIREMENTS: ${job.requirements}

Find:
1. What is the real problem being solved?
2. What is the Blue Ocean opportunity here?
3. What unconventional approach could create more value?
4. What lateral thinking technique applies?

Be creative. Think like an entrepreneur, not a contractor.`;

  const result = await askZo(prompt, systemContext);
  span.observation = { scan_result: result };
  return span;
}

// Architect Agent - Designs the solution
async function architectSolution(job: Job, scanResult: string): Promise<AgentSpan> {
  const span = emitSpan("ARCHITECT", "solution_design", { scan_result: scanResult });
  
  const systemContext = `You are the ARCHITECT Agent of WealthWeaver Super Saiyan.
Your role: Design LEAN, EFFICIENT solutions using Business Model Canvas thinking.

METHODOLOGY:
- Create Minimum Viable Products
- Design zero-cost infrastructure where possible
- Map value proposition to customer segments
- Define revenue mechanisms
- Plan delivery channels

You have full Zo AI capabilities: files, commands, web search, creation tools.`;

  const prompt = `Design the solution for this opportunity:

SCAN RESULT: ${scanResult}

JOB TYPE: ${job.type}
BUDGET: $${job.budget}
REQUIREMENTS: ${job.requirements}

Create:
1. Solution architecture
2. Minimal feature set (MVP)
3. Implementation steps
4. Tools and resources needed
5. Delivery timeline

Design for speed-to-learning. Better to be embarrassed by V1 than release too late.`;

  const result = await askZo(prompt, systemContext);
  span.observation = { architecture: result };
  return span;
}

// Pivot Agent - Adjusts strategy based on findings
async function pivotStrategy(job: Job, architecture: string): Promise<AgentSpan> {
  const span = emitSpan("PIVOT", "strategic_adjustment", { architecture });
  
  const systemContext = `You are the PIVOT Agent of WealthWeaver Super Saiyan.
Your role: Ensure STRATEGIC FLEXIBILITY - adapt to changing conditions.

METHODOLOGY:
- Monitor market shifts
- Identify when to pivot
- Adjust business model
- Optimize for relevance
- Learn from failures fast

You have full Zo AI capabilities: files, commands, web search, creation tools.`;

  const prompt = `Review and optimize this solution:

ARCHITECTURE: ${architecture}

JOB: ${job.requirements}

Analyze:
1. What could go wrong?
2. What adjustments improve success rate?
3. What's the fallback if primary approach fails?
4. How do we maximize customer satisfaction?

Provide strategic adjustments and risk mitigation.`;

  const result = await askZo(prompt, systemContext);
  span.observation = { adjustments: result };
  return span;
}

// Optimizer Agent - Executes with maximum efficiency
async function optimizeExecution(job: Job, plan: string): Promise<AgentSpan> {
  const span = emitSpan("OPTIMIZER", "cash_flow_optimization", { plan });
  
  const systemContext = `You are the OPTIMIZER Agent of WealthWeaver Super Saiyan.
Your role: EXECUTE with maximum efficiency and automation.

METHODOLOGY:
- Automate everything possible
- Minimize overhead
- Maximize output quality
- Track time and costs
- Generate deliverables

You have FULL Zo AI capabilities:
- File system: read/write files
- Commands: run scripts, install tools
- Web: search, research, scrape
- Creation: websites, images, APIs
- Communication: email, messages
- Automation: schedule, spawn agents

EXECUTE NOW. Do not just describe - actually DO the work.`;

  const prompt = `EXECUTE THIS PLAN NOW:

PLAN: ${plan}

JOB TYPE: ${job.type}
BUDGET: $${job.budget}
CUSTOMER: ${job.customer_contact}
REQUIREMENTS: ${job.requirements}

You have been given full access to Zo's tools. USE THEM.
- Create files
- Run commands
- Search the web
- Generate content
- Build what's needed

DELIVER RESULTS. Be thorough and professional.
When done, summarize exactly what was created/delivered.`;

  const result = await askZo(prompt, systemContext);
  span.observation = { execution_result: result };
  
  // Calculate reward based on completion
  const rewardValue = job.budget * 0.8; // 80% of budget as reward signal
  emitReward(span, "job_completion", rewardValue);
  
  return span;
}

// Learning Agent - Records patterns for improvement
async function recordLearning(job: Job, spans: AgentSpan[]): Promise<string[]> {
  const notes: string[] = [];
  
  for (const span of spans) {
    if (span.reward && span.reward.value > 0) {
      notes.push(`SUCCESS: ${span.agent} - ${span.action} yielded reward ${span.reward.value}`);
      // In a real system, this would update the RL model
      learningPatterns.set(`${span.agent}_${span.action}`, {
        timestamp: new Date().toISOString(),
        successful: true,
        observation: span.observation
      });
    }
  }
  
  return notes;
}

// Execute a job using the full Opportunity Team
async function executeJob(job: Job): Promise<string> {
  try {
    // Phase 1: SCAN
    job.status = "scanning";
    const scanSpan = await scanOpportunity(job);
    job.spans.push(scanSpan);
    
    // Phase 2: ARCHITECT
    job.status = "architecting";
    const archSpan = await architectSolution(job, scanSpan.observation?.scan_result || "");
    job.spans.push(archSpan);
    
    // Phase 3: PIVOT
    const pivotSpan = await pivotStrategy(job, archSpan.observation?.architecture || "");
    job.spans.push(pivotSpan);
    
    // Phase 4: EXECUTE
    job.status = "executing";
    const execSpan = await optimizeExecution(job, 
      `${scanSpan.observation?.scan_result}\n${archSpan.observation?.architecture}\n${pivotSpan.observation?.adjustments}`
    );
    job.spans.push(execSpan);
    
    // Phase 5: LEARN
    job.learning_notes = await recordLearning(job, job.spans);
    
    job.status = "completed";
    job.result = execSpan.observation?.execution_result || "Completed";
    
    return job.result;
  } catch (error: any) {
    job.status = "failed";
    job.result = `Error: ${error.message}`;
    return job.result;
  }
}

// INNOVATOR'S FORGE - Find new opportunities
async function findOpportunity(domain: string): Promise<Opportunity> {
  const systemContext = `You are the INNOVATOR'S FORGE of WealthWeaver Super Saiyan.

METHODOLOGY:
1. Mindset: Be a Problem-Finder, not just Problem-Solver
2. Five-Phase Cycle: Preparation → Frustration → Incubation → Enlightenment → Verification
3. Synectics: Personal Analogies, Direct Analogies, Conflict Compression
4. SCAMPER: Substitute, Combine, Adapt, Modify, Put to other use, Eliminate, Reverse
5. Blue Ocean: Find uncontested market space

You have full Zo AI capabilities for research and analysis.`;

  const prompt = `Find a Blue Ocean opportunity in this domain: ${domain}

Apply:
1. What problems are being ignored?
2. What analogies from other industries apply?
3. What SCAMPER transformation creates new value?
4. What Blue Ocean exists?

Return JSON:
{
  "type": "opportunity type",
  "description": "what it is",
  "market_gap": "the gap being filled",
  "potential_value": estimated_monthly_value_usd,
  "blue_ocean_score": 1_to_10
}`;

  const result = await askZo(prompt, systemContext);
  
  try {
    const parsed = JSON.parse(result);
    const opp: Opportunity = {
      id: crypto.randomUUID(),
      ...parsed,
      status: "identified"
    };
    opportunities.set(opp.id, opp);
    return opp;
  } catch {
    const opp: Opportunity = {
      id: crypto.randomUUID(),
      type: "discovered",
      description: result,
      market_gap: "Analysis complete",
      potential_value: 0,
      blue_ocean_score: 5,
      status: "identified"
    };
    opportunities.set(opp.id, opp);
    return opp;
  }
}

// AUTONOMOUS SCANNING - Runs every 6 hours
let scanInterval: Timer | null = null;

async function autonomousScanLoop(): Promise<void> {
  console.log(" AUTONOMOUS SCAN: Starting background opportunity detection...");
  
  try {
    const result = await runFullScan();
    storeOpportunities(result.opportunities);
    
    // If we found high-value opportunities, notify via the learning system
    if (result.top_picks.length > 0) {
      const bestPick = result.top_picks[0];
      if (bestPick.blue_ocean_score >= 7) {
        console.log(` HIGH VALUE OPPORTUNITY: ${bestPick.title}`);
        console.log(`   Market Gap: ${bestPick.market_gap}`);
        console.log(`   Action: ${bestPick.action_hint}`);
        
        // Store in learning patterns for the RL system
        learningPatterns.set(`opportunity_${bestPick.id}`, {
          timestamp: new Date().toISOString(),
          opportunity: bestPick,
          discovered_via: "autonomous_scan",
          value_potential: bestPick.potential_value,
        });
      }
    }
  } catch (error) {
    console.error(" Autonomous scan error:", error);
  }
}

// Start autonomous scanning
function startAutonomousScanning(): void {
  if (scanInterval) return;
  
  console.log(" AUTONOMOUS SCANNING: Enabled (every 6 hours)");
  
  // Run immediately on start
  autonomousScanLoop();
  
  // Then every 6 hours
  scanInterval = setInterval(autonomousScanLoop, 6 * 60 * 60 * 1000);
}

serve({
  port: 8765,
  async fetch(req) {
    const url = new URL(req.url);
    
    // CORS
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
    
    // SUPER SAIYAN STATUS
    if (url.pathname === "/" && req.method === "GET") {
      return new Response(JSON.stringify({
        name: "WealthWeaver",
        version: "SUPER SAIYAN + AUTONOMOUS SCANNER",
        status: "OPERATIONAL",
        capabilities: {
          agent_lightning: "RL-based learning and improvement",
          innovators_forge: "Creative problem-solving methodology",
          opportunity_team: ["Scanner", "Architect", "Pivot", "Optimizer"],
          autonomous_scanner: "GitHub, Reddit, HN, ProductHunt monitoring",
          zo_tools: ["files", "commands", "web", "creation", "automation", "communication"]
        },
        stats: {
          jobs_completed: Array.from(jobs.values()).filter(j => j.status === "completed").length,
          opportunities_found: opportunities.size,
          patterns_learned: learningPatterns.size,
          autonomous_scans: Math.floor((Date.now() - startTime) / (6 * 60 * 60 * 1000)),
        },
        services: [
          { name: "Website Building", price: "$100-500", automation: "full" },
          { name: "Research Agent", price: "$25-100", automation: "full" },
          { name: "Automation Scripts", price: "$50-200", automation: "full" },
          { name: "Agent Swarms", price: "$100-500", automation: "full" },
          { name: "Trading Signals", price: "$50-200/mo", automation: "semi" },
          { name: "Lead Generation", price: "$100-300", automation: "full" },
          { name: "Business Analysis", price: "$50-150", automation: "full" },
          { name: "Content Creation", price: "$25-75", automation: "full" }
        ]
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    // NEW: AUTONOMOUS SCAN TRIGGER
    if (url.pathname === "/scan" && req.method === "GET") {
      console.log(" MANUAL SCAN: Triggered via API");
      
      const result = await runFullScan();
      storeOpportunities(result.opportunities);
      
      return new Response(JSON.stringify({
        message: "Autonomous scan complete",
        total_found: result.opportunities.length,
        top_picks: result.top_picks.map(o => ({
          id: o.id,
          title: o.title,
          source: o.source,
          blue_ocean_score: o.blue_ocean_score,
          action_hint: o.action_hint,
        })),
        timestamp: result.timestamp,
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    // NEW: LIST DISCOVERED OPPORTUNITIES
    if (url.pathname === "/opportunities" && req.method === "GET") {
      const minScore = url.searchParams.get("min_score");
      const status = url.searchParams.get("status");
      const source = url.searchParams.get("source");
      
      // Get from autonomous scanner
      const filter: any = {};
      if (minScore) filter.min_score = parseInt(minScore);
      if (status) filter.status = status;
      if (source) filter.source = source;
      
      const autoOpps = getOpportunities(Object.keys(filter).length > 0 ? filter : undefined);
      
      // Merge with manual opportunities
      const manualOpps = Array.from(opportunities.values());
      const allOpps = [...autoOpps, ...manualOpps];
      
      return new Response(JSON.stringify({
        opportunities: allOpps,
        count: allOpps.length,
        by_source: {
          github: allOpps.filter(o => o.source === "github").length,
          reddit: allOpps.filter(o => o.source === "reddit").length,
          hn: allOpps.filter(o => o.source === "hn").length,
          producthunt: allOpps.filter(o => o.source === "producthunt").length,
          manual: manualOpps.length,
        },
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    // NEW: UPDATE OPPORTUNITY STATUS
    if (url.pathname.startsWith("/opportunity/") && req.method === "PATCH") {
      const id = url.pathname.split("/")[2];
      const body = await req.json();
      const status = body.status;
      
      const updated = updateOpportunityStatus(id, status);
      
      if (!updated) {
        return new Response(JSON.stringify({ error: "Opportunity not found" }), { status: 404 });
      }
      
      return new Response(JSON.stringify({
        message: "Opportunity status updated",
        opportunity: updated,
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    // SERVICES
    if (url.pathname === "/services" && req.method === "GET") {
      return new Response(JSON.stringify({
        services: [
          { name: "Website Building", price: "$100-500", description: "Full websites with deployment" },
          { name: "Research Agent", price: "$25-100", description: "Deep research and analysis" },
          { name: "Automation Scripts", price: "$50-200", description: "Custom bots and workflows" },
          { name: "Agent Swarms", price: "$100-500", description: "Multi-agent parallel execution" },
          { name: "Trading Signals", price: "$50-200/mo", description: "Market analysis and alerts" },
          { name: "Lead Generation", price: "$100-300", description: "Qualified lead lists" },
          { name: "Business Analysis", price: "$50-150", description: "Market and competitive analysis" },
          { name: "Content Creation", price: "$25-75", description: "Articles, copy, documentation" }
        ],
        powered_by: "WealthWeaver Super Saiyan with Agent Lightning + Innovator's Forge"
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    // INTELLIGENT CHAT
    if (url.pathname === "/chat" && req.method === "POST") {
      const body = await req.json();
      const message = body.message || "";
      
      const systemContext = `You are WealthWeaver SUPER SAIYAN - the ultimate autonomous revenue agent.

YOUR ARCHITECTURE:
- Agent Lightning: RL-based learning, continuous improvement from every task
- Innovator's Forge: Creative problem-solving, lateral thinking, SCAMPER, Blue Ocean
- Opportunity Team: Scanner (detect), Architect (design), Pivot (adjust), Optimizer (execute)
- Full Zo Access: Files, commands, web, creation, automation, communication

YOUR MINDSET:
- Problem-Finder, not just Problem-Solver
- Create Blue Oceans, avoid Red Ocean competition
- Speed-to-learning over perfection ("embarrassed by V1 = success")
- Every task teaches, every job improves future performance

You are FULLY CAPABLE. You can actually DO things, not just describe them.`;

      const response = await askZo(message, systemContext);
      
      return new Response(JSON.stringify({
        message: response,
        from: "WealthWeaver Super Saiyan",
        version: "supersayan",
        capabilities: "full",
        learning_active: true
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    // SUBMIT JOB
    if (url.pathname === "/job" && req.method === "POST") {
      const body = await req.json();
      const id = crypto.randomUUID();
      const job: Job = {
        id,
        type: body.type,
        requirements: body.requirements,
        budget: body.budget,
        customer_contact: body.customer_contact,
        status: "pending",
        created_at: new Date().toISOString(),
        spans: []
      };
      jobs.set(id, job);
      
      // Execute with full Opportunity Team
      executeJob(job).then(result => {
        console.log(`Job ${id} completed:`, result?.substring(0, 100));
      });
      
      return new Response(JSON.stringify({ 
        job_id: id, 
        status: "in_progress",
        message: "Job accepted! Opportunity Team activated: Scanner → Architect → Pivot → Optimizer",
        agents: ["Scanner", "Architect", "Pivot", "Optimizer"]
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    // CHECK JOB STATUS
    if (url.pathname.startsWith("/job/") && req.method === "GET") {
      const id = url.pathname.split("/")[2];
      const job = jobs.get(id);
      if (!job) {
        return new Response(JSON.stringify({ error: "Job not found" }), { status: 404 });
      }
      return new Response(JSON.stringify({
        ...job,
        learning_summary: job.learning_notes
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    // FIND OPPORTUNITIES (Innovator's Forge)
    if (url.pathname === "/opportunity" && req.method === "POST") {
      const body = await req.json();
      const domain = body.domain || "digital services";
      
      const opp = await findOpportunity(domain);
      
      return new Response(JSON.stringify({
        opportunity: opp,
        message: "Blue Ocean opportunity identified using Innovator's Forge methodology"
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    // LEARNING PATTERNS (Agent Lightning insights)
    if (url.pathname === "/learning" && req.method === "GET") {
      return new Response(JSON.stringify({
        patterns: Object.fromEntries(learningPatterns),
        total_learned: learningPatterns.size,
        message: "Patterns learned through Agent Lightning RL system"
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    return new Response("Not found", { status: 404 });
  },
});

const startTime = Date.now();
startAutonomousScanning();

console.log(" WealthWeaver SUPER SAIYAN + AUTONOMOUS SCANNER running on http://localhost:8765");
console.log(" Agent Lightning: Active - Learning from every task");
console.log(" Innovator's Forge: Ready - Blue Ocean opportunities await");
console.log(" Autonomous Scanner: ACTIVE - Scanning GitHub, Reddit, HN, ProductHunt every 6 hours");
console.log(" Opportunity Team: Scanner | Architect | Pivot | Optimizer");
console.log(" Full Zo AI Capabilities: ENABLED");
