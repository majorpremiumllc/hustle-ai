// ─────────────────────────────────────────────
// OpenAI Chat Completions — SMS Conversations
// ─────────────────────────────────────────────

const OpenAI = require('openai');
const { SMS_SYSTEM_PROMPT, TOOL_FUNCTIONS } = require('../prompts/dispatcher');
const { handleLeadCapture } = require('./leads');
const { handleEscalation } = require('./escalation');
const { CONVERSATION_TTL } = require('../config/constants');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// In-memory conversation store (keyed by phone number)
const conversations = new Map();

/**
 * Get or create a conversation history for a phone number.
 */
function getConversation(phoneNumber) {
    const existing = conversations.get(phoneNumber);
    if (existing && Date.now() - existing.lastActivity < CONVERSATION_TTL) {
        existing.lastActivity = Date.now();
        return existing;
    }

    const conv = {
        messages: [{ role: 'system', content: SMS_SYSTEM_PROMPT }],
        lastActivity: Date.now(),
        leadData: {},
    };
    conversations.set(phoneNumber, conv);
    return conv;
}

/**
 * Process an incoming SMS and generate an AI response.
 *
 * @param {string} phoneNumber - Sender's phone number
 * @param {string} messageBody - Text message content
 * @param {boolean} hasMedia - Whether MMS media was attached
 * @returns {Promise<string>} AI response text
 */
async function processMessage(phoneNumber, messageBody, hasMedia = false) {
    const conv = getConversation(phoneNumber);

    // Add the incoming message
    let userContent = messageBody;
    if (hasMedia) {
        userContent += '\n[Customer sent a photo/image]';
    }
    conv.messages.push({ role: 'user', content: userContent });

    try {
        // Call OpenAI with function calling
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: conv.messages,
            tools: TOOL_FUNCTIONS,
            tool_choice: 'auto',
            temperature: 0.7,
            max_tokens: 300,
        });

        const choice = response.choices[0];
        let assistantMessage = choice.message;

        // Handle function calls (may be chained)
        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
            conv.messages.push(assistantMessage);

            for (const toolCall of assistantMessage.tool_calls) {
                const result = await executeFunctionCall(
                    toolCall.function.name,
                    toolCall.function.arguments,
                    phoneNumber,
                );

                conv.messages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result),
                });
            }

            // Get the follow-up response after function execution
            const followUp = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: conv.messages,
                temperature: 0.7,
                max_tokens: 300,
            });

            assistantMessage = followUp.choices[0].message;
        }

        // Store assistant response
        conv.messages.push({ role: 'assistant', content: assistantMessage.content });

        return assistantMessage.content;
    } catch (err) {
        console.error('[Chat] OpenAI error:', err.message);
        return 'Sorry, we\'re experiencing a brief issue. Please try again in a moment, or call us directly.';
    }
}

/**
 * Execute a function call from the AI.
 */
async function executeFunctionCall(name, argsStr, phoneNumber) {
    try {
        const args = JSON.parse(argsStr);

        switch (name) {
            case 'capture_lead':
                args.phone_number = args.phone_number || phoneNumber;
                args.source = 'SMS';
                return await handleLeadCapture(args);

            case 'escalate_conversation':
                args.customer_phone = args.customer_phone || phoneNumber;
                args.channel = 'SMS';
                return await handleEscalation(args);

            default:
                return { error: `Unknown function: ${name}` };
        }
    } catch (err) {
        console.error(`[Chat] Function call error (${name}):`, err);
        return { error: err.message };
    }
}

/**
 * Periodically clean up expired conversations.
 */
function startCleanupInterval() {
    setInterval(() => {
        const now = Date.now();
        for (const [phone, conv] of conversations) {
            if (now - conv.lastActivity > CONVERSATION_TTL) {
                conversations.delete(phone);
                console.log(`[Chat] Expired conversation for ${phone}`);
            }
        }
    }, 5 * 60 * 1000); // every 5 minutes
}

module.exports = { processMessage, startCleanupInterval };
