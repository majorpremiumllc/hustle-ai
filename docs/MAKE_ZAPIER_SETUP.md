# Make.com / Zapier Integration Guide

## Major Premium LLC — AI Dispatcher

---

## Overview

The AI Dispatcher fires a webhook to Make.com whenever a new lead is captured or an escalation occurs. Make.com then handles downstream automation: notifications, CRM updates, follow-up scheduling.

---

## Webhook Payload

When the dispatcher captures a lead, it sends this JSON to your Make.com webhook:

```json
{
  "timestamp": "2026-02-09T18:30:00.000Z",
  "customer_name": "Mike Johnson",
  "phone_number": "+17025551234",
  "job_type": "Drywall repair",
  "address": "4521 Desert Springs Dr, Las Vegas, NV",
  "urgency": "ASAP",
  "preferred_date": "",
  "notes": "Two holes in living room wall, about fist-sized",
  "has_photos": true,
  "source": "Phone Call",
  "status": "New",
  "call_sid": "CA1234567890abcdef"
}
```

---

## Make.com Setup

### Step 1: Create a Custom Webhook

1. Log in to **Make.com**
2. Click **Create a new scenario**
3. Add module: **Webhooks → Custom Webhook**
4. Click **Add** to create a new webhook
5. Name it: `Major Premium - New Lead`
6. Copy the webhook URL
7. Paste it into your `.env` as `MAKE_WEBHOOK_URL`

### Step 2: Define the Data Structure

After receiving the first webhook, Make.com will auto-detect the JSON structure. You can also define it manually with these fields:

| Field | Type |
|---|---|
| timestamp | Text |
| customer_name | Text |
| phone_number | Text |
| job_type | Text |
| address | Text |
| urgency | Text |
| preferred_date | Text |
| notes | Text |
| has_photos | Boolean |
| source | Text |
| status | Text |
| call_sid | Text |

### Step 3: Add Downstream Modules

#### Option A: Google Sheets (Backup Storage)
- Module: **Google Sheets → Add a Row**
- Select your Lead Tracker spreadsheet
- Map fields from the webhook

#### Option B: Email Notification
- Module: **Email → Send an Email**
- To: owner@majorpremiumllc.com
- Subject: `New Lead: {{customer_name}} — {{job_type}}`
- Body: Map all lead fields into a formatted email

#### Option C: SMS Follow-Up (via Twilio)
- Module: **Twilio → Send an SMS**
- From: Your Twilio number
- To: `{{phone_number}}`
- Body: `Hi {{customer_name}}! Thanks for contacting Major Premium LLC. We've received your request for {{job_type}} and will get back to you shortly with a quote.`

#### Option D: CRM Integration
- Module: **HTTP → Make a Request**
- Send lead data to your CRM API (HubSpot, Salesforce, etc.)

### Step 4: Add a Router (Multiple Actions)

Use a **Router** module to run multiple paths simultaneously:

```
Webhook
  └── Router
        ├── Path 1: Google Sheets (add row)
        ├── Path 2: Email (send notification)
        └── Path 3: Twilio SMS (send follow-up)
```

### Step 5: Activate

1. Turn on the scenario
2. Set schedule to **Immediately** (the default for webhook triggers)
3. Test by making a call or sending an SMS to your Twilio number

---

## Zapier Alternative

If using Zapier instead of Make.com:

1. Create a new Zap
2. Trigger: **Webhooks by Zapier → Catch Hook**
3. Copy the webhook URL → paste into `.env` as `MAKE_WEBHOOK_URL`
4. Add Actions:
   - **Google Sheets → Create Spreadsheet Row**
   - **Gmail → Send Email**
   - **Twilio → Send SMS**
5. Test and enable

---

## Recommended Automation Scenarios

| Scenario | Trigger | Action |
|---|---|---|
| New Lead Alert | Webhook (lead captured) | Email + SMS to owner |
| Customer Follow-Up | Webhook (lead captured) | SMS to customer after 1 hour |
| Estimate Reminder | Scheduled (daily) | Check Sheets for "Estimate Scheduled" status, send reminder |
| Escalation Alert | Webhook (escalation) | Urgent SMS + email to owner |
| Weekly Report | Scheduled (weekly) | Pull Sheets data, generate summary email |
