/* ─────────────────────────────────────────────
   HustleAI — Site Configuration
   Central config for tunable values
   ───────────────────────────────────────────── */

export const SITE_CONFIG = {
    /* Brand */
    name: "HustleAI",
    tagline: "AI Answers Every Call & Message.",
    domain: "tryhustleai.com",

    /* Revenue Counter */
    revenue: {
        baseAmount: 847320, // Starting display amount ($)
        dailyGrowth: 12450, // Approximate daily growth
        tickInterval: 4000, // ms between ticks
        tickAmount: [35, 85], // random range per tick ($)
    },

    /* AI Activity Feed */
    activityEvents: [
        { icon: "📞", text: "Incoming call detected", color: "#FF6B6B" },
        { icon: "🤖", text: "AI answering…", color: "#A29BFE" },
        { icon: "⭐", text: "Lead qualified: High intent", color: "#FDCB6E" },
        { icon: "📅", text: "Appointment booked: Tue 10:00 AM", color: "#00B894" },
        { icon: "💬", text: "Missed-call recovery SMS sent", color: "#00D2FF" },
        { icon: "📋", text: "Estimate request captured", color: "#74B9FF" },
        { icon: "💰", text: "Revenue updated: +$450", color: "#6C5CE7" },
    ],
    activityLoopDuration: 14000, // 14s full loop

    /* AI Mode — animation intensity presets */
    modes: {
        stealth: {
            particleCount: 0.4,   // multiplier (40% of default)
            particleSpeed: 0.5,
            particleAlpha: 0.4,
            connectionDist: 100,
            glowIntensity: 0.5,
        },
        boost: {
            particleCount: 1.0,
            particleSpeed: 1.0,
            particleAlpha: 1.0,
            connectionDist: 150,
            glowIntensity: 1.0,
        },
    },
    defaultMode: "boost",
};
