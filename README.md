# StoryChain - Collaborative Storytelling Platform

A multi-LLM collaborative storytelling platform where users create stories and contribute to community tales using various AI models.

## 🚀 Features

### Core Features
- **Multi-LLM Support** - Choose from 8 different AI models including Kimi, Llama, Gemini, and more
- **Story Feed** - Browse, search, and filter stories from the community
- **Collaborative Writing** - Add contributions to existing stories
- **Social Features** - Like stories, follow authors, trending algorithm
- **Token Economy** - Character-based pricing with daily free tokens
- **Responsive Design** - Works on desktop and mobile

### AI Models Supported
| Model | Provider | Free Tier |
|-------|----------|-----------|
| Kimi K2.5 | Zo | ✅ Yes |
| Llama 3.1 | Groq | ✅ Yes |
| Gemma 2 | Groq | ✅ Yes |
| Mixtral 8x7B | Groq | ✅ Yes |
| Gemini Pro | Google | ✅ Yes |
| Reka Edge | OpenRouter | ❌ No |
| Qwen 2.5 | OpenRouter | ❌ No |
| Mercury 2 | Inception | ❌ No |

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

# Edit environment variables
nano .env
# Add your ZO_CLIENT_IDENTITY_TOKEN from https://kofi.zo.computer/?t=settings&s=advanced

# Start development server
bun run dev
```

Visit http://localhost:3000

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions
- [Architecture](ARCHITECTURE-v3.md) - System architecture and design
- [Security Audit](SECURITY_AUDIT_V3.md) - Security assessment report

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ZO_CLIENT_IDENTITY_TOKEN` | Yes | - | Your Zo authentication token |
| `PORT` | No | 3000 | Server port |
| `NODE_ENV` | No | development | Environment mode |
| `DATABASE_PATH` | No | ./data/storychain.db | SQLite database path |
| `LOG_DIR` | No | ./logs | Log directory |
| `LOG_LEVEL` | No | info | Log level (debug, info, warn, error) |

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

# Check health endpoint
bun run health
```

## 🏗️ Architecture

```
StoryChain/
├── src/
│   ├── api/           # API route handlers
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

- ✅ Bearer token authentication
- ✅ Rate limiting (configurable)
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection (CSP headers, React escaping)
- ✅ Timing-safe token comparison
- ✅ Input validation middleware
- ✅ Circuit breaker pattern for external APIs

See [SECURITY_AUDIT_V3.md](SECURITY_AUDIT_V3.md) for full security assessment.

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure `ZO_CLIENT_IDENTITY_TOKEN`
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

### Tokens
```
GET    /api/tokens/packages      # List token packages
POST   /api/tokens/purchase      # Purchase tokens
POST   /api/tokens/free          # Claim daily free tokens
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
