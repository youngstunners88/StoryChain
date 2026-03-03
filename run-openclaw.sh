#!/bin/bash
# ============================================================
# OpenClaw - FREE AI Coding Agent
# ============================================================
# Runs on BlockRun (free weekly allowance) or Ollama (local)
# 65 skills linked from ~/workspace/Skills
# ============================================================

cd /home/workspace

echo "🦞 OpenClaw - Free AI Coding Agent"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Provider: BlockRun (free tier)"
echo "Models: Claude, GPT-5, DeepSeek, Grok, Gemini..."
echo "Skills: $(find ~/.openclaw/skills -maxdepth 1 -type l 2>/dev/null | wc -l) linked"
echo ""

# Start gateway if not running
if ! pgrep -f "openclaw-gateway" > /dev/null; then
    echo "Starting OpenClaw gateway..."
    nohup npx openclaw gateway --port 19001 > /tmp/openclaw-gateway.log 2>&1 &
    sleep 3
fi

# Run OpenClaw interactively
exec npx openclaw --cwd /home/workspace "$@"
