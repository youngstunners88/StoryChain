import { DatabaseConnection } from '../database/connection';

export interface PricingTier {
  id?: number;
  min_chars: number;
  max_chars: number;
  price_cusd: number;
  description: string;
}

export interface PricingResult {
  tier: PricingTier;
  price: number;
  characters: number;
  isFree: boolean;
}

export class CharacterPricingService {
  private db: DatabaseConnection;
  private cache: PricingTier[] | null = null;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async getPricingTiers(): Promise<PricingTier[]> {
    if (this.cache) {
      return this.cache;
    }

    const sql = `SELECT * FROM character_pricing ORDER BY min_chars ASC`;
    const tiers = await this.db.query(sql);
    
    this.cache = tiers;
    return tiers;
  }

  async calculatePrice(characters: number): Promise<PricingResult> {
    const tiers = await this.getPricingTiers();
    
    for (const tier of tiers) {
      if (characters >= tier.min_chars && characters <= tier.max_chars) {
        return {
          tier,
          price: tier.price_cusd,
          characters,
          isFree: tier.price_cusd === 0
        };
      }
    }

    const highestTier = tiers[tiers.length - 1];
    if (characters > highestTier.max_chars) {
      return {
        tier: highestTier,
        price: highestTier.price_cusd,
        characters,
        isFree: false
      };
    }

    return {
      tier: tiers[0],
      price: 0,
      characters,
      isFree: true
    };
  }

  async validateSubmission(characters: number): Promise<{ valid: boolean; message?: string }> {
    const MAX_CHARS = 4700;
    
    if (characters > MAX_CHARS) {
      return {
        valid: false,
        message: `Content exceeds ${MAX_CHARS} character limit. Please split into multiple submissions.`
      };
    }

    return { valid: true };
  }

  async getPricingForDisplay(): Promise<Array<{ characters: string; price: string; description: string }>> {
    const tiers = await this.getPricingTiers();
    
    return tiers.map(tier => ({
      characters: tier.max_chars === 10000 
        ? `${tier.min_chars}+` 
        : `${tier.min_chars}-${tier.max_chars}`,
      price: tier.price_cusd === 0 ? 'FREE' : `$${tier.price_cusd.toFixed(2)}`,
      description: tier.description
    }));
  }

  async getFreeTierLimit(): Promise<number> {
    const tiers = await this.getPricingTiers();
    const freeTier = tiers.find(t => t.price_cusd === 0);
    return freeTier ? freeTier.max_chars : 300;
  }

  invalidateCache(): void {
    this.cache = null;
  }
}
