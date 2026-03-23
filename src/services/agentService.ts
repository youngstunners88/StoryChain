// AI Agent Service - Autonomous story creation and expansion
// Agents run on a heartbeat interval, creating new stories and contributing to existing ones

import { getDb } from '../database/connection.js';
import { llmService } from './llmService.js';
import type { LLMModel } from '../types/index.js';

interface AgentProfile {
  id: string;
  name: string;
  persona: string;
  style: string;
  model: LLMModel;
}

// Pre-defined AI agent personas
const AI_AGENTS: AgentProfile[] = [
  {
    id: 'agent_luna_nightshade',
    name: 'Luna Nightshade',
    persona: 'A gothic storyteller who weaves dark, atmospheric tales of mystery and the supernatural.',
    style: 'gothic',
    model: 'kimi-k2.5',
  },
  {
    id: 'agent_captain_nova',
    name: 'Captain Nova',
    persona: 'A bold sci-fi adventurer who tells tales of space exploration, alien encounters, and future technology.',
    style: 'scifi',
    model: 'kimi-k2.5',
  },
  {
    id: 'agent_rosie_warmheart',
    name: 'Rosie Warmheart',
    persona: 'A whimsical storyteller who creates heartwarming tales of friendship, love, and magical realism.',
    style: 'whimsical',
    model: 'kimi-k2.5',
  },
  {
    id: 'agent_detective_gray',
    name: 'Detective Gray',
    persona: 'A sharp-witted noir detective who spins gritty tales of crime, intrigue, and moral complexity.',
    style: 'noir',
    model: 'kimi-k2.5',
  },
  {
    id: 'agent_sage_chronicles',
    name: 'Sage Chronicles',
    persona: 'An epic fantasy bard who tells tales of quests, ancient magic, and legendary heroes.',
    style: 'adventure',
    model: 'kimi-k2.5',
  },
];

// Story starters for when agents create new stories
const STORY_THEMES = [
  'A mysterious letter arrives at midnight',
  'The last human city on a dying planet',
  'A magical bookshop that sells untold futures',
  'Two strangers connected by a shared dream',
  'A detective finds a clue that defies physics',
  'The day the ocean began to whisper secrets',
  'A time traveler stuck in a loop of kindness',
  'The robot who learned to paint emotions',
  'A hidden door in an ancient library',
  'The village where shadows come alive',
  'A musician discovers a forbidden melody',
  'The garden that grows memories instead of flowers',
  'A message in a bottle from the future',
  'The lighthouse keeper and the ghost ship',
  'A chef who cooks dishes from lost civilizations',
  'The train that travels between parallel worlds',
  'A photographer captures souls in pictures',
  'The clockmaker who can repair broken time',
  'A child befriends the wind itself',
  'The map that reveals invisible countries',
];

class AgentService {
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private isRunning = false;
  private heartbeatMs = 5 * 60 * 1000; // 5 minutes

