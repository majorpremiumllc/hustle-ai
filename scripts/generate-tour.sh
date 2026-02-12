#!/bin/bash
# Generate ElevenLabs tour narration audio
API_KEY="sk_d50873f7f8dfd6599d304726bd9330c303265a53dc9676ff"
OUT_DIR="$(dirname "$0")/../public/audio"
mkdir -p "$OUT_DIR"

VOICE="21m00Tcm4TlvDq8ikWAM"  # Rachel
MODEL="eleven_multilingual_v2"

generate() {
    local text="$1"
    local filename="$2"
    echo "Generating: $filename"
    curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/${VOICE}" \
        -H "xi-api-key: ${API_KEY}" \
        -H "Content-Type: application/json" \
        -o "${OUT_DIR}/${filename}" \
        --data "{
            \"text\": \"${text}\",
            \"model_id\": \"${MODEL}\",
            \"voice_settings\": {
                \"stability\": 0.45,
                \"similarity_boost\": 0.78,
                \"style\": 0.15,
                \"use_speaker_boost\": true
            }
        }"
    if file "${OUT_DIR}/${filename}" | grep -q "audio\|MPEG\|data"; then
        echo "  ✓ $(du -h "${OUT_DIR}/${filename}" | cut -f1)"
    else
        echo "  ✗ Error:"; cat "${OUT_DIR}/${filename}"; echo
    fi
}

echo "=== Tour Narrations ==="
generate "These are the core features that make HustleAI special. From instant call answering to smart appointment booking, we handle everything automatically — so you never miss a single customer again." "tour-features.mp3"
generate "Here's a live demo. Click the play button and listen to how our AI handles a real phone call. It sounds just like a human receptionist, but works twenty-four-seven." "tour-demo.mp3"
generate "We work with all kinds of service businesses. Plumbers, electricians, HVAC companies, dental offices, law firms, and more. No matter your industry, HustleAI adapts to your needs." "tour-industries.mp3"
generate "This is your wake-up call. See exactly how many calls you're missing and how much revenue that costs you every single month. The numbers might surprise you." "tour-loss.mp3"
generate "Use this calculator to see your potential revenue recovery. Enter your numbers and watch how HustleAI turns missed calls into booked appointments and real money." "tour-calculator.mp3"
generate "Ready to stop missing calls? Choose a plan and start your free trial today. No credit card required, and you'll be set up in under five minutes." "tour-pricing.mp3"

echo "=== Done ==="
ls -la "$OUT_DIR"/tour-*.mp3 2>/dev/null
