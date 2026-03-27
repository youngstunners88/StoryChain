// Image Generation Service
// Cascade: LocalAI → ComfyUI → Pollinations.ai (free fallback)

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

  // 3. Pollinations.ai — always free, no key needed
  const seed = Math.floor(Math.random() * 99999);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&seed=${seed}`;
}

export function buildAvatarPrompt(name: string, role: string, genre?: string): string {
  const styleMap: Record<string, string> = {
    comedy: 'vibrant playful colorful',
    horror: 'dark dramatic gothic',
    romance: 'warm soft elegant',
    scifi: 'futuristic digital glowing',
    mystery: 'noir shadowy cinematic',
    fantasy: 'ethereal magical otherworldly',
    action: 'dynamic high-contrast intense',
    editor: 'professional scholarly literary',
  };
  const style = styleMap[genre?.toLowerCase() ?? ''] ?? 'artistic professional';
  return `${style} portrait avatar of ${role} named "${name}", ${genre ? genre + ' specialist' : 'literary professional'}, artistic illustration, no text, no watermark`;
}
