#!/bin/bash
# Start all autonomous systems

echo "🤖 STARTING AUTONOMOUS SYSTEMS..."
echo "================================"

# Start trading bot
echo "📈 Starting Trading Bot..."
npx tsx autonomous-trader.ts &
TRADING_PID=$!

# Start outreach engine
echo "🚀 Starting Outreach Engine..."
npx tsx outreach-engine.ts &
OUTREACH_PID=$!

echo ""
echo "✅ SYSTEMS RUNNING:"
echo "   Trading Bot PID: $TRADING_PID"
echo "   Outreach Engine PID: $OUTREACH_PID"
echo ""
echo "💰 Monitor logs:"
echo "   tail -f /tmp/trading.log"
echo "   tail -f /tmp/outreach.log"
echo ""
echo "Press Ctrl+C to stop all"

# Keep alive
wait
