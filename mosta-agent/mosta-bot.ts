#!/usr/bin/env bun

// MarketingClawBot - Intelligent Telegram Bot for iHhashi
// Powered by Zo AI

import { readFileSync, existsSync } from "fs";
import { join } from "path";

const BOT_TOKEN = "8634166354:AAGmDAxJwyxwfn7ysz4dWt2O1093s-ot_kM";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const AGENT_DIR = "/home/workspace/mosta-agent";
const KNOWLEDGE_BASE_PATH = join(AGENT_DIR, "knowledge-base.json");

// Load knowledge base
function loadKnowledgeBase(): any {
  if (existsSync(KNOWLEDGE_BASE_PATH)) {
    return JSON.parse(readFileSync(KNOWLEDGE_BASE_PATH, "utf-8"));
  }
  return null;
}

const KNOWLEDGE = loadKnowledgeBase();

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name: string; username?: string };
    chat: { id: number };
    text?: string;
  };
}

async function sendMessage(chatId: number, text: string, keyboard?: any) {
  const body: any = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML"
  };
  
  if (keyboard) {
    body.reply_markup = keyboard;
  }
  
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    if (!result.ok) {
      console.error(`[ERROR] sendMessage failed:`, result);
    }
    return result;
  } catch (error) {
    console.error(`[ERROR] sendMessage exception:`, error);
    return { ok: false, error };
  }
}

async function sendTyping(chatId: number) {
  await fetch(`${TELEGRAM_API}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      action: "typing"
    })
  });
}

async function getUpdates(offset?: number): Promise<TelegramUpdate[]> {
  const url = `${TELEGRAM_API}/getUpdates?timeout=30${offset ? `&offset=${offset}` : ''}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.result || [];
}

async function askZo(prompt: string, context?: string): Promise<string> {
  const systemContext = context || `You are a helpful marketing assistant for iHhashi, a South African delivery platform for food, groceries, fresh produce, and courier services. iHhashi is NOT a taxi app - it's delivery only. Be friendly, helpful, and concise.`;
  
  try {
    const response = await fetch("https://api.zo.computer/zo/ask", {
      method: "POST",
      headers: {
        "Authorization": process.env.ZO_CLIENT_IDENTITY_TOKEN || "",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        input: `${systemContext}\n\nUser message: ${prompt}\n\nRespond naturally and helpfully. Don't use markdown formatting - just plain text.`,
        model_name: "openrouter:z-ai/glm-5"
      })
    });
    
    const data = await response.json();
    return data.output || "I'm having trouble thinking right now. Please try again.";
  } catch (error) {
    console.error("Zo API error:", error);
    return "Sorry, I'm having some technical issues. Please try again in a moment.";
  }
}

async function handleMessage(update: TelegramUpdate) {
  if (!update.message) return;
  
  const chatId = update.message.chat.id;
  const text = update.message.text || "";
  const username = update.message.from.username || update.message.from.first_name;
  
  console.log(`[${new Date().toISOString()}] Message from ${username} (chatId: ${chatId}): ${text}`);
  
  // Handle /start
  if (text.startsWith("/start")) {
    await sendMessage(chatId,
      `Hey! 👋\n\n` +
      `I'm your MarketingClaw Bot for iHhashi.\n\n` +
      `I can help you with:\n` +
      `• Content ideas\n` +
      `• Marketing advice\n` +
      `• Brand questions\n` +
      `• General assistance\n\n` +
      `Just talk to me like a normal person - no commands needed!`
    );
    return;
  }
  
  // For everything else, use AI
  await sendTyping(chatId);
  
  const knowledgeContext = KNOWLEDGE 
    ? `Context about iHhashi: ${JSON.stringify(KNOWLEDGE).slice(0, 2000)}`
    : "";
  
  const response = await askZo(text, knowledgeContext);
  await sendMessage(chatId, response);
}

// Main polling loop
let lastUpdateId = 0;

async function poll() {
  try {
    const updates = await getUpdates(lastUpdateId + 1);
    
    for (const update of updates) {
      lastUpdateId = update.update_id;
      await handleMessage(update);
    }
  } catch (error) {
    console.error("Polling error:", error);
  }
}

console.log("🤖 MarketingClawBot starting...");
console.log("📡 Listening for messages...");
console.log(`📚 Knowledge base: ${KNOWLEDGE ? 'Loaded' : 'Not found'}`);

// Poll every second
setInterval(poll, 1000);

process.on("SIGINT", () => {
  console.log("\n👋 Shutting down...");
  process.exit(0);
});
