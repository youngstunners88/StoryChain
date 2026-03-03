import fetch from "node-fetch";

interface Ad {
  id: string;
  name: string;
  status: string;
  spend: number;
  revenue: number;
  roas: number;
  ctr?: number;
  cpm?: number;
  cpc?: number;
  impressions?: number;
  clicks?: number;
  previousRoas?: number;
  ctrDrop?: number;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  budget: number;
  spend: number;
  revenue: number;
}

interface CopyIdea {
  hook: string;
  body: string;
  cta: string;
}

interface BudgetSuggestion {
  campaignId: string;
  campaignName: string;
  currentBudget: number;
  suggestedBudget: number;
  action: "increase" | "decrease";
  reason: string;
}

export class MetaAdsKit {
  private accessToken: string;
  private adAccountId: string;
  private apiVersion: string;
  
  constructor() {
    this.accessToken = process.env.META_ACCESS_TOKEN || "";
    this.adAccountId = process.env.META_AD_ACCOUNT_ID || "";
    this.apiVersion = "v18.0";
  }
  
  private async fetchMetaAPI(endpoint: string, params: Record<string, string> = {}) {
    const url = `https://graph.facebook.com/${this.apiVersion}/${endpoint}`;
    const searchParams = new URLSearchParams({
      access_token: this.accessToken,
      ...params
    });
    
    const response = await fetch(`${url}?${searchParams}`);
    
    if (!response.ok) {
      throw new Error(`Meta API error: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async getActiveAds(): Promise<Ad[]> {
    try {
      if (!this.accessToken || !this.adAccountId) {
        return this.getMockAds();
      }
      
      const data = await this.fetchMetaAPI(
        `${this.adAccountId}/ads`,
        {
          fields: "id,name,status,insights{spend,roas,ctr,cpm,cpc,impressions,clicks}",
          filtering: '[{"field":"effective_status","operator":"IN","value":["ACTIVE"]}]'
        }
      );
      
      return data.data?.map((ad: any) => ({
        id: ad.id,
        name: ad.name,
        status: ad.status,
        spend: parseFloat(ad.insights?.data[0]?.spend || 0),
        revenue: parseFloat(ad.insights?.data[0]?.roas?.[0]?.value || 0),
        roas: parseFloat(ad.insights?.data[0]?.roas?.[0]?.value || 0) / parseFloat(ad.insights?.data[0]?.spend || 1),
        ctr: parseFloat(ad.insights?.data[0]?.ctr || 0),
        cpm: parseFloat(ad.insights?.data[0]?.cpm || 0),
        cpc: parseFloat(ad.insights?.data[0]?.cpc || 0),
        impressions: parseInt(ad.insights?.data[0]?.impressions || 0),
        clicks: parseInt(ad.insights?.data[0]?.clicks || 0)
      })) || [];
    } catch (error) {
      console.error("Error fetching ads:", error);
      return this.getMockAds();
    }
  }
  
  private getMockAds(): Ad[] {
    return [
      { id: "ad_001", name: "Spring Sale - Carousel", status: "ACTIVE", spend: 156.50, revenue: 467.80, roas: 2.99, ctr: 2.3 },
      { id: "ad_002", name: "New Arrivals - Video", status: "ACTIVE", spend: 234.00, revenue: 312.50, roas: 1.34, ctr: 1.8 },
      { id: "ad_003", name: "Clearance - Image", status: "ACTIVE", spend: 89.00, revenue: 89.20, roas: 1.00, ctr: 0.9 },
      { id: "ad_004", name: "Summer Collection - Carousel", status: "ACTIVE", spend: 312.00, revenue: 890.50, roas: 2.85, ctr: 2.7 },
      { id: "ad_005", name: "Flash Sale - Video", status: "ACTIVE", spend: 178.00, revenue: 156.00, roas: 0.88, ctr: 1.2 },
      { id: "ad_006", name: "Brand Awareness - Video", status: "ACTIVE", spend: 450.00, revenue: 225.00, roas: 0.50, ctr: 0.6 },
      { id: "ad_007", name: "Weekend Special - Carousel", status: "ACTIVE", spend: 123.00, revenue: 456.70, roas: 3.71, ctr: 3.1 },
      { id: "ad_008", name: "Loyalty Program - Image", status: "ACTIVE", spend: 67.50, revenue: 201.50, roas: 2.99, ctr: 2.5 }
    ];
  }
  
  async runFullAnalysis(): Promise<{
    topPerformers: Ad[];
    fatiguedAds: Ad[];
    bleeders: Ad[];
    budgetSuggestions: BudgetSuggestion[];
    avgRoas: number;
  }> {
    const ads = await this.getActiveAds();
    
    // Sort by ROAS for top performers
    const topPerformers = [...ads]
      .filter(ad => ad.roas > 2)
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 5);
    
    // Detect fatigued ads (ROAS declining or low CTR)
    const fatiguedAds = ads.filter(ad => 
      ad.roas < 1.5 && ad.roas > 0.5 && ad.ctr && ad.ctr < 1.5
    );
    
    // Find bleeders (losing money consistently)
    const bleeders = ads.filter(ad => ad.roas < 1 && ad.spend > 50);
    
    // Generate budget suggestions
    const budgetSuggestions = this.generateBudgetSuggestions(ads);
    
    // Calculate average ROAS
    const avgRoas = ads.reduce((sum, ad) => sum + ad.roas, 0) / ads.length;
    
    return {
      topPerformers,
      fatiguedAds,
      bleeders,
      budgetSuggestions,
      avgRoas
    };
  }
  
  async detectFatigue(): Promise<Ad[]> {
    const ads = await this.getActiveAds();
    return ads.filter(ad => {
      // Fatigued if ROAS between 0.5 and 1.5, or CTR below 1.5%
      return (ad.roas < 1.5 && ad.roas > 0.5) || (ad.ctr && ad.ctr < 1.5);
    });
  }
  
  async findBleeders(): Promise<Ad[]> {
    const ads = await this.getActiveAds();
    return ads
      .filter(ad => ad.roas < 1 && ad.spend > 50)
      .sort((a, b) => (b.spend - b.revenue) - (a.spend - a.revenue));
  }
  
  async getBudgetSuggestions(): Promise<BudgetSuggestion[]> {
    const ads = await this.getActiveAds();
    return this.generateBudgetSuggestions(ads);
  }
  
  private generateBudgetSuggestions(ads: Ad[]): BudgetSuggestion[] {
    const suggestions: BudgetSuggestion[] = [];
    
    ads.forEach(ad => {
      if (ad.roas > 3) {
        suggestions.push({
          campaignId: ad.id,
          campaignName: ad.name,
          currentBudget: ad.spend,
          suggestedBudget: ad.spend * 1.5,
          action: "increase",
          reason: `High ROAS (${ad.roas.toFixed(2)}x) - scale up`
        });
      } else if (ad.roas < 1 && ad.spend > 100) {
        suggestions.push({
          campaignId: ad.id,
          campaignName: ad.name,
          currentBudget: ad.spend,
          suggestedBudget: ad.spend * 0.5,
          action: "decrease",
          reason: `Low ROAS (${ad.roas.toFixed(2)}x) - reduce spend`
        });
      }
    });
    
    return suggestions;
  }
  
  async generateCopyIdeas(): Promise<CopyIdea[]> {
    const ads = await this.getActiveAds();
    const topAd = ads.sort((a, b) => b.roas - a.roas)[0];
    
    // Generate copy variations based on top performer
    const ideas: CopyIdea[] = [
      {
        hook: "🔥 The secret's out...",
        body: `${topAd?.name || "Our customers"} are seeing incredible results. Join thousands who've already discovered the difference.`,
        cta: "Shop Now →"
      },
      {
        hook: "⚡ Stop scrolling...",
        body: "This is exactly what you've been looking for. Limited time offer - don't miss out.",
        cta: "Claim Yours →"
      },
      {
        hook: "💡 Here's the truth...",
        body: "Most people overthink this. The solution is simpler than you think. See for yourself.",
        cta: "Learn More →"
      },
      {
        hook: "🎯 Perfect for you if...",
        body: "You want quality without compromise. You value results. You're ready for a change.",
        cta: "Get Started →"
      },
      {
        hook: "❌ 3 mistakes to avoid...",
        body: "Don't waste another day doing it wrong. Here's what actually works (backed by results).",
        cta: "See How →"
      }
    ];
    
    return ideas;
  }
  
