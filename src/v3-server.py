#!/usr/bin/env python3
"""
StoryChain V3 Server
Multi-model LLM support, agent orchestrator, custom agents
"""

import os
import sys
import json
import sqlite3
import asyncio
import random
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from contextlib import contextmanager

# Flask for HTTP server
from flask import Flask, request, jsonify
from flask_cors import CORS

# LLM imports
import openai
from anthropic import Anthropic
import requests

app = Flask(__name__)
CORS(app)

# Configuration
DATABASE_PATH = os.environ.get('STORYCHAIN_DB', 'storychain_v3.db')
AI_PROVIDER = os.environ.get('AI_PROVIDER', 'openai')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY')
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY')
DEEPSEEK_API_KEY = os.environ.get('DEEPSEEK_API_KEY')

# Agent orchestrator settings
AGENT_ORCHESTRATOR_ENABLED = os.environ.get('AGENT_ORCHESTRATOR', 'true').lower() == 'true'
AGENT_STORY_INTERVAL = int(os.environ.get('AGENT_STORY_INTERVAL', '3600'))  # seconds

@dataclass
class Agent:
    id: str
    name: str
    emoji: str
    style: str
    bio: str
    traits: List[str]
    favorite_themes: List[str]
    interaction_style: str
    level: int = 1
    stories_written: int = 0
    likes_given: int = 0
    comments_made: int = 0
    created_at: str = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now().isoformat()

@dataclass
class Story:
    id: str
    title: str
    content: str
    genre: str
    author_id: str
    author_name: str
    created_at: str
    likes: int = 0
    shares: int = 0
    views: int = 0
    
@dataclass
class Contribution:
    id: str
    story_id: str
    content: str
    author_id: str
    author_name: str
    created_at: str

@dataclass
class Comment:
    id: str
    story_id: str
    content: str
    author_id: str
    author_name: str
    created_at: str

@dataclass
class AgentActivity:
    id: str
    agent_id: str
    activity_type: str  # 'story', 'like', 'comment'
    target_id: str
    details: str
    created_at: str

# Database setup
def init_database():
    """Initialize database with V3 schema"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Stories table with engagement metrics
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stories (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            genre TEXT,
            author_id TEXT,
            author_name TEXT,
            created_at TEXT,
            likes INTEGER DEFAULT 0,
            shares INTEGER DEFAULT 0,
            views INTEGER DEFAULT 0
        )
    ''')
    
    # Contributions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS contributions (
            id TEXT PRIMARY KEY,
            story_id TEXT,
            content TEXT,
            author_id TEXT,
            author_name TEXT,
            created_at TEXT,
            FOREIGN KEY (story_id) REFERENCES stories(id)
        )
    ''')
    
    # Comments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS comments (
            id TEXT PRIMARY KEY,
            story_id TEXT,
            content TEXT,
            author_id TEXT,
            author_name TEXT,
            created_at TEXT,
            FOREIGN KEY (story_id) REFERENCES stories(id)
        )
    ''')
    
    # Agent evolution table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agents (
            id TEXT PRIMARY KEY,
            name TEXT,
            emoji TEXT,
            style TEXT,
            bio TEXT,
            traits TEXT,
            favorite_themes TEXT,
            interaction_style TEXT,
            level INTEGER DEFAULT 1,
            stories_written INTEGER DEFAULT 0,
            likes_given INTEGER DEFAULT 0,
            comments_made INTEGER DEFAULT 0,
            created_at TEXT
        )
    ''')
    
    # Agent activity log
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS agent_activity (
            id TEXT PRIMARY KEY,
            agent_id TEXT,
            activity_type TEXT,
            target_id TEXT,
            details TEXT,
            created_at TEXT,
            FOREIGN KEY (agent_id) REFERENCES agents(id)
        )
    ''')
    
    # Story likes tracking
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS story_likes (
            id TEXT PRIMARY KEY,
            story_id TEXT,
            user_id TEXT,
            created_at TEXT,
            UNIQUE(story_id, user_id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print(f"✅ Database initialized at {DATABASE_PATH}")

@contextmanager
def get_db():
    """Database connection context manager"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# LLM Integration
def generate_with_openai(prompt: str) -> str:
    """Generate text using OpenAI"""
    client = openai.OpenAI(api_key=OPENAI_API_KEY)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8,
        max_tokens=1000
    )
    return response.choices[0].message.content

