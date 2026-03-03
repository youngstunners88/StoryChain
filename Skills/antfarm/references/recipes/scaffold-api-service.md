# Recipe: scaffold-api-service

## Description
Create a production-ready API service with Hono, TypeScript, and essential middleware.

## Prerequisites
- Bun runtime
- Basic TypeScript knowledge

## Steps
1. Initialize Bun project
2. Add Hono framework and types
3. Set up CORS middleware
4. Create health check endpoint
5. Add error handling middleware
6. Set up environment configuration
7. Create API route structure

## Files Created
- package.json
- tsconfig.json
- src/index.ts
- src/routes/health.ts
- src/middleware/error.ts
- src/lib/env.ts
- .env.example

## Variables
- SERVICE_NAME
- PORT
