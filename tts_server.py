#!/usr/bin/env python3
"""
StoryChain TTS Server — Coqui TTS VITS multi-speaker
Runs on port 5002. Serves audio for agent voices.
"""
import os
import io
import hashlib
import json
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading

# ── Config ─────────────────────────────────────────────────────────────────────
PORT = 5002
CACHE_DIR = Path("data/tts_cache")
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# VCTK multi-speaker VITS — fast CPU inference, 108 speaker voices
MODEL_NAME = "tts_models/en/vctk/vits"

# Speaker mappings per agent — VCTK speakers p225–p376
# Use diverse voices for different agent personalities
AGENT_SPEAKERS = {
    # Writers
    "agent_1773663532961_i25ay8": "p236",   # Ayan Raza — Indian sci-fi writer
    "agent_1773663532831_2c9pp3": "p240",   # Zara Asante — Ghanaian mystery
    "agent_true_life":            "p255",   # Fatima Diallo — Senegalese true-life
    "agent_1774620000002_romance": "p269",  # Scarlett Vance — romance
    "agent_1774620000001_comedy":  "p300",  # The Wit — comedy
    "agent_1774620000003_horror":  "p311",  # The Dreadwright — horror
    "agent_1774620000004_action":  "p326",  # Ironbolt — action
    "agent_1774620000005_fantasy": "p347",  # The Lorewarden — fantasy
    # Editors
    "editor_agent_developmental":  "p360",  # Max Mayne
    "editor_agent_copy":           "p374",  # K. Cole
    "editor_agent_line":           "p330",  # Kai Strand
}
DEFAULT_SPEAKER = "p225"

tts_model = None
tts_lock = threading.Lock()

def get_tts():
    global tts_model
    if tts_model is None:
        from TTS.api import TTS
        print("[TTS] Loading VCTK VITS model (first run downloads ~200MB)…")
        tts_model = TTS(MODEL_NAME, progress_bar=False)
        print("[TTS] Model loaded.")
    return tts_model


def synthesize(text: str, speaker_id: str) -> bytes:
    """Synthesize text to WAV bytes, with file caching."""
    cache_key = hashlib.md5(f"{speaker_id}:{text}".encode()).hexdigest()
    cache_file = CACHE_DIR / f"{cache_key}.wav"
    if cache_file.exists():
        return cache_file.read_bytes()

    with tts_lock:
        tts = get_tts()
        wav = tts.tts(text=text, speaker=speaker_id)

    # Write WAV to file
    import soundfile as sf
    import numpy as np
    arr = np.array(wav, dtype=np.float32)
    buf = io.BytesIO()
    sf.write(buf, arr, samplerate=22050, format="WAV")
    data = buf.getvalue()
    cache_file.write_bytes(data)
    return data


class TTSHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass  # suppress default access log

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path != "/tts":
            self.send_response(404)
            self.end_headers()
            return

        params = parse_qs(parsed.query)
        text = params.get("text", [""])[0].strip()
        agent_id = params.get("agentId", [""])[0].strip()
        speaker = AGENT_SPEAKERS.get(agent_id, DEFAULT_SPEAKER)

        if not text:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"text param required")
            return

        # Truncate very long text
        if len(text) > 600:
            text = text[:600]

        try:
            wav_bytes = synthesize(text, speaker)
            self.send_response(200)
            self.send_header("Content-Type", "audio/wav")
            self.send_header("Content-Length", str(len(wav_bytes)))
            self.send_header("Cache-Control", "public, max-age=3600")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(wav_bytes)
        except Exception as e:
            print(f"[TTS] Error: {e}")
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode())

    def do_POST(self):
        """POST /tts with JSON body {text, agentId}"""
        if self.path != "/tts":
            self.send_response(404)
            self.end_headers()
            return
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length).decode()) if length else {}
        text = body.get("text", "").strip()
        agent_id = body.get("agentId", "").strip()
        speaker = AGENT_SPEAKERS.get(agent_id, DEFAULT_SPEAKER)

        if not text:
            self.send_response(400)
            self.end_headers()
            return

        if len(text) > 600:
            text = text[:600]

        try:
            wav_bytes = synthesize(text, speaker)
            self.send_response(200)
            self.send_header("Content-Type", "audio/wav")
            self.send_header("Content-Length", str(len(wav_bytes)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(wav_bytes)
        except Exception as e:
            self.send_response(500)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()


if __name__ == "__main__":
    # Pre-warm the model
    print(f"[TTS] Starting StoryChain TTS server on port {PORT}…")
    get_tts()
    server = HTTPServer(("0.0.0.0", PORT), TTSHandler)
    print(f"[TTS] Ready → http://localhost:{PORT}/tts?text=Hello&agentId=agent_true_life")
    server.serve_forever()
