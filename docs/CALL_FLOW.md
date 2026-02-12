# Call & Message Flow — Detailed Scripts

## Major Premium LLC

---

## Phone Call Flow (Voice)

### Step-by-Step

```
┌─────────────────────────────────────────────────┐
│  1. GREETING                                     │
│  AI: "Hi! Thank you for calling Major Premium   │
│       LLC. I can help you schedule service or    │
│       get a quote. What kind of work do you      │
│       need help with today?"                     │
├─────────────────────────────────────────────────┤
│  2. IDENTIFY JOB TYPE                            │
│  Customer speaks → AI classifies into category   │
│  If unclear: "Could you describe the work in     │
│  a bit more detail?"                             │
├─────────────────────────────────────────────────┤
│  3. CHECK FOR ESCALATION                         │
│  If remodel/complex/high budget detected:        │
│  → "I'll forward this to our project manager     │
│     so we can assist you properly."              │
│  → escalate_conversation() called                │
│  → Owner gets SMS alert                          │
├─────────────────────────────────────────────────┤
│  4. COLLECT ADDRESS                              │
│  AI: "Could you share the address where the      │
│  work is needed?"                                │
│  Customer provides address.                      │
│  AI confirms Las Vegas area.                     │
├─────────────────────────────────────────────────┤
│  5. DETERMINE URGENCY                            │
│  AI: "When would you like this done — as soon    │
│  as possible, or is the timing flexible?"        │
│  If specific date: "What date works best?"       │
├─────────────────────────────────────────────────┤
│  6. GET NAME                                     │
│  AI: "And may I have your name for the booking?" │
├─────────────────────────────────────────────────┤
│  7. REQUEST PHOTOS                               │
│  AI: "If you can text us photos of the area,     │
│  that really helps us prepare. You can send      │
│  them to this number."                           │
├─────────────────────────────────────────────────┤
│  8. PRICING (if asked)                           │
│  AI: "Pricing depends on the scope of work.      │
│  Once we review the details and photos, we       │
│  can provide an accurate estimate."              │
├─────────────────────────────────────────────────┤
│  9. CAPTURE LEAD                                 │
│  → capture_lead() function called                │
│  → Data saved to Google Sheets                   │
│  → Make.com webhook fires                        │
│  → Owner receives SMS with lead details          │
├─────────────────────────────────────────────────┤
│  10. CLOSE                                       │
│  AI: "Perfect — we have all the details. Once    │
│  we review everything, we'll get back to you     │
│  shortly. Thank you for calling Major Premium    │
│  LLC!"                                           │
└─────────────────────────────────────────────────┘
```

---

## Example Phone Conversation

> **AI:** Hi! Thank you for calling Major Premium LLC. I can help you schedule service or get a quote. What kind of work do you need help with today?
>
> **Customer:** Yeah, I have some drywall damage in my living room. A couple of holes.
>
> **AI:** We can definitely help with drywall repair. Could you share the address where the work is needed?
>
> **Customer:** It's 4521 Desert Springs Drive, Las Vegas.
>
> **AI:** Got it — Las Vegas, perfect. That's in our service area. When would you like this done — as soon as possible, or is the timing flexible?
>
> **Customer:** Sometime this week would be great.
>
> **AI:** We'll aim for this week. And may I have your name for the booking?
>
> **Customer:** It's Mike.
>
> **AI:** Thanks, Mike. If you can text us a couple of photos of the drywall damage to this number, that really helps our team prepare.
>
> **Customer:** Sure, I can do that.
>
> **AI:** Perfect — we have all the details. Once we review everything, we'll get back to you shortly. Thank you for calling Major Premium LLC!

---

## Example Escalation Call

> **AI:** Hi! Thank you for calling Major Premium LLC. I can help you schedule service or get a quote. What kind of work do you need help with today?
>
> **Customer:** I want to completely remodel my kitchen. New cabinets, countertops, backsplash, flooring, everything.
>
> **AI:** A full kitchen remodel is a great project. To make sure we handle this properly, I'll forward this to our project manager who specializes in remodels. They'll reach out to you shortly to discuss the details. Can I confirm your phone number for the callback?
>
> **Customer:** Yeah, it's this number.
>
> **AI:** Perfect. I'll forward this to our project manager so we can assist you properly. You'll hear back from them shortly. Thank you for calling Major Premium LLC!

---

## SMS Message Flow

### Step-by-Step

```
┌──────────────────────────────────────────────────┐
│  1. INITIAL MESSAGE RECEIVED                      │
│  System detects new conversation (no history)     │
│                                                   │
│  AI: "Hi! Thanks for reaching out to Major        │
│       Premium LLC. I can help you with pricing    │
│       and availability."                          │
├──────────────────────────────────────────────────┤
│  2. JOB IDENTIFICATION                            │
│  Customer describes need → AI classifies          │
│  AI confirms and asks for address                 │
├──────────────────────────────────────────────────┤
│  3. ADDRESS COLLECTION                            │
│  AI asks for service address                      │
│  Customer provides → AI confirms area             │
├──────────────────────────────────────────────────┤
│  4. URGENCY                                       │
│  AI: "When would you like this done — ASAP, or    │
│       is the timing flexible?"                    │
├──────────────────────────────────────────────────┤
│  5. PHOTOS                                        │
│  AI: "Could you send a photo of [the area]?       │
│       That helps us prepare."                     │
├──────────────────────────────────────────────────┤
│  6. NAME                                          │
│  AI: "May I have your name for the booking?"      │
├──────────────────────────────────────────────────┤
│  7. LEAD CAPTURE + CLOSE                          │
│  → capture_lead() called                          │
│  → "Once we have the details, we'll get back      │
│     to you shortly. Thank you!"                   │
└──────────────────────────────────────────────────┘
```

---

## Example SMS Conversation

> **Customer:** Hi, I need someone to mount my TV
>
> **AI:** Hi! Thanks for reaching out to Major Premium LLC. We can definitely help with TV mounting! Could you share your address so we can confirm you're in our service area?
>
> **Customer:** 8920 West Flamingo Rd, Las Vegas
>
> **AI:** Got it, that's right in our service area. When would you like this done — ASAP, or is the timing flexible?
>
> **Customer:** This weekend if possible
>
> **AI:** We'll do our best to accommodate that. Could you send a photo of the wall where you'd like the TV mounted? That helps us prepare the right hardware.
>
> **Customer:** [sends photo]
>
> **AI:** Thanks for the photo! And may I have your name for the booking?
>
> **Customer:** Alex
>
> **AI:** Perfect, Alex. We have all the details. Once we review everything, we'll get back to you shortly. Thank you!
