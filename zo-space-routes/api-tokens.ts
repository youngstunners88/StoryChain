import type { Context } from "hono";

// Guest token system - returns default tokens for everyone
export default function handler(c: Context) {
  if (c.req.method === "GET") {
    // Return guest tokens - everyone gets 100 tokens that refresh every 3 hours
    return c.json({
      balance: 100,
      maxBalance: 100,
      nextRefreshIn: 3 * 60 * 60 * 1000, // 3 hours in ms
      canCreateAI: true,
      canCreateManual: true,
    });
  }
  
  return c.json({ error: "Method not allowed" }, 405);
}
