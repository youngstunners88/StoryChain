// Image Generation Service
// Cascade: LocalAI → HuggingFace → ComfyUI → Pollinations.ai (free fallback)
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const AVATAR_DIR = join(process.cwd(), 'data', 'avatars');

async function ensureAvatarDir() {
  if (!existsSync(AVATAR_DIR)) await mkdir(AVATAR_DIR, { recursive: true });
}

// Generate avatar via HuggingFace Inference API, save locally and return /avatars/... URL
export async function generateAndSaveAvatar(prompt: string, filename: string): Promise<string | null> {
  const hfToken = process.env.HUGGINGFACE_ACCESS_TOKEN;
  if (!hfToken) return null;

  const models = [
    'black-forest-labs/FLUX.1-schnell',
    'stabilityai/stable-diffusion-xl-base-1.0',
  ];

  for (const model of models) {
    try {
      console.log(`[ImageGen] Trying HuggingFace ${model} for: ${filename}`);
      const res = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: prompt, parameters: { num_inference_steps: 4 } }),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        console.log(`[ImageGen] HF ${model} failed: ${res.status} — ${txt.slice(0, 100)}`);
        continue;
      }
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength < 1000) { console.log('[ImageGen] HF returned empty/tiny image'); continue; }
      await ensureAvatarDir();
      const filePath = join(AVATAR_DIR, filename);
      await writeFile(filePath, Buffer.from(buffer));
      console.log(`[ImageGen] HF avatar saved: ${filePath}`);
      return `/avatars/${filename}`;
    } catch (err: any) {
      console.log(`[ImageGen] HF ${model} error: ${err?.message}`);
    }
  }
  return null;
}

export async function generateImageUrl(prompt: string, options?: {
  width?: number; height?: number; style?: 'portrait' | 'landscape' | 'square';
}): Promise<string> {
  const w = options?.width ?? 512;
  const h = options?.height ?? 512;

  // 1. Try LocalAI (OpenAI-compatible API on localhost or configured URL)
  const localAiUrl = process.env.LOCAL_AI_URL; // e.g. http://localhost:8080
  if (localAiUrl) {
    try {
      const res = await fetch(`${localAiUrl}/v1/images/generations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, n: 1, size: `${w}x${h}` }),
        signal: AbortSignal.timeout(45000),
      });
      if (res.ok) {
        const data = await res.json() as any;
        const url = data.data?.[0]?.url ?? data.data?.[0]?.b64_json;
        if (url) return url.startsWith('data:') ? url : url;
      }
    } catch (_) {
      console.log('[ImageGen] LocalAI unavailable — trying next');
    }
  }

  // 2. Try ComfyUI (simple text-to-image via /prompt endpoint)
  const comfyUrl = process.env.COMFYUI_URL; // e.g. http://localhost:8188
  if (comfyUrl) {
    try {
      // Simple ComfyUI workflow for basic text-to-image
      const workflow = {
        "3": { "class_type": "KSampler", "inputs": { "cfg": 8, "denoise": 1, "latent_image": ["5", 0], "model": ["4", 0], "negative": ["7", 0], "positive": ["6", 0], "sampler_name": "euler", "scheduler": "normal", "seed": Math.floor(Math.random() * 999999), "steps": 20 } },
        "4": { "class_type": "CheckpointLoaderSimple", "inputs": { "ckpt_name": "v1-5-pruned-emaonly.ckpt" } },
        "5": { "class_type": "EmptyLatentImage", "inputs": { "batch_size": 1, "height": h, "width": w } },
        "6": { "class_type": "CLIPTextEncode", "inputs": { "clip": ["4", 1], "text": prompt } },
        "7": { "class_type": "CLIPTextEncode", "inputs": { "clip": ["4", 1], "text": "blurry, bad quality, watermark" } },
        "8": { "class_type": "VAEDecode", "inputs": { "samples": ["3", 0], "vae": ["4", 2] } },
        "9": { "class_type": "SaveImage", "inputs": { "filename_prefix": "storychain_", "images": ["8", 0] } }
      };
      const res = await fetch(`${comfyUrl}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: workflow }),
        signal: AbortSignal.timeout(90000),
      });
      if (res.ok) {
        const data = await res.json() as any;
        if (data.prompt_id) {
          // Poll for result (simplified — in production use websocket)
          await new Promise(r => setTimeout(r, 15000));
          const hist = await fetch(`${comfyUrl}/history/${data.prompt_id}`);
          if (hist.ok) {
            const h_data = await hist.json() as any;
            const outputs = h_data[data.prompt_id]?.outputs;
            if (outputs) {
              const imgNode = Object.values(outputs)[0] as any;
              const img = imgNode?.images?.[0];
              if (img) return `${comfyUrl}/view?filename=${img.filename}&subfolder=${img.subfolder}&type=${img.type}`;
            }
          }
        }
      }
    } catch (_) {
      console.log('[ImageGen] ComfyUI unavailable — falling back to Pollinations');
    }
  }

  // 2b. HuggingFace Inference API (returns URL, no disk save in this flow)
  const hfToken = process.env.HUGGINGFACE_ACCESS_TOKEN;
  if (hfToken) {
    try {
      const tmpName = `tmp_${Date.now()}.jpg`;
      const saved = await generateAndSaveAvatar(prompt, tmpName);
      if (saved) return saved;
    } catch (_) {}
  }

  // 3. DiceBear — always free, no key needed
  const seed = encodeURIComponent(prompt.replace(/[^a-zA-Z0-9]/g, '').slice(0, 32) || 'default');
  return `https://api.dicebear.com/9.x/lorelei/svg?seed=${seed}`;
}

export function buildAvatarPrompt(name: string, role: string, genre?: string): string {
  const styleMap: Record<string, string> = {
    comedy:    'vibrant colorful theatrical, warm expressive face, joyful energy',
    horror:    'dark gothic moody, pale unsettling presence, Victorian shadows, crimson accents',
    romance:   'warm candlelit elegant, flowing silhouette, soft roses, timeless beauty',
    scifi:     'cyberpunk futuristic, glowing circuits, neon blue, sleek helmet, star fields',
    mystery:   'noir cinematic, shadowy trench coat, candlelit detective, mysterious gaze',
    fantasy:   'ethereal magical, glowing runes, ancient robes, otherworldly aura, soft light',
    action:    'dynamic intense, battle-worn, high contrast dramatic lighting, powerful stance',
    adventure: 'rugged explorer, windswept, dramatic landscape, confident expression',
    editor:    'professional scholarly, warm study, literary surrounded, intelligent gaze',
  };
  const style = styleMap[genre?.toLowerCase() ?? ''] ?? 'artistic professional, creative aura, thoughtful gaze';
  return `cinematic portrait of a ${role}, ${style}, character named ${name}, dramatic lighting, detailed, painterly illustration style, no text, no watermark, 4k quality`;
}

export function buildPollinationsUrl(prompt: string, seed: number): string {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=512&height=512&nologo=true&seed=${seed}&model=flux`;
}
