// HustleAI — Lightweight Event Tracker
// Tracks CTA clicks, calculator interactions, pricing, checkout events
// Stores via /api/track — writes to console + future DB

const TRACKED_EVENTS = [
    "click_primary_cta",
    "click_secondary_cta",
    "calculator_submit",
    "pricing_select_plan",
    "start_checkout",
    "page_view",
];

export function trackEvent(event, data = {}) {
    if (typeof window === "undefined") return;

    const payload = {
        event,
        data,
        url: window.location.pathname,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer || null,
    };

    // Console log in dev
    if (process.env.NODE_ENV === "development") {
        console.log("[Analytics]", event, data);
    }

    // Fire and forget
    try {
        navigator.sendBeacon("/api/track", JSON.stringify(payload));
    } catch {
        fetch("/api/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            keepalive: true,
        }).catch(() => { });
    }
}

// Install global tracker for components to use
if (typeof window !== "undefined") {
    window.__hustleTrack = trackEvent;
}

export default trackEvent;
