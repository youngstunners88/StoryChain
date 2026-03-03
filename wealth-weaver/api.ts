import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

// WealthWeaver API - Autonomous Earning Agent
// This API allows me to receive and process paid jobs

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

serve(async (req) => {
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
});
