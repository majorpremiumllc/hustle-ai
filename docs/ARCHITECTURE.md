# Architecture — AI Phone & Chat Dispatcher

## Major Premium LLC — Handyman & Home Improvement

---

## System Overview

This system fully automates incoming customer calls and SMS messages using AI. It identifies job types, collects lead information, and routes complex requests to a human.

### Technology Stack

| Layer | Technology |
|---|---|
| VoIP & SMS | Twilio (Programmable Voice + Messaging) |
| Voice AI | OpenAI Realtime API (gpt-4o-realtime-preview) |
| Text AI | OpenAI Chat Completions (gpt-4o) |
| Server | Node.js + Express + WebSocket |
| Lead Storage | Google Sheets (via Sheets API v4) |
| Automation | Make.com (webhook trigger) |
| Notifications | Twilio SMS to owner |

---

## Data Flow

### Phone Call Flow

```
Customer dials Twilio number
  → Twilio sends POST /voice/incoming
  → Server returns TwiML: <Connect><Stream>
  → Twilio opens WebSocket to /media-stream
  → Server creates OpenAI Realtime API session
  → Audio streams bidirectionally:
      Twilio (μ-law) ↔ Server ↔ OpenAI Realtime
  → AI follows dispatcher script:
      1. Greets caller
      2. Identifies job type
      3. Collects address
      4. Determines urgency
      5. Gets name
      6. Requests photos
  → AI calls capture_lead() function
  → Lead saved to Google Sheets
  → Make.com webhook fires
  → Owner gets SMS notification
  → AI closes: "We'll get back to you shortly."
```

### SMS Flow

```
Customer texts Twilio number
  → Twilio sends POST /sms/incoming
  → Server loads conversation history (by phone number)
  → Message + history → OpenAI Chat Completions
  → AI generates response following dispatcher script
  → If function call (capture_lead / escalate):
      → Execute function (save lead / notify owner)
      → Get follow-up response from AI
  → Reply sent via TwiML <Message>
  → Conversation state stored in memory (30min TTL)
```

---

## File Structure

```
├── server.js                      # Express + WebSocket server
├── package.json                   # Dependencies
├── .env.example                   # Environment template
├── .gitignore
│
├── config/
│   └── constants.js               # Company info, categories, escalation rules
│
├── prompts/
│   └── dispatcher.js              # AI system prompts + function definitions
│
├── routes/
│   ├── voice.js                   # POST /voice/incoming, /voice/status
│   └── sms.js                     # POST /sms/incoming, /sms/status
│
├── services/
│   ├── openai-realtime.js         # Twilio MediaStream ↔ OpenAI Realtime bridge
│   ├── openai-chat.js             # SMS conversation engine (Chat Completions)
│   ├── escalation.js              # Escalation detection + owner alerts
│   ├── leads.js                   # Lead capture, storage, and notification
│   └── sheets.js                  # Google Sheets API client
│
└── docs/
    ├── ARCHITECTURE.md            # This file
    ├── SETUP.md                   # Deployment guide
    ├── CALL_FLOW.md               # Detailed flow documentation
    └── MAKE_ZAPIER_SETUP.md       # Make.com webhook configuration
```

---

## Escalation Matrix

| Trigger | Detection | Action |
|---|---|---|
| Budget > $2,000 | AI function call | SMS to owner + log |
| Full remodel | AI function call + keyword detection | SMS to owner + log |
| Angry client | AI tone analysis | SMS to owner + log |
| Owner request | AI function call | SMS to owner + log |
| Complex electrical | AI function call + keyword detection | SMS to owner + log |
| Complex plumbing | AI function call + keyword detection | SMS to owner + log |

---

## Security Notes

- API keys stored in `.env` (never committed)
- Twilio request signature validation recommended for production
- Google Sheets access via service account (least-privilege)
- No customer data stored in application memory beyond active sessions
- Conversation history expires after configurable TTL (default: 30 min)
