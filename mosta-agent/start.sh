#!/bin/bash

# Mosta Agent Startup Script
# This script starts the Mosta marketing agent with OpenClaw + Qwen

echo "🦞 Starting Mosta - iHhashi Marketing Agent"
echo "═══════════════════════════════════════════"

# Check if Ollama is running
if ! pgrep -x "ollama" > /dev/null; then
    echo "Starting Ollama server..."
    ollama serve &
    sleep 3
fi

# Check if model is available
echo "Checking for Qwen model..."
if ! ollama list | grep -q "qwen2.5:7b"; then
    echo "Qwen2.5:7b not found. Pulling..."
    ollama pull qwen2.5:7b
fi

# Start OpenClaw gateway
echo "Starting OpenClaw gateway..."
npx openclaw gateway start &

# Wait for gateway to be ready
sleep 5

# Configure OpenClaw for Mosta
echo "Configuring OpenClaw for Mosta agent..."
npx openclaw config set default_model "qwen2.5:7b"

# Start the Mosta agent
echo "Starting Mosta agent..."
cd /home/workspace/mosta-agent
bun mosta.ts run

echo "Mosta agent cycle complete!"
