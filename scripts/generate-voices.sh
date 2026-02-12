#!/bin/bash
# Generate ElevenLabs voice audio for the call simulation demo
# Uses pre-made voices: Josh (AI bot) + Rachel (Customer)

API_KEY="sk_d50873f7f8dfd6599d304726bd9330c303265a53dc9676ff"
OUT_DIR="$(dirname "$0")/../public/audio"
mkdir -p "$OUT_DIR"

# Voice IDs (ElevenLabs pre-made)
AI_VOICE="TxGEqnHWrfWFTfGW9XjX"    # Josh — professional American male
CALLER_VOICE="21m00Tcm4TlvDq8ikWAM"  # Rachel — warm American female

# Model
MODEL="eleven_multilingual_v2"

generate() {
    local voice_id="$1"
    local text="$2"
    local filename="$3"
    local stability="${4:-0.5}"
    local similarity="${5:-0.75}"
    
    echo "Generating: $filename"
    curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/${voice_id}" \
        -H "xi-api-key: ${API_KEY}" \
        -H "Content-Type: application/json" \
        -o "${OUT_DIR}/${filename}" \
        --data "{
            \"text\": \"${text}\",
            \"model_id\": \"${MODEL}\",
            \"voice_settings\": {
                \"stability\": ${stability},
                \"similarity_boost\": ${similarity},
                \"style\": 0.0,
                \"use_speaker_boost\": true
            }
        }"
    
    # Check if output is valid audio or error
    if file "${OUT_DIR}/${filename}" | grep -q "audio\|MPEG\|data"; then
        echo "  ✓ Saved: ${filename} ($(du -h "${OUT_DIR}/${filename}" | cut -f1))"
    else
        echo "  ✗ Error generating ${filename}:"
        cat "${OUT_DIR}/${filename}"
        echo ""
    fi
}

echo "=== Generating AI Bot Lines (Josh) ==="
generate "$AI_VOICE" "Thanks for calling Rivera Plumbing! I'm the AI assistant. How can I help you today?" "ai-1.mp3" 0.5 0.75
generate "$AI_VOICE" "I'm sorry to hear that! I can get a licensed plumber out to you today. Does 3:00 PM work for you?" "ai-2.mp3" 0.5 0.75
generate "$AI_VOICE" "Perfect! I've booked a plumber for 3 PM today. You'll receive a confirmation text shortly. Is there anything else I can help with?" "ai-3.mp3" 0.5 0.75

echo ""
echo "=== Generating Customer Lines (Rachel) ==="
generate "$CALLER_VOICE" "Hi, yeah, my kitchen sink is leaking pretty badly. I need someone to come take a look at it as soon as possible." "caller-1.mp3" 0.4 0.8
generate "$CALLER_VOICE" "Yes, 3 PM works great. Thank you so much!" "caller-2.mp3" 0.4 0.8

echo ""
echo "=== Done! ==="
ls -la "$OUT_DIR"/*.mp3 2>/dev/null
