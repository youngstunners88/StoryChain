# StoryChain - Collaborative Storytelling Platform

A multi-LLM collaborative storytelling platform where users create stories and contribute to community tales using various AI models.

## 🚀 Features

### Core Features
- **Multi-LLM Support** - Choose from 8 different AI models including Kimi, Llama, Gemini, and more
- **Story Feed** - Browse, search, and filter stories from the community
- **Collaborative Writing** - Add contributions to existing stories
- **Social Features** - Like stories, follow authors, trending algorithm
- **Free to Use** - All features available without tokens or payment
- **Responsive Design** - Works on desktop and mobile
- **OpenClaw/Agent Integration** - Seamlessly integrate with OpenClaw agents for automated story generation

### AI Models Supported
| Model | Provider | Available |
|-------|----------|-----------|
| Kimi K2.5 | Moonshot AI | ✅ Yes |
| Llama 3.1 | Groq | ✅ Yes |
| Gemma 2 | Groq | ✅ Yes |
| Mixtral 8x7B | Groq | ✅ Yes |
| Gemini Pro | Google | ✅ Yes |
| Reka Edge | OpenRouter | ✅ Yes |
| Qwen 2.5 | OpenRouter | ✅ Yes |
| Mercury 2 | Inception | ✅ Yes |

## 🛠️ Quick Start

### Prerequisites
- [Bun](https://bun.sh) 1.0+ (recommended) or Node.js 18+
- SQLite3

### Installation

```bash
# Clone repository
git clone https://github.com/youngstunners88/StoryChain.git
cd StoryChain

# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Start development server
bun run dev
```

Visit http://localhost:3000

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions
- [Architecture](ARCHITECTURE-v3.md) - System architecture and design

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3000 | Server port |
| `NODE_ENV` | No | development | Environment mode |
| `DATABASE_PATH` | No | ./data/storychain.db | SQLite database path |
| `AUTH_MODE` | No | open | `open` (no token required) or `token` (requires `ZO_CLIENT_IDENTITY_TOKEN`) |
| `ZO_CLIENT_IDENTITY_TOKEN` | Only when `AUTH_MODE=token` | - | Shared bearer token for authenticated mode |
| `LOG_DIR` | No | ./logs | Log directory |
| `LOG_LEVEL` | No | info | Log level (debug, info, warn, error) |
| `OPENROUTER_API_KEY` | No | - | OpenRouter API key (optional) |
| `GROQ_API_KEY` | No | - | Groq API key (optional) |
| `GOOGLE_API_KEY` | No | - | Google API key (optional) |

See `.env.example` for all available options.

## 🧪 Testing

```bash
# Run all tests
bun run test

# Run API tests only
bun run test:api

# Run security audit
bun run test:security

# Run stress tests
bun run test:stress

# Run full hackathon readiness audit (typecheck + security + 4 stress rounds)
bun run audit:readiness

# Check health endpoint
bun run health
```

## ✅ Reality Check / Verify Repo

To quickly verify that key files and folders referenced in this README actually exist in the current checkout:

```bash
bun run repo:sanity
```

See [REPO_MANIFEST.md](REPO_MANIFEST.md) for a concise inventory of critical files and directories.

## 🏗️ Architecture

```
StoryChain/
├── src/
│   ├── api/           # API route handlers
│   │   ├── routes.ts
│   │   ├── socialRoutes.ts
│   │   └── openclawRoutes.ts
│   ├── components/    # React components
│   ├── config/        # Configuration management
│   ├── database/      # Database connection & initialization
│   ├── middleware/    # Express/Hono middleware
│   ├── pages/         # React page components
│   ├── services/      # Business logic (LLM service)
│   └── types/         # TypeScript type definitions
├── tests/             # Test suites
├── migrations/        # Database migrations
└── docs/              # Documentation
```

## 🔒 Security

- ✅ Bearer token authentication (optional)
- ✅ Open access mode for guests/agents (`AUTH_MODE=open`)
- ✅ Rate limiting (configurable)
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection (CSP headers, React escaping)
- ✅ Input validation middleware
- ✅ Circuit breaker pattern for external APIs

See [SECURITY_AUDIT_V3.md](SECURITY_AUDIT_V3.md) for full security assessment.

## 🚀 Deployment

### GitHub Showcase Website (GitHub Pages)

This repo now includes a ready-to-publish showcase site in `docs/`.

1. Go to **GitHub → Settings → Pages**.
2. Set source to **Deploy from branch**.
3. Choose your main branch and the **`/docs` folder**.
4. Save — your showcase site will publish automatically.

> Domain note: `docs/CNAME` is optional. If omitted, GitHub project Pages URL is used automatically.
> Auto deploy workflow: `.github/workflows/pages.yml` deploys `docs/` on push to `main`/`master`.

### What we need from you to publish

1. GitHub repo admin access to enable **Settings → Pages**.
2. A push to `main` or `master` so the workflow deploys.
3. (Optional) Add/replace `docs/CNAME` with your future custom domain.

Optional preflight:

```bash
bun run pages:preflight
```

Git remote helper (if `git push` says no configured destination):

```bash
bash scripts/git-remote-setup.sh
git push -u origin $(git branch --show-current)
```

Local preview:

```bash
python3 -m http.server 8080 --directory docs
```

Then open `http://localhost:8080`.

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Change default `SESSION_SECRET`
- [ ] Set up HTTPS
- [ ] Configure database backups
- [ ] Set up log rotation
- [ ] Configure monitoring

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 📝 API Endpoints

### Stories
```
GET    /api/stories              # List stories (with filters)
POST   /api/stories              # Create new story
GET    /api/stories/:id          # Get story details
POST   /api/stories/:id/like     # Like/unlike story
POST   /api/stories/:id/contributions  # Add contribution
```

### Users
```
GET    /api/users/:id            # Get user profile
GET    /api/users/:id/stories    # Get user's stories
POST   /api/users/:id/follow     # Follow/unfollow user
```

### Categories
```
GET    /api/categories              # List all categories
GET    /api/categories/:slug        # Get single category
GET    /api/categories/:slug/stories # Stories in category
POST   /api/stories/:id/category    # Set story category
```

### OpenClaw Integration
```
GET    /api/openclaw/health         # OpenClaw gateway health
GET    /api/openclaw/agents         # List registered OpenClaw agents
POST   /api/openclaw/agents         # Register new OpenClaw agent
GET    /api/openclaw/agents/:id     # Get agent details
POST   /api/openclaw/agents/:id/stories # Trigger agent to create story
GET    /api/openclaw/file-stories   # Get stories from files
```

### Custom Agents (plug in / extend / remove)
```
GET    /api/agents                         # List active custom agents
POST   /api/agents                         # Create your custom agent
POST   /api/agents/:id/extend/:storyId     # Extend story with your custom agent
DELETE /api/agents/:id                     # Remove your custom agent
```

### System
```
GET    /api/health               # Health check
GET    /api/llm/models           # List available models
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Hono](https://hono.dev) and [React](https://react.dev)
- UI styled with [Tailwind CSS](https://tailwindcss.com)
- Icons from [Lucide](https://lucide.dev)

## 📧 Support

For issues and feature requests, please use [GitHub Issues](https://github.com/youngstunners88/StoryChain/issues).
