import TelegramBot from "node-telegram-bot-api";
import { MetaAdsKit } from "./meta-ads-kit";

const BOT_TOKEN = process.env.NULLCLAW_BOT_TOKEN || "8750878083:AAF8EjXCPfy3n9NZhPQWpW3aiPNJeSEUYwY";

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const adsKit = new MetaAdsKit();

// Conversation state
const userContext: Map<number, { lastTopic?: string; lastAdId?: string }> = new Map();

console.log("🤖 NullClaw Meta Ads Bot is running...");

// Natural language patterns
const patterns = {
  greeting: /^(hi|hello|hey|howdy|sup|yo|good morning|good evening|good afternoon)/i,
  performance: /(how|what).*(performing|doing|going|results|stats)/i,
  problems: /(problem|issue|wrong|bad|not working|struggling|help)/i,
  fatigue: /(tired|fatigue|stale|old|boring|refresh)/i,
  bleeding: /(bleed|wasting|losing money|expensive|cost too much)/i,
  budget: /(budget|spend|spending|money|cost|allocate)/i,
  creative: /(creative|ad copy|copy|headline|hook|text)/i,
  thanks: /(thanks|thank you|thx|appreciate)/i,
  pause: /(pause|stop|turn off|kill|end)\s*(\d+|[a-z_]+)/i,
};

// Start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  userContext.set(chatId, {});
  
  await bot.sendMessage(chatId, 
`Hey! I'm NullClaw, your Meta Ads buddy.

Think of me as that friend who actually understands Facebook ads and isn't trying to sell you a course. I can look at your ad performance, spot what's wasting money, suggest budget moves, or help you brainstorm copy.

What's going on with your ads today? You can just talk to me normally - no need for commands if you don't want.`
  );
});

// Quick commands (still work, but feel natural)
bot.onText(/\/analyse|\/analyze/, async (msg) => {
  const chatId = msg.chat.id;
  
  await bot.sendMessage(chatId, "Lemme take a look at everything...");
  
  try {
    const analysis = await adsKit.runFullAnalysis();
    const topAd = analysis.topPerformers[0];
    
    let message = `Alright, here's what I'm seeing:\n\n`;
    
    if (topAd) {
      message += `Your star performer right now is "${topAd.name}" with a ${topAd.roas.toFixed(2)}x ROAS. That's the one to learn from.\n\n`;
    }
    
    const issues = analysis.fatiguedAds.length + analysis.bleeders.length;
    if (issues > 0) {
      message += `But I've got ${analysis.fatiguedAds.length} ads that look tired and ${analysis.bleeders.length} that are bleeding cash. Want me to break those down?\n\n`;
    } else {
      message += `Honestly, things look pretty clean right now. No major red flags.\n\n`;
    }
    
    if (analysis.budgetSuggestions.length > 0) {
      message += `Oh, and I think you could move some budget around for better returns. Ask me about budget if you want specifics.`;
    }
    
    await bot.sendMessage(chatId, message);
  } catch (error: any) {
    await bot.sendMessage(chatId, `Hmm, ran into an issue: ${error.message}. Might be the API acting up.`);
  }
});

// Fatigue check
bot.onText(/\/fatigue/, async (msg) => {
  const chatId = msg.chat.id;
  
  await bot.sendMessage(chatId, "Checking which ads have lost their spark...");
  
  try {
    const fatigued = await adsKit.detectFatigue();
    
    if (fatigued.length === 0) {
      await bot.sendMessage(chatId, "Good news - your ads still seem fresh. CTRs are holding up and I'm not seeing the usual fatigue signs.");
      return;
    }
    
    let message = `Found ${fatigued.length} ads that are looking tired:\n\n`;
    
    fatigued.slice(0, 4).forEach((ad: any) => {
      message += `"${ad.name}" — ROAS dropped from ${ad.previousRoas?.toFixed(2) || "?"}x to ${ad.roas.toFixed(2)}x`;
      if (ad.ctrDrop) message += `, CTR down ${ad.ctrDrop.toFixed(1)}%`;
      message += `\n`;
    });
    
    message += `\nThese are probably due for a creative refresh. Same audience has seen them too many times. Want copy ideas for fresh versions?`;
    
    await bot.sendMessage(chatId, message);
  } catch (error: any) {
    await bot.sendMessage(chatId, `Ran into a problem: ${error.message}`);
  }
});

