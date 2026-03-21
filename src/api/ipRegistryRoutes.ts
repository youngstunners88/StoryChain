import { Router } from 'express';
import { IPRegistryService } from '../services/ipRegistry';
import { DatabaseConnection } from '../database/connection';
import { authenticateUser } from '../middleware/auth';

export function createIPRegistryRoutes(db: DatabaseConnection): Router {
  const router = Router();
  const ipService = new IPRegistryService(db);

  router.post('/register', authenticateUser, async (req, res) => {
    try {
      const { story_id, isbn, content, commercial_rights_enabled, licensing_terms } = req.body;
      const userId = req.user!.id;

      if (!story_id || !content) {
        return res.status(400).json({ error: 'story_id and content are required' });
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

      res.status(201).json({
        success: true,
        ip_registry: entry,
        message: 'IP registered successfully'
      });
    } catch (error) {
      console.error('IP registration error:', error);
      res.status(500).json({ error: 'Failed to register IP' });
    }
  });

  router.get('/:storyId', async (req, res) => {
    try {
      const { storyId } = req.params;
      const ipEntry = await ipService.getIPByStoryId(parseInt(storyId));

      if (!ipEntry) {
        return res.status(404).json({ error: 'IP registration not found' });
      }

      const owners = await ipService.getOwners(ipEntry.id!);

      res.json({
        ip_registry: ipEntry,
        owners
      });
    } catch (error) {
      console.error('IP lookup error:', error);
      res.status(500).json({ error: 'Failed to retrieve IP information' });
    }
  });

  router.get('/:storyId/owners', async (req, res) => {
    try {
      const { storyId } = req.params;
      const ipEntry = await ipService.getIPByStoryId(parseInt(storyId));

      if (!ipEntry) {
        return res.status(404).json({ error: 'IP registration not found' });
      }

      const owners = await ipService.getOwners(ipEntry.id!);

      res.json({ owners });
    } catch (error) {
      console.error('Owners lookup error:', error);
      res.status(500).json({ error: 'Failed to retrieve owners' });
    }
  });

  router.post('/transfer', authenticateUser, async (req, res) => {
    try {
      const { story_id, to_user_id, percentage } = req.body;
      const fromUserId = req.user!.id;

      if (!story_id || !to_user_id || !percentage) {
        return res.status(400).json({ error: 'story_id, to_user_id, and percentage are required' });
      }

      const ipEntry = await ipService.getIPByStoryId(story_id);
      if (!ipEntry) {
        return res.status(404).json({ error: 'IP registration not found' });
      }

      await ipService.transferOwnership(ipEntry.id!, fromUserId, to_user_id, percentage);

      res.json({
        success: true,
        message: `Transferred ${percentage}% ownership to user ${to_user_id}`
      });
    } catch (error) {
      console.error('Ownership transfer error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to transfer ownership' });
    }
  });

  return router;
}
