#!/bin/bash
# ============================================================
# Claude Code - AI Coding Agent via OpenRouter
# ============================================================
# Uses your OpenRouter API key from Zo secrets
# Context: CLAUDE.md with all skills documentation
# ============================================================

cd /home/workspace

# Load secrets
if [ -f /home/.z/secrets.env ]; then
    source /home/.z/secrets.env
fi

echo "🖥️  Claude Code via OpenRouter"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Provider: OpenRouter"
echo "Model: ${ANTHROPIC_MODEL:-anthropic/claude-sonnet-4}"
echo "Skills: $(find /home/workspace/Skills -maxdepth 2 -name 'SKILL.md' | wc -l) available"
echo "Context: CLAUDE.md"
echo ""

# Run Claude Code
exec claude "$@"