// Bleeders check
bot.onText(/\/bleeders|\/bleeder/, async (msg) => {
  const chatId = msg.chat.id;
  
  await bot.sendMessage(chatId, "Looking for ads that are burning money...");
  
  try {
    const bleeders = await adsKit.findBleeders();
    
    if (bleeders.length === 0) {
      await bot.sendMessage(chatId, "Nice! Nothing's bleeding right now. Your ROAS targets are being met across the board.");
      return;
    }
    
    let message = `Found ${bleeders.length} ads that aren't pulling their weight:\n\n`;
    
    let totalLoss = 0;
    bleeders.slice(0, 4).forEach((ad: any) => {
      const loss = ad.spend - ad.revenue;
      totalLoss += loss;
      message += `"${ad.name}" — spent $${ad.spend.toFixed(2)}, made $${ad.revenue.toFixed(2)}. That's $${loss.toFixed(2)} down.\n`;
    });
    
    message += `\nTotal that could be better spent: $${totalLoss.toFixed(2)}. Tell me "pause [ad ID]" if you want to stop any of these.`;
    
    await bot.sendMessage(chatId, message);
  } catch (error: any) {
    await bot.sendMessage(chatId, `Problem: ${error.message}`);
  }
});

// Budget suggestions
bot.onText(/\/budget/, async (msg) => {
  const chatId = msg.chat.id;
  
  await bot.sendMessage(chatId, "Crunching the numbers on your budget...");
  
  try {
    const suggestions = await adsKit.getBudgetSuggestions();
    
    if (suggestions.length === 0) {
      await bot.sendMessage(chatId, "Your budget allocation actually looks pretty solid right now. Nothing screaming to be changed.");
      return;
    }
    
    let message = `Here's what I'd consider:\n\n`;
    
    suggestions.forEach((s: any) => {
      if (s.action === "increase") {
        message += `Bump "${s.campaignName}" from $${s.currentBudget} to $${s.suggestedBudget}/day. ${s.reason}\n\n`;
      } else {
        message += `Pull back on "${s.campaignName}" — $${s.currentBudget} down to $${s.suggestedBudget}/day. ${s.reason}\n\n`;
      }
    });
    
    message += `This is based on recent performance trends. Your call on whether to pull the trigger.`;
    
    await bot.sendMessage(chatId, message);
  } catch (error: any) {
    await bot.sendMessage(chatId, `Issue: ${error.message}`);
  }
});

// Copy ideas
bot.onText(/\/copy/, async (msg) => {
  const chatId = msg.chat.id;
  
  await bot.sendMessage(chatId, "Let me think up some fresh angles...");
  
  try {
    const ideas = await adsKit.generateCopyIdeas();
    
    if (ideas.length === 0) {
      await bot.sendMessage(chatId, "Hmm, couldn't generate ideas right now. The creative engine might need a minute.");
      return;
    }
    
    let message = `Here's what I came up with:\n\n`;
    
    ideas.slice(0, 4).forEach((idea: any, i: number) => {
      message += `${i + 1}. ${idea.hook}\n${idea.body}\n[${idea.cta}]\n\n`;
    });
    
    message += `Test these as starting points. The hook is the most important part - if they don't stop scrolling, the rest doesn't matter.`;
    
    await bot.sendMessage(chatId, message);
  } catch (error: any) {
    await bot.sendMessage(chatId, `Problem: ${error.message}`);
  }
});

// Hooks
bot.onText(/\/hooks/, async (msg) => {
  const chatId = msg.chat.id;
  
  const hooks = [
    "They said it was impossible...",
    "While you're reading this, your competitors are...",
    "The secret that [industry] doesn't want you to know",
    "Stop scrolling if you...",
    "This changed everything for [audience]",
    "3 mistakes killing your [goal]",
    "Finally, a solution that actually works",
    "How I turned $X into $Y in Z days",
    "You won't believe what happened when...",
    "The exact blueprint that generated [result]"
  ];
  
  let message = `Some hook templates that tend to work:\n\n`;
  
  hooks.forEach((hook, i) => {
    message += `${i + 1}. ${hook}\n`;
  });
  
  message += `\nThe best hooks create curiosity or hit a pain point. Make them want to know what happens next.`;
  
  await bot.sendMessage(chatId, message);
});

