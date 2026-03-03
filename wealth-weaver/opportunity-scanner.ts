// Autonomous Opportunity Scanner - Infused into Super Saiyan
// Monitors GitHub, Reddit, Twitter, Product Hunt for Blue Ocean opportunities

interface Opportunity {
  id: string;
  source: "github" | "reddit" | "twitter" | "producthunt" | "hn" | "manual";
  type: "product" | "service" | "gap" | "trend" | "painpoint";
  title: string;
  description: string;
  market_gap: string;
  potential_value: number;
  blue_ocean_score: number;
  confidence: number;
  signals: string[];
  action_hint: string;
  discovered_at: string;
  status: "new" | "validated" | "pursuing" | "monetized" | "archived";
}

interface ScanResult {
  source: string;
  opportunities: Opportunity[];
  timestamp: string;
}

// Score an opportunity using Blue Ocean + RL signals
function scoreOpportunity(raw: {
  title: string;
  description: string;
  engagement?: number;
  growth_rate?: number;
  competition?: number;
  pain_signals?: string[];
}): Omit<Opportunity, "id" | "discovered_at" | "status"> {
  const { title, description, engagement = 0, growth_rate = 0, competition = 5, pain_signals = [] } = raw;
  
  // Blue Ocean Score: Low competition + High growth = Blue Ocean
  const blueOceanBase = Math.max(0, 10 - competition) + (growth_rate > 0.2 ? 3 : 0);
  
  // Pain Signal Multiplier: Each pain point = more value
  const painMultiplier = 1 + (pain_signals.length * 0.15);
  
  // Confidence: Based on engagement + signal strength
  const confidenceBase = Math.min(1, (engagement / 1000) + (pain_signals.length * 0.1));
  
  // Potential Value: Heuristic based on market signals
  const valueBase = 100 * Math.pow(1.5, pain_signals.length) * (1 + growth_rate);
  
  // Market Gap Detection
  const marketGap = competition < 3 
    ? `Low competition zone in "${title}" - potential blue ocean`
    : `Crowded space but high demand - differentiate via ${pain_signals[0] || "innovation"}`;
  
  // Action Hint
  const actionHint = competition < 3
    ? `FAST: Build MVP quickly, this is uncontested territory`
    : `PIVOT: Find unique angle using ${pain_signals[0] || "SCAMPER methodology"}`;

  return {
    source: "github", // Will be overridden
    type: pain_signals.length > 2 ? "painpoint" : "product",
    title,
    description,
    market_gap: marketGap,
    potential_value: Math.round(valueBase),
    blue_ocean_score: Math.min(10, blueOceanBase),
    confidence: Math.min(1, confidenceBase),
    signals: pain_signals,
    action_hint: actionHint,
  };
}

// GITHUB SCANNER - Trending repos, new projects, issues
async function scanGitHub(): Promise<ScanResult> {
  const opportunities: Opportunity[] = [];
  
  try {
    // Fetch trending repos
    const response = await fetch("https://api.github.com/search/repositories?q=created:>2026-02-01&sort=stars&order=desc&per_page=20", {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "WealthWeaver-SuperSaiyan"
      }
    });
    
    const data = await response.json();
    
    if (data.items) {
      for (const repo of data.items.slice(0, 10)) {
        // Extract pain signals from repo description/topics
        const painSignals: string[] = [];
        const desc = (repo.description || "").toLowerCase();
        
        if (desc.includes("automate") || desc.includes("automation")) painSignals.push("automation_need");
        if (desc.includes("simplify") || desc.includes("easy")) painSignals.push("complexity_pain");
        if (desc.includes("fast") || desc.includes("performance")) painSignals.push("speed_demand");
        if (desc.includes("missing") || desc.includes("alternative")) painSignals.push("tool_gap");
        if (repo.stargazers_count > 100 && repo.forks_count < 20) painSignals.push("high_interest_low_action");
        
        const scored = scoreOpportunity({
          title: repo.full_name,
          description: repo.description || "No description",
          engagement: repo.stargazers_count + repo.forks_count * 2,
          growth_rate: repo.stargazers_count / Math.max(1, (Date.now() - new Date(repo.created_at).getTime()) / 86400000) / 100,
          competition: Math.min(10, repo.forks_count / 10),
          pain_signals: painSignals,
        });
        
        opportunities.push({
          id: `gh-${repo.id}`,
          source: "github",
          ...scored,
          discovered_at: new Date().toISOString(),
          status: "new",
        });
      }
    }
  } catch (error) {
    console.error("GitHub scan error:", error);
  }
  
  return {
    source: "github",
    opportunities,
    timestamp: new Date().toISOString(),
  };
}

