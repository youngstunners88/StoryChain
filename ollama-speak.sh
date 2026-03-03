#!/bin/bash
# Ollama + TTS helper script
# Usage: ./ollama-speak.sh "your prompt" [--voice]

VOICE_MODEL="/root/.local/share/piper/en_US-amy-medium.onnx"
OLLAMA_URL="http://127.0.0.1:11434"

# Ensure Ollama is running
if ! curl -s "$OLLAMA_URL" > /dev/null 2>&1; then
    echo "Starting Ollama..."
    ollama serve &
    sleep 3
fi

PROMPT="$1"
USE_VOICE="${2:-}"

if [ -z "$PROMPT" ]; then
    echo "Usage: ./ollama-speak.sh \"your prompt\" [--voice]"
    exit 1
fi

# Generate response from Ollama
echo "Generating response..."
RESPONSE=$(curl -s "$OLLAMA_URL/api/generate" \
    -H "Content-Type: application/json" \
    -d "{\"model\": \"llama3.2\", \"prompt\": \"$PROMPT\", \"stream\": false}" \
    | jq -r '.response')

echo "Response: $RESPONSE"

# Speak if --voice flag is provided
if [ "$USE_VOICE" == "--voice" ]; then
    echo "Speaking..."
    echo "$RESPONSE" | piper --model "$VOICE_MODEL" --output_file /tmp/speech.wav
    # Play audio if aplay is available
    if command -v aplay &> /dev/null; then
        aplay /tmp/speech.wav
    else
        echo "Audio saved to /tmp/speech.wav"
    fi
fi
