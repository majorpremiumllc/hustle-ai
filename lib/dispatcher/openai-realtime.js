// ─────────────────────────────────────────────
// OpenAI Realtime API — Voice Conversation
// ─────────────────────────────────────────────
// Bridges Twilio Media Streams ↔ OpenAI Realtime API
// for real-time, natural voice conversations.

const WebSocket = require('ws');
const { VOICE_SYSTEM_PROMPT, REALTIME_TOOLS } = require('../prompts/dispatcher');
const { handleLeadCapture } = require('./leads');
const { handleEscalation } = require('./escalation');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_REALTIME_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17';

/**
 * Create an OpenAI Realtime API WebSocket session and bridge it
 * with a Twilio Media Stream connection.
 *
 * @param {WebSocket} twilioWs - Twilio Media Stream WebSocket
 * @param {string} callSid - Twilio Call SID
 * @param {string} callerNumber - Caller's phone number
 */
function createRealtimeSession(twilioWs, callSid, callerNumber) {
    const openaiWs = new WebSocket(OPENAI_REALTIME_URL, {
        headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'OpenAI-Beta': 'realtime=v1',
        },
    });

    let streamSid = null;

    // ── OpenAI connection opened ─────────────────────────────────
    openaiWs.on('open', () => {
        console.log(`[Realtime] Connected for call ${callSid}`);

        // Configure the session
        openaiWs.send(JSON.stringify({
            type: 'session.update',
            session: {
                turn_detection: { type: 'server_vad' },
                input_audio_format: 'g711_ulaw',
                output_audio_format: 'g711_ulaw',
                voice: 'alloy',
                instructions: VOICE_SYSTEM_PROMPT,
                modalities: ['text', 'audio'],
                temperature: 0.7,
                tools: REALTIME_TOOLS,
                tool_choice: 'auto',
            },
        }));

        // Send initial greeting
        openaiWs.send(JSON.stringify({
            type: 'response.create',
            response: {
                modalities: ['text', 'audio'],
                instructions: 'Greet the caller with the opening script. Say: "Hi! Thank you for calling Major Premium LLC. I can help you schedule service or get a quote. What kind of work do you need help with today?"',
            },
        }));
    });

    // ── Messages from OpenAI ─────────────────────────────────────
    openaiWs.on('message', (data) => {
        try {
            const event = JSON.parse(data);

            switch (event.type) {
                // Stream audio back to Twilio
                case 'response.audio.delta':
                    if (event.delta && streamSid) {
                        twilioWs.send(JSON.stringify({
                            event: 'media',
                            streamSid,
                            media: { payload: event.delta },
                        }));
                    }
                    break;

                // Handle function calls
                case 'response.function_call_arguments.done':
                    handleFunctionCall(event, openaiWs, callerNumber, callSid);
                    break;

                // Log transcripts
                case 'response.audio_transcript.done':
                    console.log(`[AI → Caller] ${event.transcript}`);
                    break;

                case 'conversation.item.input_audio_transcription.completed':
                    console.log(`[Caller → AI] ${event.transcript}`);
                    break;

                case 'error':
                    console.error('[Realtime Error]', event.error);
                    break;
            }
        } catch (err) {
            console.error('[Realtime] Failed to parse message:', err);
        }
    });

    // ── Messages from Twilio ─────────────────────────────────────
    twilioWs.on('message', (msg) => {
        try {
            const data = JSON.parse(msg);

            switch (data.event) {
                case 'start':
                    streamSid = data.start.streamSid;
                    console.log(`[Twilio] Stream started: ${streamSid}`);
                    break;

                case 'media':
                    // Forward audio to OpenAI
                    if (openaiWs.readyState === WebSocket.OPEN) {
                        openaiWs.send(JSON.stringify({
                            type: 'input_audio_buffer.append',
                            audio: data.media.payload,
                        }));
                    }
                    break;

                case 'stop':
                    console.log(`[Twilio] Stream stopped: ${streamSid}`);
                    openaiWs.close();
                    break;
            }
        } catch (err) {
            console.error('[Twilio] Failed to parse message:', err);
        }
    });

    // ── Cleanup ──────────────────────────────────────────────────
    twilioWs.on('close', () => {
        console.log(`[Twilio] WebSocket closed for call ${callSid}`);
        if (openaiWs.readyState === WebSocket.OPEN) openaiWs.close();
    });

    openaiWs.on('close', () => {
        console.log(`[Realtime] Session closed for call ${callSid}`);
    });

    openaiWs.on('error', (err) => {
        console.error('[Realtime] WebSocket error:', err.message);
    });
}

/**
 * Handle function calls from the AI during voice conversations.
 */
async function handleFunctionCall(event, openaiWs, callerNumber, callSid) {
    const { name, arguments: argsStr, call_id } = event;

    try {
        const args = JSON.parse(argsStr);
        let result;

        switch (name) {
            case 'capture_lead':
                args.phone_number = args.phone_number || callerNumber;
                args.source = 'Phone Call';
                args.call_sid = callSid;
                result = await handleLeadCapture(args);
                break;

            case 'escalate_conversation':
                args.customer_phone = args.customer_phone || callerNumber;
                args.channel = 'Phone Call';
                args.call_sid = callSid;
                result = await handleEscalation(args);
                break;

            default:
                result = { error: `Unknown function: ${name}` };
        }

        // Send function result back to OpenAI
        openaiWs.send(JSON.stringify({
            type: 'conversation.item.create',
            item: {
                type: 'function_call_output',
                call_id,
                output: JSON.stringify(result),
            },
        }));

        // Trigger continuation
        openaiWs.send(JSON.stringify({ type: 'response.create' }));
    } catch (err) {
        console.error(`[Realtime] Function call error (${name}):`, err);
    }
}

module.exports = { createRealtimeSession };
