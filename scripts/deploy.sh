#!/bin/bash
set -e

# storychain Deployment Script
# Usage: ./scripts/deploy.sh [environment]

ENVIRONMENT=${1:-production}
SERVICE_NAME="storychain"
PORT=3000
HEALTH_URL="http://localhost:${PORT}/health"
MAX_RETRIES=30
RETRY_DELAY=2

echo "🚀 Starting deployment for ${SERVICE_NAME} to ${ENVIRONMENT}"

# Pre-deployment checks
echo "📋 Running pre-deployment checks..."

# Check if required env vars are set
if [ -f ".env.${ENVIRONMENT}" ]; then
    echo "✅ Environment file found"
else
    echo "⚠️ No .env.${ENVIRONMENT} file found, using defaults"
fi

# Build and start
echo "🔨 Building and starting containers..."
docker-compose build --no-cache
docker-compose up -d

# Health check
echo "🏥 Running health checks..."
RETRIES=0
while [ $RETRIES -lt $MAX_RETRIES ]; do
    if curl -sf ${HEALTH_URL} > /dev/null 2>&1; then
        echo "✅ Health check passed!"
        break
    fi
    
    RETRIES=$((RETRIES + 1))
    echo "  Attempt ${RETRIES}/${MAX_RETRIES}: Waiting for service..."
    sleep ${RETRY_DELAY}
done

if [ $RETRIES -eq $MAX_RETRIES ]; then
    echo "❌ Health check failed after ${MAX_RETRIES} attempts"
    echo "🔄 Rolling back..."
    ./scripts/rollback.sh
    exit 1
fi

echo "✅ Deployment successful!"
echo "📊 Service is running at: http://localhost:${PORT}"

# Cleanup old images
echo "🧹 Cleaning up old Docker images..."
docker image prune -f --filter "label=service=${SERVICE_NAME}"

echo "🎉 All done!"