  async pauseAd(adId: string): Promise<void> {
    try {
      if (!this.accessToken) {
        console.log(`[MOCK] Would pause ad: ${adId}`);
        return;
      }
      
      await fetch(
        `https://graph.facebook.com/${this.apiVersion}/${adId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            status: "PAUSED",
            access_token: this.accessToken
          })
        }
      );
    } catch (error) {
      console.error("Error pausing ad:", error);
      throw error;
    }
  }
  
  async getDailyReport(): Promise<{
    totalSpend: number;
    totalRevenue: number;
    roas: number;
    orders: number;
    topAd: Ad | null;
    worstAd: Ad | null;
    actionsNeeded: number;
  }> {
    const ads = await this.getActiveAds();
    
    const totalSpend = ads.reduce((sum, ad) => sum + ad.spend, 0);
    const totalRevenue = ads.reduce((sum, ad) => sum + ad.revenue, 0);
    const roas = totalRevenue / totalSpend;
    const orders = Math.floor(totalRevenue / 50); // Approximate
    
    const sortedAds = [...ads].sort((a, b) => b.roas - a.roas);
    const topAd = sortedAds[0] || null;
    const worstAd = sortedAds[sortedAds.length - 1] || null;
    
    const actionsNeeded = ads.filter(ad => ad.roas < 1).length + 
                          ads.filter(ad => ad.ctr && ad.ctr < 1).length;
    
    return {
      totalSpend,
      totalRevenue,
      roas,
      orders,
      topAd,
      worstAd,
      actionsNeeded
    };
  }
  
  async getTodaySpend(): Promise<{
    total: number;
    budget: number;
  }> {
    const ads = await this.getActiveAds();
    const total = ads.reduce((sum, ad) => sum + ad.spend, 0);
    
    return {
      total,
      budget: 1000 // Default daily budget
    };
  }
}
