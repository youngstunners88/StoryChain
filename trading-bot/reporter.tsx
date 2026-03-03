#!/usr/bin/env tsx
import { sendTelegramMessage } from './telegram';

async function report() {
  // Read trading log
  const fs = require('fs');
  const log = fs.readFileSync('/tmp/trading.log', 'utf8');
  
  // Parse results
  const trades = (log.match(/TRADE/g) || []).length;
  const profit = log.match(/Profit: \$([0-9.]+)/)?.[1] || '0';
  
  await sendTelegramMessage(`
📊 3-HOUR TRADING REPORT
━━━━━━━━━━━━━━━━━━━
✅ Trades executed: ${trades}
💰 Current profit: $${profit}
📈 Status: Active

Next report in 3 hours.
  `);
}

// Report every 3 hours
setInterval(report, 3 * 60 * 60 * 1000);
report(); // First report immediately