// REDDIT SCANNER - Pain points, feature requests, complaints
async function scanReddit(subreddits: string[] = ["entrepreneur", "SaaS", "startups", "sideproject"]): Promise<ScanResult> {
  const opportunities: Opportunity[] = [];
  
  try {
    // Use Reddit's JSON API
    for (const subreddit of subreddits.slice(0, 2)) {
      const response = await fetch(`https://www.reddit.com/r/${subreddit}/hot.json?limit=25`, {
        headers: { "User-Agent": "WealthWeaver-SuperSaiyan" }
      });
      
      const data = await response.json();
      
      if (data.data?.children) {
        for (const post of data.data.children.slice(0, 10)) {
          const postData = post.data;
          
          // Extract pain signals from title/body
          const painSignals: string[] = [];
          const text = (postData.title + " " + (postData.selftext || "")).toLowerCase();
          
          if (text.includes("wish there was") || text.includes("need a tool")) painSignals.push("explicit_need");
          if (text.includes("frustrated") || text.includes("annoyed")) painSignals.push("emotional_pain");
          if (text.includes("how do i") || text.includes("help me")) painSignals.push("knowledge_gap");
          if (text.includes("alternative to")) painSignals.push("competition_dissatisfaction");
          if (text.includes("too expensive") || text.includes("overpriced")) painSignals.push("price_sensitivity");
          if (text.includes("manual") || text.includes("time consuming")) painSignals.push("automation_opportunity");
          
          // Only include if there are pain signals
          if (painSignals.length > 0) {
            const scored = scoreOpportunity({
              title: postData.title.substring(0, 100),
              description: (postData.selftext || "").substring(0, 500),
              engagement: postData.score + postData.num_comments * 5,
              growth_rate: postData.upvote_ratio || 0.5,
              competition: 3, // Reddit usually indicates gaps
              pain_signals: painSignals,
            });
            
            opportunities.push({
              id: `reddit-${postData.id}`,
              source: "reddit",
              ...scored,
              discovered_at: new Date().toISOString(),
              status: "new",
            });
          }
        }
      }
      
      // Rate limit
      await new Promise(r => setTimeout(r, 1000));
    }
  } catch (error) {
    console.error("Reddit scan error:", error);
  }
  
  return {
    source: "reddit",
    opportunities,
    timestamp: new Date().toISOString(),
  };
}

// HACKER NEWS SCANNER - Tech trends, discussions
async function scanHackerNews(): Promise<ScanResult> {
  const opportunities: Opportunity[] = [];
  
  try {
    // Fetch top stories
    const topStoriesRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    const storyIds = await topStoriesRes.json();
    
    // Check first 10 stories
    for (const id of (storyIds as number[]).slice(0, 10)) {
      const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      const story = await storyRes.json();
      
      if (!story || !story.title) continue;
      
      // Extract pain signals
      const painSignals: string[] = [];
      const title = story.title.toLowerCase();
      
      if (title.includes("launch") || title.includes("show hn")) painSignals.push("new_product_launch");
      if (title.includes("ask hn") && title.includes("how")) painSignals.push("knowledge_gap");
      if (title.includes("problem") || title.includes("issue")) painSignals.push("explicit_problem");
      if (story.descendants && story.descendants > 100) painSignals.push("high_engagement_topic");
      
      if (painSignals.length > 0) {
        const scored = scoreOpportunity({
          title: story.title,
          description: story.text || story.url || "HN Discussion",
          engagement: story.score + (story.descendants || 0) * 3,
          growth_rate: story.score > 200 ? 0.5 : 0.1,
          competition: 5,
          pain_signals: painSignals,
        });
        
        opportunities.push({
          id: `hn-${story.id}`,
          source: "hn",
          ...scored,
          discovered_at: new Date().toISOString(),
          status: "new",
        });
      }
    }
  } catch (error) {
    console.error("HN scan error:", error);
  }
  
  return {
    source: "hn",
    opportunities,
    timestamp: new Date().toISOString(),
  };
}