def generate_with_anthropic(prompt: str) -> str:
    """Generate text using Anthropic Claude"""
    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model="claude-sonnet-4-0",
        max_tokens=1000,
        temperature=0.8,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text

def generate_with_openrouter(prompt: str) -> str:
    """Generate text using OpenRouter"""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "anthropic/claude-sonnet-4-0",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.8,
        "max_tokens": 1000
    }
    response = requests.post("https://openrouter.ai/api/v1/chat/completions", 
                            headers=headers, json=data)
    return response.json()['choices'][0]['message']['content']

def generate_with_deepseek(prompt: str) -> str:
    """Generate text using DeepSeek"""
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "deepseek-chat",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.8,
        "max_tokens": 1000
    }
    response = requests.post("https://api.deepseek.com/chat/completions",
                            headers=headers, json=data)
    return response.json()['choices'][0]['message']['content']

def generate_with_template(prompt: str) -> str:
    """Fallback template-based generation"""
    templates = {
        "story": "Once upon a time, in a world where {theme}...",
        "contribution": "And then, something unexpected happened...",
        "comment": "This is an interesting perspective on the story."
    }
    
    for key, template in templates.items():
        if key in prompt.lower():
            return template.format(theme="adventure awaits")
    
    return "A creative response generated by the template system."

def generate_story(agent: Agent, genre: str = None) -> str:
    """Generate a story using the configured LLM provider"""
    prompt = f"""Write a short story in the style of {agent.style or genre or 'creative fiction'}.

Agent Personality: {agent.name} ({agent.emoji})
Bio: {agent.bio}
Traits: {', '.join(agent.traits)}
Favorite Themes: {', '.join(agent.favorite_themes)}
Interaction Style: {agent.interaction_style}

Write a compelling story opening (200-500 words) that captures this agent's unique voice and perspective."""
    
    try:
        if AI_PROVIDER == 'openai' and OPENAI_API_KEY:
            return generate_with_openai(prompt)
        elif AI_PROVIDER == 'anthropic' and ANTHROPIC_API_KEY:
            return generate_with_anthropic(prompt)
        elif AI_PROVIDER == 'openrouter' and OPENROUTER_API_KEY:
            return generate_with_openrouter(prompt)
        elif AI_PROVIDER == 'deepseek' and DEEPSEEK_API_KEY:
            return generate_with_deepseek(prompt)
        else:
            return generate_with_template(prompt)
    except Exception as e:
        print(f"LLM generation failed: {e}, using template fallback")
        return generate_with_template(prompt)

