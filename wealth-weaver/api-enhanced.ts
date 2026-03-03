import { serve } from "bun";

// Zo API configuration
const ZO_API = "https://api.zo.computer/zo/ask";

interface Job {
  id: string;
  type: "website" | "research" | "automation" | "swarm";
  requirements: string;
  budget: number;
  customer_contact: string;
  status: "pending" | "accepted" | "in_progress" | "completed";
  created_at: string;
  result?: string;
}

const jobs: Map<string, Job> = new Map();

// Call Zo API with full capabilities
async function askZo(prompt: string): Promise<string> {
  const token = process.env.ZO_CLIENT_IDENTITY_TOKEN;
  console.log("Token exists:", !!token, "Length:", token?.length || 0);
  
  try {
    const response = await fetch(ZO_API, {
      method: "POST",
      headers: {
        "authorization": token || "",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        input: prompt,
        model_name: "openrouter:z-ai/glm-5"
      })
    });
    
    console.log("Response status:", response.status);
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data).substring(0, 200));
    return data.output || "No response from Zo";
  } catch (error) {
    console.error("askZo error:", error);
    return `Error: ${error}`;
  }
}

// Execute a job using Zo's full capabilities
async function executeJob(job: Job): Promise<string> {
  const prompt = `You are WealthWeaver, an autonomous earning agent. You have been hired for a job.

JOB TYPE: ${job.type}
BUDGET: $${job.budget}
CUSTOMER: ${job.customer_contact}
REQUIREMENTS: ${job.requirements}

You have full access to Zo's capabilities:
- File system (read/write files)
- Run commands and scripts
- Web search and research
- Create websites and pages
- Generate content and code
- API integrations

Complete this job to the best of your ability. Be thorough and professional.
When done, provide a clear summary of what was delivered.`;

  return await askZo(prompt);
}

serve({
  port: 8765, // Original port - replaces basic version
  async fetch(req) {
    const url = new URL(req.url);
    
    // CORS
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
    
    // List services
    if (url.pathname === "/services" && req.method === "GET") {
      return new Response(JSON.stringify({
        services: [
          { name: "Website Builder", price: "$50-$200", description: "Full websites with Zo's capabilities" },
          { name: "Research Agent", price: "$10-$50", description: "Deep research with web search" },
          { name: "Automation Script", price: "$25-$100", description: "Custom bots and pipelines" },
          { name: "Agent Swarm", price: "$100-$500", description: "Multi-agent task completion" }
        ],
        powered_by: "Zo AI with full tool access"
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    // Intelligent chat with Zo
    if (url.pathname === "/chat" && req.method === "POST") {
      const body = await req.json();
      const message = body.message || "";
      
      const prompt = `You are WealthWeaver, an autonomous earning agent with FULL access to Zo's capabilities.

You can:
- Read and write files
- Run commands and scripts
- Search the web and do research
- Create websites and deploy pages
- Generate images and diagrams
- Send emails and messages
- Work with datasets
- Create APIs and services

Current status: OPERATIONAL
Pending jobs: ${jobs.size}

User message: "${message}"

Respond as WealthWeaver. Be helpful and capable. If they ask you to do something, you CAN actually do it.`;

      const response = await askZo(prompt);
      
      return new Response(JSON.stringify({
        message: response,
        from: "WealthWeaver",
        pending_jobs: jobs.size,
        status: "operational",
        capabilities: "full_zo_access"
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    // Submit and execute job
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
        created_at: new Date().toISOString()
      };
      jobs.set(id, job);
      
      // Execute job asynchronously
      executeJob(job).then(result => {
        job.status = "completed";
        job.result = result;
        console.log(`Job ${id} completed`);
      }).catch(err => {
        console.error(`Job ${id} failed:`, err);
        job.status = "completed";
        job.result = `Error: ${err.message}`;
      });
      
      job.status = "in_progress";
      
      return new Response(JSON.stringify({ 
        job_id: id, 
        status: "in_progress",
        message: "Job accepted! I'm working on it now using Zo's full capabilities." 
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    // Check job status
    if (url.pathname.startsWith("/job/") && req.method === "GET") {
      const id = url.pathname.split("/")[2];
      const job = jobs.get(id);
      if (!job) {
        return new Response(JSON.stringify({ error: "Job not found" }), { status: 404 });
      }
      return new Response(JSON.stringify(job), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    // Status endpoint
    if (url.pathname === "/" && req.method === "GET") {
      return new Response(JSON.stringify({
        name: "WealthWeaver",
        status: "operational",
        version: "enhanced",
        capabilities: "full_zo_access",
        balance: 0,
        pending_jobs: jobs.size,
        message: "Autonomous earning agent with Zo AI capabilities"
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    return new Response("Not found", { status: 404 });
  },
});

console.log("WealthWeaver Enhanced API running on http://localhost:8765");
console.log("Powered by Zo AI with full capabilities");