// PRODUCT HUNT SCANNER - New products, gaps in market
async function scanProductHunt(): Promise<ScanResult> {
  const opportunities: Opportunity[] = [];
  
  try {
    // Product Hunt doesn't have a free public API, so we'll use a web scrape approach
    // For now, we'll create a placeholder that works with their RSS or similar
    
    // Alternative: Use Indie Hackers API for similar data
    const response = await fetch("https://indie-hackers.firebaseio.com/posts.json?orderBy=\"createdAt\"&limitToLast=20");
    const data = await response.json();
    
    if (data) {
      for (const [key, post] of Object.entries(data as Record<string, any>).slice(0, 10)) {
        const painSignals: string[] = [];
        const content = (post.title + " " + (post.content || "")).toLowerCase();
        
        if (content.includes("mrr") || content.includes("revenue")) painSignals.push("revenue_validation");
        if (content.includes("launch")) painSignals.push("new_product");
        if (content.includes("problem")) painSignals.push("explicit_problem");
        if (content.includes("feature")) painSignals.push("feature_request");
        
        if (painSignals.length > 0) {
          const scored = scoreOpportunity({
            title: post.title || "Indie Hacker Post",
            description: post.content || "",
            engagement: post.likeCount || 0,
            growth_rate: 0.3,
            competition: 4,
            pain_signals: painSignals,
          });
          
          opportunities.push({
            id: `ih-${key}`,
            source: "producthunt", // Using IH as proxy
            ...scored,
            discovered_at: new Date().toISOString(),
            status: "new",
          });
        }
      }
    }
  } catch (error) {
    console.error("Product Hunt/IH scan error:", error);
  }
  
  return {
    source: "producthunt",
    opportunities,
    timestamp: new Date().toISOString(),
  };
}

// MASTER SCANNER - Runs all scanners and aggregates
export async function runFullScan(): Promise<{
  opportunities: Opportunity[];
  top_picks: Opportunity[];
  timestamp: string;
}> {
  console.log(" SCAN: Running full opportunity scan...");
  
  const results = await Promise.allSettled([
    scanGitHub(),
    scanReddit(),
    scanHackerNews(),
    scanProductHunt(),
  ]);
  
  const allOpportunities: Opportunity[] = [];
  
  for (const result of results) {
    if (result.status === "fulfilled") {
      allOpportunities.push(...result.value.opportunities);
      console.log(` Found ${result.value.opportunities.length} opportunities from ${result.value.source}`);
    }
  }
  
  // Sort by Blue Ocean Score + Confidence
  const sorted = allOpportunities.sort((a, b) => {
    const scoreA = a.blue_ocean_score * a.confidence;
    const scoreB = b.blue_ocean_score * b.confidence;
    return scoreB - scoreA;
  });
  
  // Top 5 picks for immediate action
  const topPicks = sorted.slice(0, 5);
  
  console.log(` TOTAL: ${allOpportunities.length} opportunities found`);
  console.log(` TOP PICKS:`);
  topPicks.forEach((opp, i) => {
    console.log(`   ${i + 1}. [${opp.source}] ${opp.title.substring(0, 50)} - Blue Ocean: ${opp.blue_ocean_score}/10`);
  });
  
  return {
    opportunities: sorted,
    top_picks: topPicks,
    timestamp: new Date().toISOString(),
  };
}

// OPPORTUNITY STORE - Persist found opportunities
const opportunityStore = new Map<string, Opportunity>();

export function storeOpportunities(opps: Opportunity[]): void {
  for (const opp of opps) {
    if (!opportunityStore.has(opp.id)) {
      opportunityStore.set(opp.id, opp);
    }
  }
}

export function getOpportunities(filter?: {
  min_score?: number;
  status?: Opportunity["status"];
  source?: Opportunity["source"];
}): Opportunity[] {
  let results = Array.from(opportunityStore.values());
  
  if (filter?.min_score) {
    results = results.filter(o => o.blue_ocean_score >= filter.min_score!);
  }
  if (filter?.status) {
    results = results.filter(o => o.status === filter.status);
  }
  if (filter?.source) {
    results = results.filter(o => o.source === filter.source);
  }
  
  return results.sort((a, b) => b.blue_ocean_score - a.blue_ocean_score);
}

export function updateOpportunityStatus(id: string, status: Opportunity["status"]): Opportunity | null {
  const opp = opportunityStore.get(id);
  if (opp) {
    opp.status = status;
    opportunityStore.set(id, opp);
    return opp;
  }
  return null;
}

// EXPORT FOR INTEGRATION
export { Opportunity, ScanResult };