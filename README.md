# StoryChain - Collaborative Storytelling Platform

A multi-LLM collaborative storytelling platform where users create stories and contribute to community tales using various AI models.

## Features Built

### 1. Story Feed/Browse Page (`src/pages/StoryFeed.tsx`)
- **Discover stories** from the community
- **Filter by**: All, Completed, Ongoing, My Stories
- **Sort by**: Newest, Trending, Most Liked, Most Contributions
- **Search** by title and content
- **Model filter** to find stories by AI model used
- **Infinite scroll** pagination
- **Story cards** with preview, author, likes, and contribution counts

### 2. Story View Page (`src/pages/StoryView.tsx`)
- **Read full stories** with all contributions
- **Add contributions** to existing stories
- **Like/unlike stories** with real-time count updates
- **Follow authors** directly from story page
- **Share stories** via native share or clipboard
- **Character extension system** for contributions
- **Model selector** for contributions

### 3. User Profiles (`src/pages/UserProfile.tsx`)
- **User stats**: Stories count, contributions count, total likes, followers/following
- **Tab navigation**: Stories | Contributions | Liked
- **Follow/unfollow** functionality
- **Avatar** with user initial
- **Story cards** in profile view

### 4. Token Store (`src/pages/TokenStore.tsx`)
- **Token packages**: Starter (100), Popular (500+50 bonus), Pro (1000+150 bonus), Unlimited (5000+1000 bonus)
- **Current balance** display
- **Daily free tokens**: Claim 50 tokens every 24 hours
- **Transaction history**: Full audit trail of purchases, spends, and bonuses
- **Purchase simulation** (Stripe integration ready)
- **How it works** explanation section

### 5. Social Features
- **Likes system**: Users can like/unlike stories
- **Follows system**: Follow/unfollow other users
- **Trending algorithm**: Stories ranked by engagement (likes + contributions) from last 7 days
- **Feed personalization**: Filter by followed users (ready for implementation)

## API Endpoints Added

### Social Routes (`src/api/socialRoutes.ts`)
```
GET    /api/stories                     # Feed with filters, sort, pagination
GET    /api/stories/:id                 # Single story with contributions
POST   /api/stories/:id/like            # Like/unlike a story
POST   /api/stories/:id/contributions   # Add contribution to story
GET    /api/users/:id                   # User profile
GET    /api/users/:id/stories           # User's stories
GET    /api/users/:id/contributions     # User's contributions
GET    /api/users/:id/liked             # Stories liked by user
POST   /api/users/:id/follow            # Follow/unfollow user
GET    /api/trending                    # Trending stories
```

### Token Routes (`src/api/tokenRoutes.ts`)
```
GET    /api/tokens/packages             # Available token packages
POST   /api/tokens/purchase             # Purchase tokens
POST   /api/tokens/free                 # Claim daily free tokens
GET    /api/user/transactions           # Transaction history
```

## Database Schema Updates

### Social Features Tables (Migration v3)
```sql
-- Likes
CREATE TABLE likes (
    id TEXT PRIMARY KEY,
    story_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(story_id, user_id)
);

-- Follows
CREATE TABLE follows (
    id TEXT PRIMARY KEY,
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
);
```

## Components Created

### Reusable Components
- `ModelSelector` - Select AI model with availability checking
- `CharacterSlider` - Character limit with token cost calculation

### Utilities
- `useParams` - URL parameter extraction for routing
- `formatDate` - Human-readable date formatting
- `getModelColor` - Consistent model badge colors

## Architecture

### Frontend
- React 18 with hooks
- Tailwind CSS for styling
- Hash-based routing for SPA navigation
- Component-based architecture

### Backend
- Hono framework for API
- SQLite/Bun:sqlite for database
- Bearer token authentication
- Rate limiting per endpoint
- Error handling and logging

### Token Economy
- **Base**: 300 characters free
- **Extensions**: 100 characters per extension
- **Cost**: 5 tokens per extension
- **Max**: 800 total characters (5 extensions)

## File Structure
```
StoryChain/
├── src/
│   ├── pages/              # Page components
│   │   ├── StoryFeed.tsx
│   │   ├── StoryView.tsx
│   │   ├── UserProfile.tsx
│   │   ├── TokenStore.tsx
│   │   ├── CreateStory.tsx
│   │   └── Settings.tsx
│   ├── components/         # Reusable components
│   │   ├── ModelSelector.tsx
│   │   └── CharacterSlider.tsx
│   ├── api/               # API routes
│   │   ├── routes.ts      # Original routes
│   │   ├── socialRoutes.ts
│   │   └── tokenRoutes.ts
│   ├── utils/             # Utilities
│   │   └── useParams.ts
│   ├── styles/            # Global styles
│   │   └── index.css
│   ├── types/             # TypeScript types
│   │   └── index.ts
│   ├── server.ts          # Server entry
│   ├── App.tsx            # Main app with routing
│   └── main.tsx           # React entry
├── migrations/            # Database migrations
├── data/                 # SQLite database
├── index.html           # HTML entry
└── package.json
```

## Running the Application

### Development
```bash
bun run dev
```

### Production
```bash
bun run build
bun run start
```

### Database Migration
```bash
bun run migrate:v2
# Apply social features manually:
cat migrations/social-features.sql | sqlite3 data/storychain.db
```

## Environment Variables
```bash
# Required
ZO_CLIENT_IDENTITY_TOKEN=your_token

# Optional - for additional AI models
OPENROUTER_API_KEY=your_key
GROQ_API_KEY=your_key
INCEPTION_API_KEY=your_key
GOOGLE_API_KEY=your_key
```

## Commit Summary

This commit adds a complete collaborative storytelling platform with:
- 5 new pages (Feed, Story View, User Profile, Token Store, Settings)
- 3 new API route modules (Social, Token, enhanced core)
- 2 reusable components (ModelSelector, CharacterSlider)
- Full social features (likes, follows, trending)
- Token economy system
- Comprehensive routing and navigation
- Database migrations for social features
- Updated server configuration with all new endpoints
- Complete documentation

**Status**: All features implemented and ready for testing.
