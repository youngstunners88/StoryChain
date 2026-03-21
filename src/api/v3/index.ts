// StoryChain v3 API Routes
// IP Registry, Multi-Wallet, Time-based Freemium, Character Pricing, Categories

import { Hono } from 'hono';
import { DatabaseConnection } from '../../database/connection';
import { IPRegistryService } from '../../services/ipRegistry';
import { MultiWalletService, WalletType } from '../../services/multiWallet';
import { TimeTrackerService } from '../../services/timeTracker';
import { CharacterPricingService } from '../../services/characterPricing';
import { ContentCategoriesService } from '../../services/contentCategories';
import { rateLimitMiddleware, rateLimiters } from '../../middleware/rateLimiter';

interface Variables {
  user: { id: number; username: string };
}

export function createV3Routes(db: DatabaseConnection): Hono<{ Variables: Variables }> {
  const app = new Hono<{ Variables: Variables }>();

  const ipService = new IPRegistryService(db);
  const walletService = new MultiWalletService(db);
  const timeService = new TimeTrackerService(db);
  const pricingService = new CharacterPricingService(db);
  const categoriesService = new ContentCategoriesService(db);

  // === WALLET ROUTES ===
  app.get('/wallets/supported', (c) => {
    const wallets = walletService.getSupportedWallets();
    return c.json({ wallets });
  });

  app.post('/wallets/connect', rateLimitMiddleware(rateLimiters.auth), async (c) => {
    try {
      const { wallet_type, address, is_primary } = await c.req.json();
      const userId = c.get('user')?.id;

      if (!userId) return c.json({ error: 'Unauthorized' }, 401);
      if (!wallet_type || !address) {
        return c.json({ error: 'wallet_type and address are required' }, 400);
      }

      const wallet = await walletService.connectWallet({
        user_id: userId,
        wallet_type: wallet_type as WalletType,
        address,
        is_primary: is_primary || false,
        verified: false,
        chain: 'ethereum'
      });

      return c.json({
        success: true,
        wallet: {
          id: wallet.id,
          type: wallet.wallet_type,
          chain: wallet.chain,
          address: wallet.address,
          is_primary: wallet.is_primary,
          verified: wallet.verified
        }
      }, 201);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : 'Failed to connect wallet' }, 500);
    }
  });

  app.get('/wallets', rateLimitMiddleware(rateLimiters.general), async (c) => {
    try {
      const userId = c.get('user')?.id;
      if (!userId) return c.json({ error: 'Unauthorized' }, 401);

      const wallets = await walletService.getUserWallets(userId);
      return c.json({ wallets });
    } catch (error) {
      return c.json({ error: 'Failed to retrieve wallets' }, 500);
    }
  });

  // === IP REGISTRY ROUTES ===
  app.post('/ip/register', rateLimitMiddleware(rateLimiters.createStory), async (c) => {
    try {
      const { story_id, isbn, content, commercial_rights_enabled, licensing_terms } = await c.req.json();
      const userId = c.get('user')?.id;

      if (!userId) return c.json({ error: 'Unauthorized' }, 401);
      if (!story_id || !content) {
        return c.json({ error: 'story_id and content are required' }, 400);
      }

      const contentHash = await ipService.generateContentHash(content);

      const entry = await ipService.registerIP({
        story_id,
        isbn,
        content_hash: contentHash,
        commercial_rights_enabled: commercial_rights_enabled || false,
        licensing_terms: licensing_terms || 'all_rights_reserved',
        status: 'active'
      });

      await ipService.addOwnership(entry.id!, {
        user_id: userId,
        ownership_percentage: 100,
        role: 'creator',
        verified: true
      });

      return c.json({
        success: true,
        ip_registry: entry,
        message: 'IP registered successfully'
      }, 201);
    } catch (error) {
      return c.json({ error: 'Failed to register IP' }, 500);
    }
  });

  app.get('/ip/:storyId', async (c) => {
    try {
      const storyId = parseInt(c.req.param('storyId'));
      const ipEntry = await ipService.getIPByStoryId(storyId);

      if (!ipEntry) return c.json({ error: 'IP registration not found' }, 404);

      const owners = await ipService.getOwners(ipEntry.id!);
      return c.json({ ip_registry: ipEntry, owners });
    } catch (error) {
      return c.json({ error: 'Failed to retrieve IP information' }, 500);
    }
  });

  // === AGENT FREEMIUM ROUTES ===
  app.get('/agents/status', rateLimitMiddleware(rateLimiters.general), async (c) => {
    try {
      const userId = c.get('user')?.id;
      if (!userId) return c.json({ error: 'Unauthorized' }, 401);

      const status = await timeService.getFreemiumStatus(userId);
      return c.json({
        can_use_agents: status.canUseAgents,
        session_type: status.sessionType,
        time_remaining_seconds: status.timeRemaining,
        characters_used: status.charactersUsed,
        next_free_at: status.nextFreeAt
      });
    } catch (error) {
      return c.json({ error: 'Failed to get agent status' }, 500);
    }
  });

  app.post('/agents/start-free', rateLimitMiddleware(rateLimiters.auth), async (c) => {
    try {
      const userId = c.get('user')?.id;
      if (!userId) return c.json({ error: 'Unauthorized' }, 401);

      const canStart = await timeService.canStartNewFreePeriod(userId);
      if (!canStart.allowed) {
        return c.json({
          error: 'Cannot start free period yet',
          next_free_at: canStart.nextFreeAt
        }, 403);
      }

      const session = await timeService.startFreePeriod(userId);
      return c.json({
        success: true,
        session: {
          id: session.id,
          type: session.session_type,
          started_at: session.started_at,
          expires_at: session.expires_at,
          time_remaining_seconds: 2 * 60 * 60
        },
        message: 'Free period started. 2 hours of agent access granted.'
      }, 201);
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : 'Failed to start free period' }, 500);
    }
  });

  app.get('/agents/pricing', async (c) => {
    try {
      const tiers = await pricingService.getPricingForDisplay();
      return c.json({
        tiers,
        max_characters_per_submission: 4700
      });
    } catch (error) {
      return c.json({ error: 'Failed to get pricing' }, 500);
    }
  });

  app.post('/agents/calculate', rateLimitMiddleware(rateLimiters.general), async (c) => {
    try {
      const { characters } = await c.req.json();
      if (!characters || typeof characters !== 'number') {
        return c.json({ error: 'characters is required' }, 400);
      }

      const validation = await pricingService.validateSubmission(characters);
      if (!validation.valid) return c.json({ error: validation.message }, 400);

      const pricing = await pricingService.calculatePrice(characters);
      return c.json({
        characters: pricing.characters,
        price_cusd: pricing.price,
        is_free: pricing.isFree,
        tier: {
          min_chars: pricing.tier.min_chars,
          max_chars: pricing.tier.max_chars,
          description: pricing.tier.description
        }
      });
    } catch (error) {
      return c.json({ error: 'Failed to calculate pricing' }, 500);
    }
  });

  app.post('/agents/submit', rateLimitMiddleware(rateLimiters.createStory), async (c) => {
    try {
      const { characters, content, payment_confirmed } = await c.req.json();
      const userId = c.get('user')?.id;

      if (!userId) return c.json({ error: 'Unauthorized' }, 401);
      if (!characters || !content) {
        return c.json({ error: 'characters and content are required' }, 400);
      }

      const validation = await pricingService.validateSubmission(characters);
      if (!validation.valid) return c.json({ error: validation.message }, 400);

      const status = await timeService.getFreemiumStatus(userId);
      if (!status.canUseAgents) {
        return c.json({
          error: 'Agents currently locked. Wait for cooldown or pay to extend.',
          next_free_at: status.nextFreeAt
        }, 403);
      }

      const pricing = await pricingService.calculatePrice(characters);

      if (status.sessionType === 'free_period') {
        await timeService.useCharacters(userId, characters);
      } else if (status.sessionType === 'paid' || pricing.price > 0) {
        if (!payment_confirmed) {
          return c.json({
            error: 'Payment required',
            price_cusd: pricing.price,
            characters,
            message: 'Please confirm payment to proceed'
          }, 402);
        }
        await timeService.extendSession(userId, characters, pricing.price);
      }

      return c.json({
        success: true,
        characters_submitted: characters,
        cost_cusd: pricing.price,
        session_type: status.sessionType
      });
    } catch (error) {
      return c.json({ error: 'Failed to submit content' }, 500);
    }
  });

  // === CATEGORY ROUTES ===
  app.get('/categories', async (c) => {
    try {
      const categories = await categoriesService.getCategories();
      return c.json({ categories });
    } catch (error) {
      return c.json({ error: 'Failed to get categories' }, 500);
    }
  });

  app.get('/categories/:slug', async (c) => {
    try {
      const slug = c.req.param('slug');
      const category = await categoriesService.getCategoryBySlug(slug);
      if (!category) return c.json({ error: 'Category not found' }, 404);
      return c.json({ category });
    } catch (error) {
      return c.json({ error: 'Failed to get category' }, 500);
    }
  });

  app.post('/stories/:id/category', rateLimitMiddleware(rateLimiters.general), async (c) => {
    try {
      const storyId = parseInt(c.req.param('id'));
      const { category_slug } = await c.req.json();
      const userId = c.get('user')?.id;

      if (!userId) return c.json({ error: 'Unauthorized' }, 401);
      if (!category_slug) return c.json({ error: 'category_slug is required' }, 400);

      await categoriesService.setStoryCategory(storyId, category_slug);
      return c.json({ success: true, message: 'Category assigned' });
    } catch (error) {
      return c.json({ error: error instanceof Error ? error.message : 'Failed to set category' }, 500);
    }
  });

  app.get('/stories/:id/category', async (c) => {
    try {
      const storyId = parseInt(c.req.param('id'));
      const category = await categoriesService.getStoryCategory(storyId);
      return c.json({ category });
    } catch (error) {
      return c.json({ error: 'Failed to get story category' }, 500);
    }
  });

  return app;
}