// Pause ad
bot.onText(/\/pause (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const adId = match?.[1];
  
  if (!adId) {
    await bot.sendMessage(chatId, "Which ad? Give me the ID.");
    return;
  }
  
  await bot.sendMessage(chatId, `Pausing ${adId}...`);
  
  try {
    await adsKit.pauseAd(adId);
    await bot.sendMessage(chatId, `Done. Ad ${adId} is off. The bleeding stops here.`);
  } catch (error: any) {
    await bot.sendMessage(chatId, `Couldn't pause it: ${error.message}`);
  }
});

// Daily report
bot.onText(/\/report/, async (msg) => {
  const chatId = msg.chat.id;
  
  await bot.sendMessage(chatId, "Pulling today's numbers...");
  
  try {
    const report = await adsKit.getDailyReport();
    
    const profit = report.totalRevenue - report.totalSpend;
    const profitEmoji = profit >= 0 ? "👍" : "😟";
    
    let message = `Today so far:\n\n`;
    message += `Spent: $${report.totalSpend.toFixed(2)}\n`;
    message += `Made: $${report.totalRevenue.toFixed(2)}\n`;
    message += `Net: $${profit.toFixed(2)} ${profitEmoji}\n`;
    message += `ROAS: ${report.roas.toFixed(2)}x across ${report.orders} orders\n\n`;
    
    if (report.topAd) {
      message += `Best performer: "${report.topAd.name}" (${report.topAd.roas.toFixed(2)}x)\n`;
    }
    if (report.worstAd) {
      message += `Weakest link: "${report.worstAd.name}" (${report.worstAd.roas.toFixed(2)}x)\n`;
    }
    
    if (report.actionsNeeded > 0) {
      message += `\n${report.actionsNeeded} things need your attention. Want me to tell you what?`;
    }
    
    await bot.sendMessage(chatId, message);
  } catch (error: any) {
    await bot.sendMessage(chatId, `Issue: ${error.message}`);
  }
});

// Spend check
bot.onText(/\/spend/, async (msg) => {
  const chatId = msg.chat.id;
  
  try {
    const spend = await adsKit.getTodaySpend();
    const percentUsed = ((spend.total / spend.budget) * 100).toFixed(0);
    
    let message = `Today's burn: $${spend.total.toFixed(2)} of $${spend.budget.toFixed(2)} budget.\n`;
    message += `That's ${percentUsed}% used, $${(spend.budget - spend.total).toFixed(2)} left.\n`;
    
    if (parseInt(percentUsed) > 80) {
      message += `\nHeads up - you're running low on budget for today.`;
    } else if (parseInt(percentUsed) < 30) {
      message += `\nPacing behind - got plenty of room if you want to push.`;
    }
    
    await bot.sendMessage(chatId, message);
  } catch (error: any) {
    await bot.sendMessage(chatId, `Problem: ${error.message}`);
  }
});

