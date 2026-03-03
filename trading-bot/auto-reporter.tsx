#!/usr/bin/env tsx
import { sendTelegramMessage } from './telegram-reporter';
import * as fs from 'fs';

async function generateReport() {
  const tradingLog = fs.readFileSync('/tmp/trading.log', 'utf8');
  const outreachLog = fs.readFileSync('/tmp/outreach.log', 'utf8');
  
  // Parse trading data
  const trades = (tradingLog.match(/EXECUTED/g) || []).length;
  const profitMatch = tradingLog.match(/Est\. Profit: \$([0-9.-]+)/);
  const profit = profitMatch ? profitMatch[1] : '0';
  
  // Parse outreach data
  const pipelineMatch = outreachLog.match(/Pipeline Value: R([0-9,]+)/);
  const pipeline = pipelineMatch ? pipelineMatch[1] : '0';
  
  await sendTelegramMessage(`
⏰ 3-HOUR AUTONOMOUS REPORT
━━━━━━━━━━━━━━━━━━━━━━

📊 TRADING BOT
• Trades: ${trades}
• Profit: $${profit}
• Status: Active

📧 OUTREACH BOT
• Pipeline: R${pipeline}
• Status: Active

🤖 Next report: +3 hours
  `);
}

// Run every 3 hours
setInterval(generateReport, 3 * 60 * 60 * 1000);

// Initial report
generateReport();
