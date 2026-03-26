import { describe, it, expect } from 'bun:test';

// Test configuration - assumes server is already running
const BASE_URL = `http://localhost:3000`;

// Test token - must match the server's OPENROUTER_API_KEY
const TEST_TOKEN = 'test-token-for-testing';
const AUTH_HEADER = `Bearer ${TEST_TOKEN}`;

describe('StoryChain API Tests', () => {
  
  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const res = await fetch(`${BASE_URL}/api/health`);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.status).toBe('healthy');
      expect(data.database).toBe('connected');
      expect(data.version).toBe('2.0.0');
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('Authentication', () => {
    it('should reject requests without auth header', async () => {
      const res = await fetch(`${BASE_URL}/api/user/settings`);
      expect(res.status).toBe(401);
      
      const data = await res.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject requests with invalid auth token', async () => {
      const res = await fetch(`${BASE_URL}/api/user/settings`, {
        headers: { 'Authorization': 'Bearer invalid-token' },
      });
      expect(res.status).toBe(401);
      
      const data = await res.json();
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('User Settings', () => {
    it('should get user settings', async () => {
      const res = await fetch(`${BASE_URL}/api/user/settings`, {
        headers: { 'Authorization': AUTH_HEADER },
      });
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.settings).toBeDefined();
      expect(data.settings.preferredModel).toBeDefined();
      expect(typeof data.settings.tokens).toBe('number');
    });

    it('should update user settings', async () => {
      const res = await fetch(`${BASE_URL}/api/user/settings`, {
        method: 'POST',
        headers: { 
          'Authorization': AUTH_HEADER,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferredModel: 'kimi-k2.5',
          autoPurchaseExtensions: true,
        }),
      });
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it('should reject invalid model in settings', async () => {
      const res = await fetch(`${BASE_URL}/api/user/settings`, {
        method: 'POST',
        headers: { 
          'Authorization': AUTH_HEADER,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferredModel: 'invalid-model',
        }),
      });
      expect(res.status).toBe(400);
      
      const data = await res.json();
      expect(data.error).toBe('Invalid model');
    });
  });

  describe('User Profile', () => {
    it('should get user profile', async () => {
      const res = await fetch(`${BASE_URL}/api/user/profile`, {
        headers: { 'Authorization': AUTH_HEADER },
      });
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.user).toBeDefined();
      expect(data.user.id).toBeDefined();
      expect(data.user.username).toBeDefined();
      expect(data.user.email).toBeDefined();
      expect(typeof data.user.tokens).toBe('number');
    });
  });

  describe('LLM Models', () => {
    it('should get available models', async () => {
      const res = await fetch(`${BASE_URL}/api/llm/models`, {
        headers: { 'Authorization': AUTH_HEADER },
      });
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(Array.isArray(data.models)).toBe(true);
      expect(data.models.length).toBeGreaterThan(0);
      
      const model = data.models[0];
      expect(model.id).toBeDefined();
      expect(model.name).toBeDefined();
      expect(model.provider).toBeDefined();
    });
  });

  describe('Stories', () => {
    let createdStoryId: string;

    it('should create a story', async () => {
      const res = await fetch(`${BASE_URL}/api/stories`, {
        method: 'POST',
        headers: { 
          'Authorization': AUTH_HEADER,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Story',
          content: 'This is a test story created by the automated test suite.',
          modelUsed: 'kimi-k2.5',
          characterCount: 100,
          tokensSpent: 0,
          maxCharacters: 10000,
        }),
      });
      expect(res.status).toBe(201);
      
      const data = await res.json();
      expect(data.story).toBeDefined();
      expect(data.story.id).toBeDefined();
      expect(data.story.title).toBe('Test Story');
      expect(data.story.content).toContain('test story');
      
      createdStoryId = data.story.id;
    });

    it('should reject story without title', async () => {
      const res = await fetch(`${BASE_URL}/api/stories`, {
        method: 'POST',
        headers: { 
          'Authorization': AUTH_HEADER,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'Content without title',
          modelUsed: 'kimi-k2.5',
          characterCount: 50,
          tokensSpent: 0,
          maxCharacters: 10000,
        }),
      });
      expect(res.status).toBe(400);
      
      const data = await res.json();
      expect(data.error).toContain('required');
    });

    it('should reject story exceeding character limit', async () => {
      const res = await fetch(`${BASE_URL}/api/stories`, {
        method: 'POST',
        headers: { 
          'Authorization': AUTH_HEADER,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Too Long Story',
          content: 'a'.repeat(1000),
          modelUsed: 'kimi-k2.5',
          characterCount: 1000,
          tokensSpent: 0,
          maxCharacters: 100, // Limit is 100, content is 1000
        }),
      });
      expect(res.status).toBe(400);
      
      const data = await res.json();
      expect(data.code).toBe('CHARACTER_LIMIT_EXCEEDED');
    });

    it('should get stories list', async () => {
      const res = await fetch(`${BASE_URL}/api/stories`, {
        headers: { 'Authorization': AUTH_HEADER },
      });
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(Array.isArray(data.stories)).toBe(true);
    });

    it('should get a specific story', async () => {
      // First create a story if we don't have one
      if (!createdStoryId) {
        const createRes = await fetch(`${BASE_URL}/api/stories`, {
          method: 'POST',
          headers: { 
            'Authorization': AUTH_HEADER,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: 'Story for Get Test',
            content: 'Content for get test',
            modelUsed: 'kimi-k2.5',
            characterCount: 50,
            tokensSpent: 0,
            maxCharacters: 10000,
          }),
        });
        const createData = await createRes.json();
        createdStoryId = createData.story.id;
      }

      const res = await fetch(`${BASE_URL}/api/stories/${createdStoryId}`, {
        headers: { 'Authorization': AUTH_HEADER },
      });
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.story).toBeDefined();
      expect(data.story.id).toBe(createdStoryId);
    });

    it('should return 404 for non-existent story', async () => {
      const res = await fetch(`${BASE_URL}/api/stories/non-existent-id`, {
        headers: { 'Authorization': AUTH_HEADER },
      });
      expect(res.status).toBe(404);
      
      const data = await res.json();
      expect(data.error).toContain('not found');
    });
  });

  describe('Story Contributions', () => {
    it('should add contribution to story', async () => {
      // First create a story
      const createRes = await fetch(`${BASE_URL}/api/stories`, {
        method: 'POST',
        headers: { 
          'Authorization': AUTH_HEADER,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Story for Contribution Test',
          content: 'Initial content',
          modelUsed: 'kimi-k2.5',
          characterCount: 50,
          tokensSpent: 0,
          maxCharacters: 10000,
        }),
      });
      const createData = await createRes.json();
      const storyId = createData.story.id;

      // Add contribution
      const res = await fetch(`${BASE_URL}/api/stories/${storyId}/contributions`, {
        method: 'POST',
        headers: { 
          'Authorization': AUTH_HEADER,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'This is a contribution to the story.',
          modelUsed: 'kimi-k2.5',
          characterCount: 50,
          tokensSpent: 0,
          maxCharacters: 10000,
        }),
      });
      expect(res.status).toBe(201);
      
      const data = await res.json();
      expect(data.contribution).toBeDefined();
      expect(data.contribution.id).toBeDefined();
      expect(typeof data.remainingTokens).toBe('number');
    });
  });

  describe('Social Features', () => {
    it('should like a story', async () => {
      // First create a story
      const createRes = await fetch(`${BASE_URL}/api/stories`, {
        method: 'POST',
        headers: { 
          'Authorization': AUTH_HEADER,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Story for Like Test',
          content: 'Content for like test',
          modelUsed: 'kimi-k2.5',
          characterCount: 50,
          tokensSpent: 0,
          maxCharacters: 10000,
        }),
      });
      const createData = await createRes.json();
      const storyId = createData.story.id;

      // Like the story
      const res = await fetch(`${BASE_URL}/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: { 'Authorization': AUTH_HEADER },
      });
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.liked).toBe(true);
      expect(typeof data.likes).toBe('number');
    });

    it('should unlike a story', async () => {
      // First create a story
      const createRes = await fetch(`${BASE_URL}/api/stories`, {
        method: 'POST',
        headers: { 
          'Authorization': AUTH_HEADER,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Story for Unlike Test',
          content: 'Content for unlike test',
          modelUsed: 'kimi-k2.5',
          characterCount: 50,
          tokensSpent: 0,
          maxCharacters: 10000,
        }),
      });
      const createData = await createRes.json();
      const storyId = createData.story.id;

      // Like then unlike
      await fetch(`${BASE_URL}/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: { 'Authorization': AUTH_HEADER },
      });

      const res = await fetch(`${BASE_URL}/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: { 'Authorization': AUTH_HEADER },
      });
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.liked).toBe(false);
    });

    it('should get trending stories', async () => {
      const res = await fetch(`${BASE_URL}/api/trending`, {
        headers: { 'Authorization': AUTH_HEADER },
      });
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(Array.isArray(data.stories)).toBe(true);
    });
  });

  describe('Token Management', () => {
    it('should get token packages', async () => {
      const res = await fetch(`${BASE_URL}/api/tokens/packages`, {
        headers: { 'Authorization': AUTH_HEADER },
      });
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(Array.isArray(data.packages)).toBe(true);
      expect(data.packages.length).toBeGreaterThan(0);
      
      const pkg = data.packages[0];
      expect(pkg.id).toBeDefined();
      expect(typeof pkg.tokens).toBe('number');
      expect(typeof pkg.price).toBe('number');
    });

    it('should get transaction history', async () => {
      const res = await fetch(`${BASE_URL}/api/user/transactions`, {
        headers: { 'Authorization': AUTH_HEADER },
      });
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(Array.isArray(data.transactions)).toBe(true);
    });

    it('should purchase tokens', async () => {
      // First get current balance
      const profileRes = await fetch(`${BASE_URL}/api/user/profile`, {
        headers: { 'Authorization': AUTH_HEADER },
      });
      const profileData = await profileRes.json();
      const initialTokens = profileData.user.tokens;

      // Purchase tokens
      const res = await fetch(`${BASE_URL}/api/tokens/purchase`, {
        method: 'POST',
        headers: { 
          'Authorization': AUTH_HEADER,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: 'starter',
          tokens: 100,
        }),
      });
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.tokensPurchased).toBe(100);
      expect(data.newBalance).toBe(initialTokens + 100);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const res = await fetch(`${BASE_URL}/api/nonexistent`, {
        headers: { 'Authorization': AUTH_HEADER },
      });
      expect(res.status).toBe(404);
      
      const data = await res.json();
      expect(data.error).toBe('Not found');
      expect(data.code).toBe('NOT_FOUND');
    });
  });
});

describe('Rate Limiting', () => {
  it('should have rate limit headers on responses', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    
    expect(res.headers.get('X-RateLimit-Limit')).toBeDefined();
    expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
    expect(res.headers.get('X-RateLimit-Reset')).toBeDefined();
  });
});

describe('Security Headers', () => {
  it('should include security headers', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block');
  });
});
