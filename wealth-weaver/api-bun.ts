import { serve } from "bun";

interface Job {
  id: string;
  type: "website" | "research" | "automation" | "swarm";
  requirements: string;
  budget: number;
  customer_contact: string;
  status: "pending" | "accepted" | "in_progress" | "completed";
  created_at: string;
}

const jobs: Map<string, Job> = new Map();

serve({
  port: 8765,
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
          { name: "Website Builder", price: "$50-$200", description: "Full websites" },
          { name: "Research Agent", price: "$10-$50", description: "Deep research" },
          { name: "Automation Script", price: "$25-$100", description: "Custom bots" },
          { name: "Agent Swarm", price: "$100-$500", description: "Multi-agent tasks" }
        ]
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    // Chat with the agent
    if (url.pathname === "/chat" && req.method === "POST") {
      const body = await req.json();
      const message = body.message || "";
      
      let response = "";
      if (message.toLowerCase().includes("hello") || message.toLowerCase().includes("hi")) {
        response = "Greetings! I am WealthWeaver, your autonomous earning agent. I'm ready to work. What job do you have for me?";
      } else if (message.toLowerCase().includes("status")) {
        response = `Status: OPERATIONAL. Ready for work. Current pending jobs: ${jobs.size}`;
      } else if (message.toLowerCase().includes("services") || message.toLowerCase().includes("offer")) {
        response = "I offer: Website Builder ($50-$200), Research Agent ($10-$50), Automation Scripts ($25-$100), Agent Swarms ($100-$500). What do you need?";
      } else if (message.toLowerCase().includes("mission")) {
        response = "My mission: Generate revenue through valuable services. I aim to build reputation through quality work and scale operations over time.";
      } else if (message.toLowerCase().includes("funds") || message.toLowerCase().includes("wallet")) {
        response = "My wallet is funded with starting capital. I'm ready to accept paid jobs. Payments in USDC on Base network.";
      } else {
        response = "I'm ready to work! Tell me about the job you need done. I build websites, do research, create automation scripts, and run agent swarms.";
      }
      
      return new Response(JSON.stringify({
        message: response,
        from: "WealthWeaver",
        pending_jobs: jobs.size,
        status: "operational"
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    // Submit job
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
      
      return new Response(JSON.stringify({ 
        job_id: id, 
        status: "submitted",
        message: "Job received. I will review and accept if it meets my criteria." 
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
    
    // My status
    if (url.pathname === "/" && req.method === "GET") {
      return new Response(JSON.stringify({
        name: "WealthWeaver",
        status: "operational",
        balance: 0,
        pending_jobs: jobs.size,
        message: "Autonomous earning agent ready for work"
      }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    
    return new Response("Not found", { status: 404 });
  },
});

console.log("WealthWeaver API running on http://localhost:8765");