// Natural conversation handler
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text || "";
  
  // Skip commands
  if (text.startsWith("/")) return;
  
  const ctx = userContext.get(chatId) || {};
  
  // Greeting
  if (patterns.greeting.test(text)) {
    const greetings = [
      "Hey! What's up with your ads today?",
      "Yo! How can I help with the Meta Ads stuff?",
      "Hey there - any ad fires to put out?",
      "What's good? Got questions about your campaigns?"
    ];
    await bot.sendMessage(chatId, greetings[Math.floor(Math.random() * greetings.length)]);
    return;
  }
  
  // Performance questions
  if (patterns.performance.test(text)) {
    try {
      const analysis = await adsKit.runFullAnalysis();
      const avgRoas = analysis.avgRoas || 0;
      
      let response = "";
      if (avgRoas > 3) {
        response = `Looking good! Your average ROAS is ${avgRoas.toFixed(2)}x right now. `;
      } else if (avgRoas > 1.5) {
        response = `You're at ${avgRoas.toFixed(2)}x ROAS - solid but there's room to improve. `;
      } else {
        response = `Currently sitting at ${avgRoas.toFixed(2)}x ROAS. Not great, honestly. `;
      }
      
      if (analysis.topPerformers[0]) {
        response += `"${analysis.topPerformers[0].name}" is your best bet right now.`;
      }
      
      await bot.sendMessage(chatId, response);
    } catch (error: any) {
      await bot.sendMessage(chatId, "Had trouble pulling your performance data. API might be acting up.");
    }
    return;
  }
  
  // Problems
  if (patterns.problems.test(text)) {
    try {
      const analysis = await adsKit.runFullAnalysis();
      const issues = [];
      
      if (analysis.bleeders.length > 0) issues.push(`${analysis.bleeders.length} ads losing money`);
      if (analysis.fatiguedAds.length > 0) issues.push(`${analysis.fatiguedAds.length} fatigued ads`);
      
      if (issues.length === 0) {
        await bot.sendMessage(chatId, "Honestly, I'm not seeing major issues right now. What specific problem are you running into?");
      } else {
        await bot.sendMessage(chatId, `Here's what I'm seeing: ${issues.join(", ")}. Want me to break it down?`);
      }
    } catch (error: any) {
      await bot.sendMessage(chatId, "Let me know what's going on and I'll try to help.");
    }
    return;
  }
  
  // Fatigue mentions
  if (patterns.fatigue.test(text)) {
    await bot.sendMessage(chatId, "Let me check which ads are looking stale...", { disable_notification: true });
    // Trigger fatigue check
    const fatigued = await adsKit.detectFatigue();
    if (fatigued.length === 0) {
      await bot.sendMessage(chatId, "Your ads actually seem fine in terms of freshness. What's making you think they're tired?");
    } else {
      let message = `Yeah, I see ${fatigued.length} ads that are showing fatigue signs:\n`;
      fatigued.slice(0, 3).forEach((ad: any) => {
        message += `• "${ad.name}" — ROAS dropped to ${ad.roas.toFixed(2)}x\n`;
      });
      message += `\nTime to refresh the creative on these.`;
      await bot.sendMessage(chatId, message);
    }
    return;
  }
  
  // Bleeding mentions
  if (patterns.bleeding.test(text)) {
    const bleeders = await adsKit.findBleeders();
    if (bleeders.length === 0) {
      await bot.sendMessage(chatId, "Good news - I don't see any ads bleeding cash right now. Your performance targets are being met.");
    } else {
      let message = `Found ${bleeders.length} ads that are underwater:\n`;
      bleeders.slice(0, 3).forEach((ad: any) => {
        message += `• "${ad.name}" — down $${(ad.spend - ad.revenue).toFixed(2)}\n`;
      });
      message += `\nWant me to pause any of these?`;
      await bot.sendMessage(chatId, message);
    }
    return;
  }
  
  // Budget mentions
  if (patterns.budget.test(text)) {
    const suggestions = await adsKit.getBudgetSuggestions();
    if (suggestions.length === 0) {
      await bot.sendMessage(chatId, "Your budget setup looks pretty balanced right now. Nothing screaming to be changed.");
    } else {
      await bot.sendMessage(chatId, `I've got ${suggestions.length} budget suggestions. Want to see them? Say "budget" or use /budget for the full breakdown.`);
    }
    return;
  }
  
  // Creative/copy mentions
  if (patterns.creative.test(text)) {
    await bot.sendMessage(chatId, "Need fresh ad copy? I can brainstorm some ideas - just say /copy or ask for hooks with /hooks.");
    return;
  }
  
  // Thanks
  if (patterns.thanks.test(text)) {
    const responses = [
      "Anytime! That's what I'm here for.",
      "No problem. Hit me up whenever.",
      "You got it. Let me know if anything else comes up.",
      "Glad I could help!"
    ];
    await bot.sendMessage(chatId, responses[Math.floor(Math.random() * responses.length)]);
    return;
  }
  
  // Pause mention
  const pauseMatch = text.match(patterns.pause);
  if (pauseMatch) {
    const adId = pauseMatch[2];
    if (adId) {
      try {
        await adsKit.pauseAd(adId);
        await bot.sendMessage(chatId, `Done. Ad ${adId} is paused.`);
      } catch (error: any) {
        await bot.sendMessage(chatId, `Couldn't pause that ad: ${error.message}`);
      }
      return;
    }
  }
  
  // Default - conversational fallback
  const fallbacks = [
    "What's on your mind about your ads? I can check performance, find problems, or help with copy.",
    "How can I help? I can look at your campaigns, spot issues, or brainstorm ad ideas.",
    "Tell me what you need - performance check, budget analysis, creative ideas, whatever.",
    "I'm here for your ad questions. What do you want to know?"
  ];
  
  await bot.sendMessage(chatId, fallbacks[Math.floor(Math.random() * fallbacks.length)]);
});

// Error handling
bot.on("polling_error", (error) => {
  console.error("Polling error:", error);
});
