import { Router } from 'express';
import { TimeTrackerService } from '../services/timeTracker';
import { CharacterPricingService } from '../services/characterPricing';
import { DatabaseConnection } from '../database/connection';
import { authenticateUser } from '../middleware/auth';

export function createAgentRoutes(db: DatabaseConnection): Router {
  const router = Router();
  const timeService = new TimeTrackerService(db);
  const pricingService = new CharacterPricingService(db);

  router.get('/status', authenticateUser, async (req, res) => {
    try {
      const userId = req.user!.id;
      const status = await timeService.getFreemiumStatus(userId);

      res.json({
        can_use_agents: status.canUseAgents,
        session_type: status.sessionType,
        time_remaining_seconds: status.timeRemaining,
        characters_used: status.charactersUsed,
        next_free_at: status.nextFreeAt
      });
    } catch (error) {
      console.error('Status error:', error);
      res.status(500).json({ error: 'Failed to get agent status' });
    }
  });

  router.post('/start-free', authenticateUser, async (req, res) => {
    try {
      const userId = req.user!.id;

      const canStart = await timeService.canStartNewFreePeriod(userId);
      if (!canStart.allowed) {
        return res.status(403).json({
          error: 'Cannot start free period yet',
          next_free_at: canStart.nextFreeAt
        });
      }

      const session = await timeService.startFreePeriod(userId);

      res.status(201).json({
        success: true,
        session: {
          id: session.id,
          type: session.session_type,
          started_at: session.started_at,
          expires_at: session.expires_at,
          time_remaining_seconds: 2 * 60 * 60
        },
        message: 'Free period started. 2 hours of agent access granted.'
      });
    } catch (error) {
      console.error('Start free period error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to start free period' });
    }
  });

  router.get('/pricing', async (req, res) => {
    try {
      const tiers = await pricingService.getPricingForDisplay();

      res.json({
        tiers,
        max_characters_per_submission: 4700
      });
    } catch (error) {
      console.error('Pricing error:', error);
      res.status(500).json({ error: 'Failed to get pricing' });
    }
  });

  router.post('/calculate', authenticateUser, async (req, res) => {
    try {
      const { characters } = req.body;

      if (!characters || typeof characters !== 'number') {
        return res.status(400).json({ error: 'characters is required' });
      }

      const validation = await pricingService.validateSubmission(characters);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.message });
      }

      const pricing = await pricingService.calculatePrice(characters);

      res.json({
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
      console.error('Calculate pricing error:', error);
      res.status(500).json({ error: 'Failed to calculate pricing' });
    }
  });

  router.post('/submit', authenticateUser, async (req, res) => {
    try {
      const { characters, content, payment_confirmed } = req.body;
      const userId = req.user!.id;

      if (!characters || !content) {
        return res.status(400).json({ error: 'characters and content are required' });
      }

      const validation = await pricingService.validateSubmission(characters);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.message });
      }

      const status = await timeService.getFreemiumStatus(userId);

      if (!status.canUseAgents) {
        return res.status(403).json({
          error: 'Agents currently locked. Wait for cooldown or pay to extend.',
          next_free_at: status.nextFreeAt
        });
      }

      const pricing = await pricingService.calculatePrice(characters);

      if (status.sessionType === 'free_period') {
        await timeService.useCharacters(userId, characters);
      } else if (status.sessionType === 'paid' || pricing.price > 0) {
        if (!payment_confirmed) {
          return res.status(402).json({
            error: 'Payment required',
            price_cusd: pricing.price,
            characters: characters,
            message: 'Please confirm payment to proceed'
          });
        }

        await timeService.extendSession(userId, characters, pricing.price);
      }

      res.json({
        success: true,
        characters_submitted: characters,
        cost_cusd: pricing.price,
        session_type: status.sessionType,
        message: 'Content submitted successfully'
      });
    } catch (error) {
      console.error('Submit error:', error);
      res.status(500).json({ error: 'Failed to submit content' });
    }
  });

  router.get('/history', authenticateUser, async (req, res) => {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 10;

      const history = await timeService.getSessionHistory(userId, limit);

      res.json({
        sessions: history.map(h => ({
          id: h.id,
          type: h.session_type,
          started_at: h.started_at,
          expired_at: h.expires_at,
          characters_used: h.characters_used,
          cost_cusd: h.cost_incurred,
          status: h.status
        }))
      });
    } catch (error) {
      console.error('History error:', error);
      res.status(500).json({ error: 'Failed to get session history' });
    }
  });

  return router;
}