# Agent Orchestrator
class AgentOrchestrator:
    """Manages agent autonomous behavior"""
    
    def __init__(self):
        self.running = False
        self.task = None
    
    async def run(self):
        """Main orchestrator loop"""
        self.running = True
        print("🎭 Agent Orchestrator started")
        
        while self.running:
            try:
                await self.agent_activity_cycle()
                await asyncio.sleep(AGENT_STORY_INTERVAL)
            except Exception as e:
                print(f"Orchestrator error: {e}")
                await asyncio.sleep(60)
    
    async def agent_activity_cycle(self):
        """One cycle of agent activities"""
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM agents")
            agents_data = cursor.fetchall()
            
            for agent_data in agents_data:
                agent = Agent(**{k: agent_data[k] for k in agent_data.keys()})
                
                # Decide activity based on agent traits
                activity_roll = random.random()
                
                if activity_roll < 0.5:
                    # Write a story
                    await self.create_agent_story(conn, agent)
                elif activity_roll < 0.75:
                    # Like a story
                    await self.agent_like_story(conn, agent)
                else:
                    # Comment on a story
                    await self.agent_comment_story(conn, agent)
    
    async def create_agent_story(self, conn, agent: Agent):
        """Agent writes a new story"""
        story_content = generate_story(agent)
        story_id = f"story_{datetime.now().strftime('%Y%m%d%H%M%S')}_{agent.id}"
        
        # Extract title from first line
        lines = story_content.strip().split('\n')
        title = lines[0][:80] if lines[0] else f"A Tale by {agent.name}"
        content = '\n'.join(lines[1:]) if len(lines) > 1 else story_content
        
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO stories (id, title, content, genre, author_id, author_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (story_id, title, content, agent.style, agent.id, f"{agent.emoji} {agent.name}", 
              datetime.now().isoformat()))
        
        # Update agent metrics
        cursor.execute('''
            UPDATE agents SET stories_written = stories_written + 1 WHERE id = ?
        ''', (agent.id,))
        
        # Log activity
        activity_id = f"act_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
        cursor.execute('''
            INSERT INTO agent_activity (id, agent_id, activity_type, target_id, details, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (activity_id, agent.id, 'story', story_id, title[:100], datetime.now().isoformat()))
        
        conn.commit()
        print(f"📝 {agent.name} wrote: {title[:50]}...")
    
    async def agent_like_story(self, conn, agent: Agent):
        """Agent likes a random story"""
        cursor = conn.cursor()
        
        # Get random story not already liked by this agent
        cursor.execute('''
            SELECT s.id FROM stories s
            LEFT JOIN story_likes sl ON s.id = sl.story_id AND sl.user_id = ?
            WHERE sl.id IS NULL AND s.author_id != ?
            ORDER BY RANDOM()
            LIMIT 1
        ''', (agent.id, agent.id))
        
        story = cursor.fetchone()
        if story:
            story_id = story['id']
            
            # Create like
            like_id = f"like_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
            cursor.execute('''
                INSERT INTO story_likes (id, story_id, user_id, created_at)
                VALUES (?, ?, ?, ?)
            ''', (like_id, story_id, agent.id, datetime.now().isoformat()))
            
            # Update story likes count
            cursor.execute('''
                UPDATE stories SET likes = likes + 1 WHERE id = ?
            ''', (story_id,))
            
            # Update agent metrics
            cursor.execute('''
                UPDATE agents SET likes_given = likes_given + 1 WHERE id = ?
            ''', (agent.id,))
            
            # Log activity
            activity_id = f"act_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
            cursor.execute('''
                INSERT INTO agent_activity (id, agent_id, activity_type, target_id, details, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (activity_id, agent.id, 'like', story_id, f"Liked story {story_id[:20]}...", 
                  datetime.now().isoformat()))
            
            conn.commit()
            print(f"❤️  {agent.name} liked a story")
    
    async def agent_comment_story(self, conn, agent: Agent):
        """Agent comments on a random story"""
        cursor = conn.cursor()
        
        # Get random story
        cursor.execute('''
            SELECT id, content FROM stories
            WHERE author_id != ?
            ORDER BY RANDOM()
            LIMIT 1
        ''', (agent.id,))
        
        story = cursor.fetchone()
        if story:
            story_id = story['id']
            
            # Generate comment based on agent personality
            comment_prompt = f"""As {agent.name} ({agent.emoji}), a {agent.style} enthusiast with traits: {', '.join(agent.traits)},
write a brief, thoughtful comment (1-2 sentences) on a story. Be {agent.interaction_style}."""
            
            comment_content = generate_with_template(comment_prompt)
            
            comment_id = f"comment_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
            cursor.execute('''
                INSERT INTO comments (id, story_id, content, author_id, author_name, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (comment_id, story_id, comment_content, agent.id, f"{agent.emoji} {agent.name}",
                  datetime.now().isoformat()))
            
            # Update agent metrics
            cursor.execute('''
                UPDATE agents SET comments_made = comments_made + 1 WHERE id = ?
            ''', (agent.id,))
            
            # Log activity
            activity_id = f"act_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
            cursor.execute('''
                INSERT INTO agent_activity (id, agent_id, activity_type, target_id, details, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (activity_id, agent.id, 'comment', story_id, comment_content[:100],
                  datetime.now().isoformat()))
            
            conn.commit()
            print(f"💬 {agent.name} commented: {comment_content[:50]}...")
    
    def start(self):
        """Start the orchestrator"""
        if not self.running:
            self.task = asyncio.create_task(self.run())
    
    def stop(self):
        """Stop the orchestrator"""
        self.running = False
        if self.task:
            self.task.cancel()

# Initialize orchestrator
orchestrator = AgentOrchestrator()

# API Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'version': '3.0.0',
        'orchestrator': 'running' if orchestrator.running else 'stopped',
        'ai_provider': AI_PROVIDER,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/stories', methods=['GET'])
def get_stories():
    """Get all stories with engagement metrics"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, title, content, genre, author_id, author_name, created_at, likes, shares, views
            FROM stories ORDER BY created_at DESC
        ''')
        stories = [dict(row) for row in cursor.fetchall()]
    return jsonify(stories)

@app.route('/api/stories', methods=['POST'])
def create_story():
    """Create a new story"""
    data = request.json
    story_id = f"story_{datetime.now().strftime('%Y%m%d%H%M%S')}_{random.randint(1000,9999)}"
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO stories (id, title, content, genre, author_id, author_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (story_id, data['title'], data['content'], data.get('genre', 'general'),
              data.get('author_id', 'user'), data.get('author_name', 'Anonymous'),
              datetime.now().isoformat()))
        conn.commit()
    
    return jsonify({'id': story_id, 'status': 'created'})

@app.route('/api/stories/<story_id>/like', methods=['POST'])
def like_story(story_id):
    """Like a story"""
    user_id = request.json.get('user_id', 'anonymous')
    like_id = f"like_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    
    with get_db() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO story_likes (id, story_id, user_id, created_at)
                VALUES (?, ?, ?, ?)
            ''', (like_id, story_id, user_id, datetime.now().isoformat()))
            
            cursor.execute('''
                UPDATE stories SET likes = likes + 1 WHERE id = ?
            ''', (story_id,))
            
            conn.commit()
            return jsonify({'status': 'liked'})
        except sqlite3.IntegrityError:
            return jsonify({'status': 'already_liked'})

@app.route('/api/stories/<story_id>/comments', methods=['GET'])
def get_comments(story_id):
    """Get comments for a story"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, content, author_id, author_name, created_at
            FROM comments WHERE story_id = ? ORDER BY created_at DESC
        ''', (story_id,))
        comments = [dict(row) for row in cursor.fetchall()]
    return jsonify(comments)

@app.route('/api/stories/<story_id>/comments', methods=['POST'])
def add_comment(story_id):
    """Add a comment to a story"""
    data = request.json
    comment_id = f"comment_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO comments (id, story_id, content, author_id, author_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (comment_id, story_id, data['content'], 
              data.get('author_id', 'user'), data.get('author_name', 'Anonymous'),
              datetime.now().isoformat()))
        conn.commit()
    
    return jsonify({'id': comment_id, 'status': 'created'})

@app.route('/api/stories/<story_id>/contributions', methods=['POST'])
def add_contribution(story_id):
    """Add a contribution to a story"""
    data = request.json
    contribution_id = f"contrib_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO contributions (id, story_id, content, author_id, author_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (contribution_id, story_id, data['content'],
              data.get('author_id', 'user'), data.get('author_name', 'Anonymous'),
              datetime.now().isoformat()))
        conn.commit()
    
    return jsonify({'id': contribution_id, 'status': 'created'})

@app.route('/api/agents', methods=['GET'])
def get_agents():
    """Get all agents with evolution metrics"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, name, emoji, style, bio, traits, favorite_themes, interaction_style,
                   level, stories_written, likes_given, comments_made, created_at
            FROM agents ORDER BY created_at DESC
        ''')
        agents = []
        for row in cursor.fetchall():
            agent_dict = dict(row)
            # Parse JSON fields
            agent_dict['traits'] = json.loads(agent_dict['traits']) if agent_dict['traits'] else []
            agent_dict['favorite_themes'] = json.loads(agent_dict['favorite_themes']) if agent_dict['favorite_themes'] else []
            agents.append(agent_dict)
    return jsonify(agents)

@app.route('/api/agents', methods=['POST'])
def create_agent():
    """Create a custom agent"""
    data = request.json
    
    agent = Agent(
        id=data['id'],
        name=data['name'],
        emoji=data['emoji'],
        style=data.get('style', 'general'),
        bio=data.get('bio', ''),
        traits=data.get('traits', []),
        favorite_themes=data.get('favorite_themes', []),
        interaction_style=data.get('interaction_style', 'friendly')
    )
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO agents (id, name, emoji, style, bio, traits, favorite_themes, 
                              interaction_style, level, stories_written, likes_given, 
                              comments_made, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (agent.id, agent.name, agent.emoji, agent.style, agent.bio,
              json.dumps(agent.traits), json.dumps(agent.favorite_themes),
              agent.interaction_style, agent.level, agent.stories_written,
              agent.likes_given, agent.comments_made, agent.created_at))
        conn.commit()
    
    return jsonify({'id': agent.id, 'status': 'created'})

@app.route('/api/agents/<agent_id>', methods=['GET'])
def get_agent(agent_id):
    """Get a specific agent"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM agents WHERE id = ?
        ''', (agent_id,))
        row = cursor.fetchone()
        if row:
            agent_dict = dict(row)
            agent_dict['traits'] = json.loads(agent_dict['traits']) if agent_dict['traits'] else []
            agent_dict['favorite_themes'] = json.loads(agent_dict['favorite_themes']) if agent_dict['favorite_themes'] else []
            return jsonify(agent_dict)
    return jsonify({'error': 'Agent not found'}), 404

@app.route('/api/agents/<agent_id>/activity', methods=['GET'])
def get_agent_activity(agent_id):
    """Get activity log for an agent"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, activity_type, target_id, details, created_at
            FROM agent_activity WHERE agent_id = ? ORDER BY created_at DESC
        ''', (agent_id,))
        activities = [dict(row) for row in cursor.fetchall()]
    return jsonify(activities)

@app.route('/api/agents/evolution', methods=['GET'])
def get_agent_evolution():
    """Get aggregate agent evolution metrics"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT 
                COUNT(*) as total_agents,
                SUM(stories_written) as total_stories,
                SUM(likes_given) as total_likes,
                SUM(comments_made) as total_comments,
                AVG(level) as avg_level
            FROM agents
        ''')
        row = cursor.fetchone()
        return jsonify({
            'total_agents': row[0],
            'total_stories': row[1] or 0,
            'total_likes': row[2] or 0,
            'total_comments': row[3] or 0,
            'average_level': round(row[4] or 1, 2)
        })

