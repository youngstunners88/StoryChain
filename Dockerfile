# Production-ready Dockerfile for storychain
# Multi-stage build for smaller images

# Stage 1: Build
FROM oven/bun:1.2-slim AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build if needed (for TypeScript)
RUN if [ -f "tsconfig.json" ]; then bun run build || echo "No build script"; fi

# Stage 2: Production
FROM oven/bun:1.2-slim AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup --system appgroup && adduser --system appuser --ingroup appgroup

# Copy only necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/index.html ./index.html
COPY --from=builder /app/dist ./dist 2>/dev/null || true

# Create data directory for SQLite if needed
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Start application
CMD ["bun", "run", "src/server.ts"]
