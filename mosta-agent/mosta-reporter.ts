#!/usr/bin/env bun

// Mosta Marketing Agent - Telegram Reporter
// Sends updates to the Mosta Bot instead of main chat

const BOT_TOKEN = "8634166354:AAGmDAxJwyxwfn7ysz4dWt2O1093s-ot_kM";
const CHAT_ID = "7789481737";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendMostaUpdate(message: string) {
  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "HTML"
    })
  });
  return response.json();
}

export async function sendMostaImage(imagePath: string, caption?: string) {
  const formData = new FormData();
  formData.append("chat_id", CHAT_ID);
  formData.append("photo", new Blob([await Bun.file(imagePath).arrayBuffer()]), imagePath.split("/").pop() || "image.jpg");
  if (caption) formData.append("caption", caption);
  
  const response = await fetch(`${TELEGRAM_API}/sendPhoto`, {
    method: "POST",
    body: formData
  });
  return response.json();
}

export async function sendMostaVideo(videoPath: string, caption?: string) {
  const formData = new FormData();
  formData.append("chat_id", CHAT_ID);
  formData.append("video", new Blob([await Bun.file(videoPath).arrayBuffer()]), videoPath.split("/").pop() || "video.mp4");
  if (caption) formData.append("caption", caption);
  
  const response = await fetch(`${TELEGRAM_API}/sendVideo`, {
    method: "POST",
    body: formData
  });
  return response.json();
}

// Report formats
export function formatContentUpdate(data: {
  type: "image" | "video";
  language: string;
  hook: string;
  timestamp: string;
}) {
  return `🎨 CONTENT CREATED
━━━━━━━━━━━━━━━━━━━━━━━━

Type: ${data.type.toUpperCase()}
Language: ${data.language}
Hook: ${data.hook}
Time: ${data.timestamp}

Status: Ready for posting`;
}

export function formatHourlyReport(data: {
  contentCreated: number;
  languages: string[];
  bestPerforming: string;
}) {
  return `📊 HOURLY REPORT
━━━━━━━━━━━━━━━━━━━━━━━━

Content Created: ${data.contentCreated}
Languages: ${data.languages.join(", ")}
Best Performer: ${data.bestPerforming}

Next cycle in: 60 minutes`;
}

export function formatCampaignUpdate(data: {
  phase: string;
  progress: string;
  nextMilestone: string;
}) {
  return `🚀 CAMPAIGN UPDATE
━━━━━━━━━━━━━━━━━━━━━━━━

Phase: ${data.phase}
Progress: ${data.progress}
Next: ${data.nextMilestone}

Agent status: ACTIVE`;
}

// CLI test
if (process.argv[2] === "--test") {
  await sendMostaUpdate("🧪 Test message from Mosta Reporter");
  console.log("Test sent!");
}
