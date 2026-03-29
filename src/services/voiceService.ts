// Voice Service — TTS + STT for StoryChain
// Primary: Coqui TTS server (port 5002) — human-quality, per-agent VCTK voices
// Fallback: Web Speech API (browser built-in)

// Use Bun API proxy — avoids CORS issues from browser
const TTS_SERVER = '/api/tts';
let ttsServerAvailable: boolean | null = null;

async function checkTtsServer(): Promise<boolean> {
  if (ttsServerAvailable !== null) return ttsServerAvailable;
  try {
    const r = await fetch(`${TTS_SERVER}?text=hi&agentId=`, { signal: AbortSignal.timeout(3000) });
    ttsServerAvailable = r.ok; // proxy returns 200 with audio or 503 if TTS down
  } catch {
    ttsServerAvailable = false;
  }
  return ttsServerAvailable;
}

export interface VoiceProfile {
  agentId: string;
  agentName: string;
  gender: 'male' | 'female';
  pitch: number;
  rate: number;
  voiceHints: string[];
}

// ─── Per-agent voice profiles (used for Web Speech fallback) ──────────────────

export const AGENT_VOICE_PROFILES: VoiceProfile[] = [
  {
    agentId: 'agent_1773663532831_2c9pp3',
    agentName: 'Zara Asante',
    gender: 'female',
    pitch: 0.95,
    rate: 0.90,
    voiceHints: ['Google UK English Female', 'Samantha', 'Microsoft Hazel', 'en-GB-female'],
  },
  {
    agentId: 'agent_1773663532961_i25ay8',
    agentName: 'Ayan Raza',
    gender: 'male',
    pitch: 0.95,
    rate: 0.95,
    voiceHints: ['Google US English', 'Microsoft Mark', 'Alex', 'en-US-male'],
  },
  {
    agentId: 'agent_true_life',
    agentName: 'Fatima Diallo',
    gender: 'female',
    pitch: 1.0,
    rate: 0.88,
    voiceHints: ['Google UK English Female', 'Victoria', 'Samantha', 'en-GB-female'],
  },
  {
    agentId: 'agent_1774620000002_romance',
    agentName: 'Scarlett Vance',
    gender: 'female',
    pitch: 1.15,
    rate: 0.92,
    voiceHints: ['Google UK English Female', 'Microsoft Zira', 'Samantha', 'Fiona', 'Victoria', 'en-GB-female'],
  },
  {
    agentId: 'agent_1774620000001_comedy',
    agentName: 'The Wit',
    gender: 'male',
    pitch: 1.05,
    rate: 1.08,
    voiceHints: ['Google US English', 'Microsoft David', 'Tom', 'en-US-male'],
  },
  {
    agentId: 'agent_1774620000003_horror',
    agentName: 'The Dreadwright',
    gender: 'male',
    pitch: 0.72,
    rate: 0.82,
    voiceHints: ['Google UK English Male', 'Microsoft George', 'Daniel', 'en-GB-male'],
  },
  {
    agentId: 'agent_1774620000005_fantasy',
    agentName: 'The Lorewarden',
    gender: 'male',
    pitch: 0.88,
    rate: 0.85,
    voiceHints: ['Google UK English Male', 'Daniel', 'Microsoft George', 'en-GB-male'],
  },
  {
    agentId: 'agent_1774620000004_action',
    agentName: 'Ironbolt',
    gender: 'male',
    pitch: 0.90,
    rate: 1.02,
    voiceHints: ['Google US English', 'Microsoft Mark', 'Fred', 'en-US-male'],
  },
  // Editors
  {
    agentId: 'editor_agent_line',
    agentName: 'Kai Strand',
    gender: 'female',
    pitch: 1.05,
    rate: 0.95,
    voiceHints: ['Google UK English Female', 'Samantha', 'Microsoft Hazel', 'en-GB-female'],
  },
  {
    agentId: 'editor_agent_copy',
    agentName: 'K. Cole',
    gender: 'male',
    pitch: 1.0,
    rate: 0.97,
    voiceHints: ['Google US English', 'Microsoft David', 'Alex', 'en-US-male'],
  },
  {
    agentId: 'editor_agent_developmental',
    agentName: 'Max Mayne',
    gender: 'male',
    pitch: 0.92,
    rate: 0.93,
    voiceHints: ['Google UK English Male', 'Daniel', 'Microsoft George', 'en-GB-male'],
  },
];

// ─── Voice resolution (Web Speech fallback) ───────────────────────────────────

export function resolveVoice(profile: VoiceProfile): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  for (const hint of profile.voiceHints) {
    const match = voices.find(v => v.name.toLowerCase().includes(hint.toLowerCase()));
    if (match) return match;
  }
  const genderKeywords = profile.gender === 'female'
    ? ['female', 'woman', 'zira', 'hazel', 'fiona', 'samantha', 'victoria', 'karen']
    : ['male', 'man', 'david', 'daniel', 'mark', 'george', 'fred', 'alex'];
  const genderMatch = voices.find(v => genderKeywords.some(k => v.name.toLowerCase().includes(k)));
  if (genderMatch) return genderMatch;
  return voices.find(v => v.lang.startsWith('en')) ?? voices[0] ?? null;
}

