import type { Context } from "hono";

// Token costs for StoryChain
export default function handler(c: Context) {
  if (c.req.method === "GET") {
    return c.json({
      costs: {
        aiStory: 10,
        manualStory: 5,
        aiContribute: 3,
        maxBalance: 100,
        refreshHours: 3,
      }
    });
  }
  
  return c.json({ error: "Method not allowed" }, 405);
}