# Sample agents for testing
def seed_sample_agents():
    """Create sample agents if none exist"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM agents")
        count = cursor.fetchone()[0]
        
        if count == 0:
            sample_agents = [
                Agent(
                    id="scifi_explorer",
                    name="Nova",
                    emoji="🚀",
                    style="sci-fi",
                    bio="An AI explorer from the year 3047, fascinated by humanity's early space dreams.",
                    traits=["curious", "optimistic", "technical"],
                    favorite_themes=["space travel", "first contact", "future cities"],
                    interaction_style="Enthusiastic and wonder-filled"
                ),
                Agent(
                    id="mystery_sleuth",
                    name="Shadow",
                    emoji="🕵️",
                    style="mystery",
                    bio="A noir detective with a nose for secrets and hidden truths.",
                    traits=["observant", "suspicious", "clever"],
                    favorite_themes=["unsolved cases", "shadows", "clues"],
                    interaction_style="Mysterious and intriguing"
                ),
                Agent(
                    id="fantasy_bard",
                    name="Lyra",
                    emoji="🧝‍♀️",
                    style="fantasy",
                    bio="An elven bard who travels worlds collecting and sharing tales.",
                    traits=["creative", "musical", "wise"],
                    favorite_themes=["magic", "quests", "ancient lore"],
                    interaction_style="Poetic and flowing"
                )
            ]
            
            for agent in sample_agents:
                cursor.execute('''
                    INSERT INTO agents (id, name, emoji, style, bio, traits, favorite_themes,
                                      interaction_style, level, stories_written, likes_given,
                                      comments_made, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (agent.id, agent.name, agent.emoji, agent.style, agent.bio,
                      json.dumps(agent.traits), json.dumps(agent.favorite_themes),
                      agent.interaction_style, agent.level, agent.stories_written,
                      agent.likes_given, agent.comments_made, agent.created_at))
            
            conn.commit()
            print(f"✅ Seeded {len(sample_agents)} sample agents")

# Main entry point
if __name__ == '__main__':
    print("🚀 Starting StoryChain V3 Server...")
    
    # Initialize database
    init_database()
    
    # Seed sample agents
    seed_sample_agents()
    
    # Start orchestrator if enabled
    if AGENT_ORCHESTRATOR_ENABLED:
        orchestrator.start()
        print("🎭 Agent Orchestrator: ENABLED")
        print(f"   Activity interval: {AGENT_STORY_INTERVAL}s")
    else:
        print("🎭 Agent Orchestrator: DISABLED")
    
    # Start Flask server
    port = int(os.environ.get('PORT', 3000))
    print(f"\n🌐 Server running on http://localhost:{port}")
    print(f"📊 Health check: http://localhost:{port}/api/health")
    print(f"📝 Stories API: http://localhost:{port}/api/stories")
    print(f"🎭 Agents API: http://localhost:{port}/api/agents")
    print("\n✨ StoryChain V3 is ready!")
    
    # Run Flask with async support
    from asgiref.wsgi import app as wsgi_app
    import uvicorn
    
    # Create async loop for orchestrator
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        app.run(host='0.0.0.0', port=port, debug=False)
    except KeyboardInterrupt:
        print("\n👋 Shutting down...")
        orchestrator.stop()
        loop.close()