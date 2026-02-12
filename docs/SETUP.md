# Setup Guide — AI Dispatcher

## Major Premium LLC

---

## Prerequisites

- **Node.js** 18+ installed
- **Twilio** account with a phone number
- **OpenAI** API key (GPT-4o + Realtime API access)
- **Google Cloud** service account (for Sheets API)
- **Make.com** account (for automation workflows)
- **ngrok** (for local development / testing)

---

## Step 1: Clone & Install

```bash
cd /path/to/project
cp .env.example .env
npm install
```

---

## Step 2: Configure Environment (.env)

Fill in all values in `.env`:

### OpenAI
```
OPENAI_API_KEY=sk-your-key-here
```
Get from: https://platform.openai.com/api-keys

### Twilio
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+17025550100
```
Get from: https://console.twilio.com

### Owner Contact
```
OWNER_PHONE_NUMBER=+17025550199
OWNER_EMAIL=owner@majorpremiumllc.com
```

### Google Sheets
1. Go to Google Cloud Console → APIs & Services
2. Enable **Google Sheets API**
3. Create a **Service Account**
4. Download the JSON key file
5. Copy the `client_email` and `private_key` to `.env`:
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=dispatcher@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```
6. Create a Google Sheet, share it with the service account email
7. Copy the Sheet ID from the URL:
```
GOOGLE_SHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
```

### Make.com
```
MAKE_WEBHOOK_URL=https://hook.us1.make.com/your-webhook-id
```
See `docs/MAKE_ZAPIER_SETUP.md` for details.

---

## Step 3: Start the Server (Local)

```bash
# Start server
npm start

# Or with auto-reload during development
npm run dev
```

Server starts on `http://localhost:3000`.

---

## Step 4: Expose with ngrok

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`).
Set this as `BASE_URL` in `.env`.

---

## Step 5: Configure Twilio Webhooks

### Voice
1. Go to Twilio Console → Phone Numbers → Your Number
2. Under **Voice & Fax**:
   - **A call comes in**: Webhook → `https://your-url.ngrok-free.app/voice/incoming` (POST)
   - **Status callback**: `https://your-url.ngrok-free.app/voice/status` (POST)

### SMS
1. Under **Messaging**:
   - **A message comes in**: Webhook → `https://your-url.ngrok-free.app/sms/incoming` (POST)
   - **Status callback**: `https://your-url.ngrok-free.app/sms/status` (POST)

---

## Step 6: Test

### Health Check
```bash
curl http://localhost:3000/health
```

### Simulate Incoming SMS
```bash
curl -X POST http://localhost:3000/sms/incoming \
  -d "From=+17025551234" \
  -d "Body=I need a TV mounted" \
  -d "NumMedia=0"
```

### Make a Test Call
Call your Twilio number from any phone.

---

## Step 7: Production Deployment

Recommended platforms:
- **Railway** (railway.app) — easiest
- **Render** (render.com)
- **AWS EC2 / Lightsail**
- **DigitalOcean App Platform**

### Deploy to Railway:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

Set environment variables in the Railway dashboard.
Update Twilio webhooks to use the Railway URL.

---

## Monitoring

- Server logs all calls and messages to stdout
- Each lead capture is logged with customer details
- Escalations are logged and trigger SMS alerts
- Google Sheets provides a persistent lead audit trail
