# StoryChain Production Deployment Guide

This guide covers deploying StoryChain to production environments.

## Prerequisites

- Node.js 18+ or Bun 1.0+
- SQLite3
- Git
- A server with at least 1GB RAM

## Quick Start

```bash
# Clone the repository
git clone https://github.com/youngstunners88/StoryChain.git
cd StoryChain

# Install dependencies (using Bun)
bun install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Initialize database
bun run src/database/init.ts

# Build for production
bun run build

# Start the server
bun run start
```

## Environment Configuration

### Required Environment Variables

```bash
# Authentication (Required)
ZO_CLIENT_IDENTITY_TOKEN=your_token_here

# Server (Optional, defaults shown)
PORT=3000
NODE_ENV=production

# Database (Optional, defaults shown)
DATABASE_PATH=./data/storychain.db

# Logging (Optional, defaults shown)
LOG_LEVEL=warn
LOG_DIR=./logs
```

### Optional LLM Provider API Keys

```bash
# For additional AI models (all optional)
OPENROUTER_API_KEY=
INCEPTION_API_KEY=
GROQ_API_KEY=
GOOGLE_API_KEY=
```

## Deployment Options

### Option 1: Direct Server Deployment

```bash
# On your server
git clone https://github.com/youngstunners88/StoryChain.git
cd StoryChain

# Install Bun if not already installed
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Create data directory
mkdir -p data logs

# Set up environment
cp .env.example .env
# Edit .env with your settings

# Start with process manager (PM2)
npm install -g pm2
pm2 start bun --name "storychain" -- run src/server.ts
pm2 save
pm2 startup
```

### Option 2: Docker Deployment

```dockerfile
# Dockerfile
FROM oven/bun:1 as base
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
CMD ["bun", "run", "src/server.ts"]
```

```bash
# Build and run
docker build -t storychain .
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  -e ZO_CLIENT_IDENTITY_TOKEN=your_token \
  --name storychain \
  storychain
```

### Option 3: Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# Set environment variables
railway variables set ZO_CLIENT_IDENTITY_TOKEN=your_token
railway variables set NODE_ENV=production
```

### Option 4: Render Deployment

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `bun install`
4. Set start command: `bun run src/server.ts`
5. Add environment variables in the dashboard

## SSL/HTTPS Configuration

### Using Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/storychain
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Using Caddy (Automatic HTTPS)

```caddyfile
# Caddyfile
yourdomain.com {
    reverse_proxy localhost:3000
}
```

## Database Backup Strategy

### Automated Backups

```bash
#!/bin/bash
# backup.sh - Run daily via cron

BACKUP_DIR="/backups/storychain"
DATE=$(date +%Y%m%d_%H%M%S)
DB_PATH="./data/storychain.db"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
sqlite3 $DB_PATH ".backup '$BACKUP_DIR/backup_$DATE.db'"

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.db

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.db.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.db.gz"
```

Add to crontab:
```bash
0 2 * * * /path/to/backup.sh >> /var/log/storychain-backup.log 2>&1
```

## Monitoring

### Health Check Endpoint

```bash
# Check if service is healthy
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-16T12:00:00.000Z",
  "database": "connected",
  "version": "2.0.0",
  "environment": "production"
}
```

### Log Monitoring

```bash
# View logs in real-time
tail -f logs/api-errors.jsonl

# View with jq for formatted output
tail -f logs/api-errors.jsonl | jq '.'
```

## Security Checklist

- [ ] Change default session secret
- [ ] Enable HTTPS
- [ ] Set secure database file permissions (chmod 600)
- [ ] Configure firewall (allow only 80/443)
- [ ] Set up rate limiting (built-in, configure in .env)
- [ ] Enable CORS only for allowed origins
- [ ] Set up automated backups
- [ ] Configure log rotation
- [ ] Set up monitoring/alerting
- [ ] Keep dependencies updated

## Performance Tuning

### Database Optimization

```sql
-- Run periodically to optimize SQLite
VACUUM;
ANALYZE;
```

### Rate Limiting Configuration

```bash
# In .env - adjust based on your traffic
RATE_LIMIT_GENERAL=100
RATE_LIMIT_CREATE_STORY=10
RATE_LIMIT_AUTH=5
```

## Troubleshooting

### Database Locked Errors

```bash
# Check for WAL mode
sqlite3 data/storychain.db "PRAGMA journal_mode;"

# Should return "wal"
```

### High Memory Usage

- Reduce rate limit windows
- Enable log rotation
- Monitor with `pm2 monit`

### SSL Certificate Issues

```bash
# Test SSL configuration
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

## Updating

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
bun install

# Restart the service
pm2 restart storychain
```

## Support

For issues and questions:
- GitHub Issues: https://github.com/youngstunners88/StoryChain/issues
- Documentation: See README.md