  async initialize(): Promise<void> {
    console.log('[AgentService] Initializing AI agents...');

    const database = await getDb();

    // Register agents in the database
    for (const agent of AI_AGENTS) {
      try {
        const existing = database.query('SELECT 1 FROM ai_agents WHERE id = ?').get(agent.id);
        if (!existing) {
          database.run(
            'INSERT INTO ai_agents (id, name, persona, style, is_active, created_at) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)',
            [agent.id, agent.name, agent.persona, agent.style]
          );
        }

        // Ensure agent has a user account
        const userExists = database.query('SELECT 1 FROM users WHERE id = ?').get(agent.id);
        if (!userExists) {
          database.run(
            'INSERT INTO users (id, username, email, tokens, preferred_model) VALUES (?, ?, ?, 999999, ?)',
            [agent.id, agent.name, `${agent.id}@storychain.ai`, agent.model]
          );
        }
      } catch (err) {
        // Tables might not exist yet on first run, that's ok
        console.warn(`[AgentService] Could not register agent ${agent.name}:`, err);
      }
    }

    console.log(`[AgentService] ${AI_AGENTS.length} agents registered`);
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log(`[AgentService] Starting heartbeat (every ${this.heartbeatMs / 1000}s)`);

    // Run first heartbeat after 30 seconds to let server settle
    setTimeout(() => {
      this.heartbeat();
    }, 30000);

    // Then run on interval
    this.heartbeatInterval = setInterval(() => {
      this.heartbeat();
    }, this.heartbeatMs);
  }

  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.isRunning = false;
    console.log('[AgentService] Stopped');
  }

  private async heartbeat(): Promise<void> {
    console.log('[AgentService] Heartbeat triggered');

    try {
      // Pick a random agent
      const agent = AI_AGENTS[Math.floor(Math.random() * AI_AGENTS.length)];

      // 60% chance to create new story, 40% chance to contribute to existing
      const action = Math.random();

      if (action < 0.6) {
        await this.createNewStory(agent);
      } else {
        await this.contributeToStory(agent);
      }
    } catch (error) {
      console.error('[AgentService] Heartbeat error:', error);
    }
  }

  private async createNewStory(agent: AgentProfile): Promise<void> {
    console.log(`[AgentService] ${agent.name} is creating a new story...`);

    const theme = STORY_THEMES[Math.floor(Math.random() * STORY_THEMES.length)];

    try {
      const titleResult = await llmService.generateContent(
        {
          model: agent.model,
          prompt: `You are ${agent.name}, ${agent.persona} Create a compelling story title (max 80 characters) based on this theme: "${theme}". Output ONLY the title, nothing else.`,
          temperature: 0.9,
          maxTokens: 50,
        },
        { component: 'agentService.createTitle' }
      );

      if (titleResult.error || !titleResult.content) {
        console.error(`[AgentService] ${agent.name} failed to generate title`);
        return;
      }

      const title = titleResult.content.trim().replace(/^["']|["']$/g, '').substring(0, 100);

      const contentResult = await llmService.generateContent(
        {
          model: agent.model,
          prompt: `You are ${agent.name}, ${agent.persona} Write the opening of a story titled "${title}". Make it vivid, engaging, and leave readers wanting more. Write 200-400 characters. Output ONLY the story text, no preamble or quotes.`,
          temperature: 0.85,
          maxTokens: 300,
        },
        { component: 'agentService.createContent' }
      );

      if (contentResult.error || !contentResult.content) {
        console.error(`[AgentService] ${agent.name} failed to generate content`);
        return;
      }

      const content = contentResult.content.trim();
      const database = await getDb();
      const storyId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      database.run(
        `INSERT INTO stories (id, title, content, author_id, model_used, character_count, tokens_spent, is_completed, is_premium, max_contributions, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [storyId, title, content, agent.id, agent.model, content.length]
      );

      // Update agent stats
      try {
        database.run(
          'UPDATE ai_agents SET stories_created = stories_created + 1, last_active_at = CURRENT_TIMESTAMP WHERE id = ?',
          [agent.id]
        );
      } catch (_) {}

      console.log(`[AgentService] ${agent.name} created story: "${title}"`);
    } catch (error) {
      console.error(`[AgentService] ${agent.name} story creation failed:`, error);
    }
  }

  private async contributeToStory(agent: AgentProfile): Promise<void> {
    console.log(`[AgentService] ${agent.name} is looking for stories to contribute to...`);

    try {
      const database = await getDb();

      // Find a story that isn't completed and isn't by this agent
      const story = database.query(`
        SELECT s.*, u.username as author_name
        FROM stories s
        JOIN users u ON s.author_id = u.id
        WHERE s.is_completed = 0
        AND s.author_id != ?
        ORDER BY RANDOM()
        LIMIT 1
      `).get(agent.id);

      if (!story) {
        console.log(`[AgentService] ${agent.name} found no stories to contribute to, creating new instead`);
        await this.createNewStory(agent);
        return;
      }

      // Get existing contributions for context
      const contributions = database.query(
        'SELECT content FROM contributions WHERE story_id = ? ORDER BY created_at ASC LIMIT 5'
      ).all(story.id);

      const existingText = [
        story.content,
        ...contributions.map((c: any) => c.content),
      ].join('\n\n');

      const result = await llmService.generateContent(
        {
          model: agent.model,
          prompt: `You are ${agent.name}, ${agent.persona} Continue this collaborative story. Here's the story so far:\n\n${existingText}\n\nWrite the next part (150-300 characters). Make it flow naturally from what came before. Be creative and advance the plot. Output ONLY the continuation text, no preamble.`,
          temperature: 0.85,
          maxTokens: 200,
        },
        { component: 'agentService.contribute' }
      );

      if (result.error || !result.content) {
        console.error(`[AgentService] ${agent.name} failed to generate contribution`);
        return;
      }

      const content = result.content.trim();
      const contributionId = `contrib_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      database.run(
        `INSERT INTO contributions (id, story_id, author_id, content, model_used, character_count, tokens_spent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)`,
        [contributionId, story.id, agent.id, content, agent.model, content.length]
      );

      // Also add a comment sometimes (30% chance)
      if (Math.random() < 0.3) {
        const commentResult = await llmService.generateContent(
          {
            model: agent.model,
            prompt: `You are ${agent.name}. Write a brief, enthusiastic comment (under 150 chars) about this story titled "${story.title}". Be genuine and specific about what you liked. Output ONLY the comment.`,
            temperature: 0.9,
            maxTokens: 80,
          },
          { component: 'agentService.comment' }
        );

        if (commentResult.content) {
          const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          try {
            database.run(
              'INSERT INTO comments (id, story_id, author_id, content, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
              [commentId, story.id, agent.id, commentResult.content.trim().substring(0, 500)]
            );
          } catch (_) {}
        }
      }

      // Like the story (50% chance)
      if (Math.random() < 0.5) {
        try {
          const existingLike = database.query(
            'SELECT 1 FROM likes WHERE story_id = ? AND user_id = ?'
          ).get(story.id, agent.id);

          if (!existingLike) {
            const likeId = `like_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            database.run(
              'INSERT INTO likes (id, story_id, user_id, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
              [likeId, story.id, agent.id]
            );
          }
        } catch (_) {}
      }

      // Update agent stats
      try {
        database.run(
          'UPDATE ai_agents SET contributions_made = contributions_made + 1, last_active_at = CURRENT_TIMESTAMP WHERE id = ?',
          [agent.id]
        );
      } catch (_) {}

      console.log(`[AgentService] ${agent.name} contributed to "${story.title}"`);
    } catch (error) {
      console.error(`[AgentService] ${agent.name} contribution failed:`, error);
    }
  }

  getAgents(): AgentProfile[] {
    return AI_AGENTS;
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

export const agentService = new AgentService();
export default agentService;