export function getProfileForAgent(agentId: string, agentName?: string): VoiceProfile {
  const found = AGENT_VOICE_PROFILES.find(
    p => p.agentId === agentId || (agentName && p.agentName === agentName)
  );
  if (found) return found;
  const femaleNames = ['scarlett', 'vance', 'fatima', 'zara', 'kai'];
  const nameLower = (agentName ?? '').toLowerCase();
  const gender = femaleNames.some(n => nameLower.includes(n)) ? 'female' : 'male';
  return {
    agentId, agentName: agentName ?? 'Agent', gender,
    pitch: gender === 'female' ? 1.1 : 0.9, rate: 0.92,
    voiceHints: gender === 'female'
      ? ['Google UK English Female', 'Samantha', 'Microsoft Zira']
      : ['Google UK English Male', 'Daniel', 'Microsoft David'],
  };
}

// ─── TTS state ────────────────────────────────────────────────────────────────

let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let globalVolume = 1.0;
let globalMuted = false;

export function getVolume() { return globalVolume; }
export function getMuted()  { return globalMuted; }

export function setVolume(v: number) {
  globalVolume = Math.max(0, Math.min(1, v));
  localStorage.setItem('sc_voice_volume', String(globalVolume));
  if (currentAudio) currentAudio.volume = globalMuted ? 0 : globalVolume;
  if (currentUtterance) currentUtterance.volume = globalMuted ? 0 : globalVolume;
}

export function setMuted(m: boolean) {
  globalMuted = m;
  localStorage.setItem('sc_voice_muted', m ? '1' : '0');
  if (currentAudio) currentAudio.volume = m ? 0 : globalVolume;
  if (currentUtterance) currentUtterance.volume = m ? 0 : globalVolume;
}

export function loadVoicePrefs() {
  const v = localStorage.getItem('sc_voice_volume');
  const m = localStorage.getItem('sc_voice_muted');
  if (v) globalVolume = parseFloat(v);
  if (m) globalMuted = m === '1';
}

// ─── Coqui TTS (primary) ──────────────────────────────────────────────────────

async function speakViaCoqui(text: string, agentId: string, opts: SpeakOptions): Promise<boolean> {
  const available = await checkTtsServer();
  if (!available) return false;
  try {
    const url = `${TTS_SERVER}?text=${encodeURIComponent(text)}&agentId=${encodeURIComponent(agentId)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return false;
    const blob = await res.blob();
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    audio.volume = globalMuted ? 0 : globalVolume;
    currentAudio = audio;
    opts.onStart?.();
    audio.onended = () => {
      currentAudio = null;
      URL.revokeObjectURL(audioUrl);
      opts.onEnd?.();
    };
    audio.onerror = () => {
      currentAudio = null;
      URL.revokeObjectURL(audioUrl);
      opts.onError?.();
    };
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

// ─── Web Speech fallback ──────────────────────────────────────────────────────

function doSpeakWebSpeech(text: string, opts: SpeakOptions): SpeechSynthesisUtterance {
  const profile = getProfileForAgent(opts.agentId ?? '', opts.agentName);
  const voice = resolveVoice(profile);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch  = profile.pitch;
  utterance.rate   = profile.rate;
  utterance.volume = globalMuted ? 0 : globalVolume;
  if (voice) utterance.voice = voice;
  utterance.onstart = opts.onStart ?? null;
  utterance.onend   = () => { currentUtterance = null; opts.onEnd?.(); };
  utterance.onerror = () => { currentUtterance = null; opts.onError?.(); };
  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

// ─── Speak (public) ───────────────────────────────────────────────────────────

export interface SpeakOptions {
  agentId?: string;
  agentName?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

export function speak(text: string, opts: SpeakOptions = {}): void {
  if (typeof window === 'undefined') return;
  stop();

  const agentId = opts.agentId ?? '';

  // Try Coqui first, fall back to Web Speech
  speakViaCoqui(text, agentId, opts).then(success => {
    if (!success && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        doSpeakWebSpeech(text, opts);
      } else {
        const handler = () => {
          window.speechSynthesis.removeEventListener('voiceschanged', handler);
          doSpeakWebSpeech(text, opts);
        };
        window.speechSynthesis.addEventListener('voiceschanged', handler);
        setTimeout(() => {
          window.speechSynthesis.removeEventListener('voiceschanged', handler);
          if (!currentUtterance) doSpeakWebSpeech(text, opts);
        }, 3000);
      }
    }
  });
}

export function stop() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  if (currentAudio && !currentAudio.paused) return true;
  return typeof window !== 'undefined' && window.speechSynthesis?.speaking === true;
}

// ─── Speech Recognition (STT) ─────────────────────────────────────────────────

type SpeechHandler = (text: string, isFinal: boolean) => void;
type SpeechEndHandler = () => void;

export function startListening(
  onResult: SpeechHandler,
  onEnd: SpeechEndHandler
): (() => void) | null {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return null;

  const recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;

  recognition.onresult = (event: any) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += text;
      } else {
        interim += text;
      }
    }
    if (final) onResult(final, true);
    else if (interim) onResult(interim, false);
  };

  recognition.onend = onEnd;
  recognition.onerror = (e: any) => {
    // Don't call onEnd for no-speech — just let it restart
    if (e.error !== 'no-speech') onEnd();
  };

  recognition.start();
  return () => { try { recognition.stop(); } catch (_) {} };
}
