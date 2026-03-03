#!/bin/bash
# Setup script for Claude Code and OpenClaw with OpenRouter
# Run this after adding OPENROUTER_API_KEY to Zo secrets

set -e

echo "🚀 Setting up Claude Code and OpenClaw with OpenRouter..."

# Load secrets
SECRETS_FILE="/home/.z/secrets.json"
if [ ! -f "$SECRETS_FILE" ]; then
    echo "❌ No secrets file found at $SECRETS_FILE"
    exit 1
fi

# Check for OpenRouter API key
OPENROUTER_KEY=$(cat "$SECRETS_FILE" | jq -r '.OPENROUTER_API_KEY // empty')
if [ -z "$OPENROUTER_KEY" ]; then
    echo "❌ OPENROUTER_API_KEY not found in secrets"
    echo ""
    echo "Please add your OpenRouter API key:"
    echo "1. Go to https://openrouter.ai/keys"
    echo "2. Create a key (starts with sk-or-)"
    echo "3. Add to Zo secrets at Settings > Advanced"
    echo ""
    echo "Or run: echo '{\"OPENROUTER_API_KEY\": \"sk-or-your-key\"}' | jq -s '.[0] * input' /home/.z/secrets.json - > /tmp/secrets.json && mv /tmp/secrets.json /home/.z/secrets.json"
    exit 1
fi

echo "✅ Found OpenRouter API key"

# ============================================
# Setup OpenClaw
# ============================================
echo ""
echo "🦞 Configuring OpenClaw..."

OPENCLAW_CONFIG="$HOME/.openclaw/openclaw.json"

# Create OpenRouter provider config
cat "$OPENCLAW_CONFIG" | jq '
  .models.providers.openrouter = {
    "baseUrl": "https://openrouter.ai/api/v1",
    "apiKey": "'"$OPENROUTER_KEY"'",
    "api": "openai-completions",
    "models": [
      {
        "id": "anthropic/claude-sonnet-4",
        "name": "Claude Sonnet 4 (via OpenRouter)",
        "api": "openai-completions",
        "reasoning": false,
        "input": ["text", "image"],
        "cost": {"input": 3, "output": 15, "cacheRead": 0, "cacheWrite": 0},
        "contextWindow": 200000,
        "maxTokens": 8192
      },
      {
        "id": "anthropic/claude-3.5-sonnet",
        "name": "Claude 3.5 Sonnet (via OpenRouter)",
        "api": "openai-completions",
        "reasoning": false,
        "input": ["text", "image"],
        "cost": {"input": 3, "output": 15, "cacheRead": 0, "cacheWrite": 0},
        "contextWindow": 200000,
        "maxTokens": 8192
      },
      {
        "id": "openai/gpt-4.1",
        "name": "GPT-4.1 (via OpenRouter)",
        "api": "openai-completions",
        "reasoning": false,
        "input": ["text", "image"],
        "cost": {"input": 2, "output": 8, "cacheRead": 0, "cacheWrite": 0},
        "contextWindow": 128000,
        "maxTokens": 16384
      },
      {
        "id": "google/gemini-2.0-flash-exp",
        "name": "Gemini 2.0 Flash (via OpenRouter)",
        "api": "openai-completions",
        "reasoning": false,
        "input": ["text", "image"],
        "cost": {"input": 0.1, "output": 0.4, "cacheRead": 0, "cacheWrite": 0},
        "contextWindow": 1000000,
        "maxTokens": 8192
      },
      {
        "id": "deepseek/deepseek-chat",
        "name": "DeepSeek Chat (via OpenRouter)",
        "api": "openai-completions",
        "reasoning": false,
        "input": ["text"],
        "cost": {"input": 0.14, "output": 0.28, "cacheRead": 0, "cacheWrite": 0},
        "contextWindow": 64000,
        "maxTokens": 8192
      },
      {
        "id": "meta-llama/llama-3.1-70b-instruct",
        "name": "Llama 3.1 70B (via OpenRouter)",
        "api": "openai-completions",
        "reasoning": false,
        "input": ["text"],
        "cost": {"input": 0.52, "output": 0.75, "cacheRead": 0, "cacheWrite": 0},
        "contextWindow": 128000,
        "maxTokens": 8192
      },
      {
        "id": "qwen/qwen-2.5-coder-32b-instruct",
        "name": "Qwen 2.5 Coder 32B (via OpenRouter)",
        "api": "openai-completions",
        "reasoning": false,
        "input": ["text"],
        "cost": {"input": 0.18, "output": 0.18, "cacheRead": 0, "cacheWrite": 0},
        "contextWindow": 128000,
        "maxTokens": 8192
      }
    ]
  }
' > /tmp/openclaw-config.json && mv /tmp/openclaw-config.json "$OPENCLAW_CONFIG"

echo "✅ OpenClaw configured with OpenRouter"

# Set default model
npx openclaw models set openrouter/anthropic/claude-sonnet-4 2>/dev/null || true

# ============================================
# Setup Claude Code
# ============================================
echo ""
echo "🖥️ Configuring Claude Code..."

# Create Claude Code config directory
mkdir -p ~/.claude

# Create settings.json for Claude Code with OpenRouter
cat > ~/.claude/settings.json << 'EOF'
{
  "apiProvider": "anthropic",
  "apiBaseUrl": "https://openrouter.ai/api/v1",
  "defaultModel": "anthropic/claude-sonnet-4",
  "permissions": {
    "allow": [
      "Bash(*)",
      "Read(*)",
      "Edit(*)",
      "Write(*)"
    ]
  }
}
EOF

echo "✅ Claude Code configured with OpenRouter"

# ============================================
# Create environment file for both tools
# ============================================
echo ""
echo "📝 Creating environment file..."

cat > /home/workspace/.ai-env << EOF
# OpenRouter Configuration
export ANTHROPIC_API_KEY="$OPENROUTER_KEY"
export ANTHROPIC_BASE_URL="https://openrouter.ai/api/v1"
export OPENROUTER_API_KEY="$OPENROUTER_KEY"

# Default models
export CLAUDE_MODEL="anthropic/claude-sonnet-4"
export OPENCLAW_MODEL="openrouter/anthropic/claude-sonnet-4"
EOF

echo "✅ Environment file created at /home/workspace/.ai-env"

# ============================================
# Summary
# ============================================
echo ""
echo "============================================"
echo "✅ Setup complete!"
echo "============================================"
echo ""
echo "🦞 OpenClaw:"
echo "   Run: npx openclaw"
echo "   Model: openrouter/anthropic/claude-sonnet-4"
echo "   List models: npx openclaw models list"
echo ""
echo "🖥️ Claude Code:"
echo "   Run: source /home/workspace/.ai-env && claude"
echo "   Or: claude --model anthropic/claude-sonnet-4"
echo ""
echo "📚 Skills are documented in /home/workspace/CLAUDE.md"
echo "   $(find /home/workspace/Skills -maxdepth 2 -name 'SKILL.md' | wc -l) skills available"
