"use client";
/* ═══════════════════════════════════════════════════════
   AI-Native Visual Panels
   Glass card SVG components that replace stock photos.
   Each one is a mini "UI mockup" rendered as SVG.
   ═══════════════════════════════════════════════════════ */

/* ── Call Answering Panel ──────────────── */
export function CallPanel() {
    return (
        <svg viewBox="0 0 400 320" fill="none" style={{ width: "100%", height: "auto" }}>
            {/* Glass Card BG */}
            <rect x="0" y="0" width="400" height="320" rx="20" fill="url(#cardGrad)" stroke="rgba(0,210,255,0.12)" strokeWidth="1" />
            <defs>
                <linearGradient id="cardGrad" x1="0" y1="0" x2="400" y2="320" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="rgba(15,15,30,0.95)" />
                    <stop offset="100%" stopColor="rgba(20,20,40,0.9)" />
                </linearGradient>
            </defs>

            {/* Header bar */}
            <rect x="20" y="18" width="360" height="36" rx="8" fill="rgba(0,210,255,0.04)" />
            <circle cx="38" cy="36" r="5" fill="rgba(0,210,255,0.4)">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
            </circle>
            <text x="52" y="40" fill="rgba(0,210,255,0.6)" fontSize="11" fontFamily="system-ui" fontWeight="700">INCOMING CALL</text>
            <text x="310" y="40" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="system-ui">0:03</text>

            {/* Caller info */}
            <rect x="20" y="66" width="360" height="70" rx="10" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <circle cx="56" cy="101" r="18" fill="rgba(108,92,231,0.15)" stroke="rgba(108,92,231,0.2)" strokeWidth="1" />
            <text x="48" y="106" fill="rgba(108,92,231,0.6)" fontSize="14" fontFamily="system-ui" fontWeight="700">JD</text>
            <text x="84" y="94" fill="rgba(255,255,255,0.8)" fontSize="13" fontFamily="system-ui" fontWeight="600">John Davidson</text>
            <text x="84" y="112" fill="rgba(255,255,255,0.35)" fontSize="10" fontFamily="system-ui">(702) 555-0134 · Las Vegas, NV</text>

            {/* Intent detection */}
            <text x="20" y="160" fill="rgba(0,210,255,0.5)" fontSize="9" fontFamily="system-ui" fontWeight="700" letterSpacing="1.5">INTENT DETECTED</text>
            <rect x="20" y="168" width="200" height="28" rx="6" fill="rgba(0,210,255,0.06)" stroke="rgba(0,210,255,0.1)" strokeWidth="1" />
            <text x="34" y="186" fill="rgba(0,210,255,0.8)" fontSize="11" fontFamily="system-ui" fontWeight="600">🔧 Emergency Plumbing Repair</text>

            {/* Qualification chips */}
            <text x="20" y="218" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="system-ui" fontWeight="700" letterSpacing="1.5">QUALIFICATION</text>
            <rect x="20" y="226" width="88" height="24" rx="12" fill="rgba(0,184,148,0.08)" stroke="rgba(0,184,148,0.15)" strokeWidth="1" />
            <text x="33" y="242" fill="rgba(0,184,148,0.8)" fontSize="9" fontFamily="system-ui" fontWeight="600">✓ Homeowner</text>
            <rect x="116" y="226" width="78" height="24" rx="12" fill="rgba(0,184,148,0.08)" stroke="rgba(0,184,148,0.15)" strokeWidth="1" />
            <text x="128" y="242" fill="rgba(0,184,148,0.8)" fontSize="9" fontFamily="system-ui" fontWeight="600">✓ Urgent</text>
            <rect x="202" y="226" width="100" height="24" rx="12" fill="rgba(0,184,148,0.08)" stroke="rgba(0,184,148,0.15)" strokeWidth="1" />
            <text x="214" y="242" fill="rgba(0,184,148,0.8)" fontSize="9" fontFamily="system-ui" fontWeight="600">✓ In Service Area</text>

            {/* Action */}
            <rect x="20" y="268" width="360" height="36" rx="8" fill="rgba(0,210,255,0.1)" stroke="rgba(0,210,255,0.15)" strokeWidth="1" />
            <text x="140" y="290" fill="rgba(0,210,255,0.9)" fontSize="12" fontFamily="system-ui" fontWeight="700">⚡ Booking appointment…</text>
        </svg>
    );
}

/* ── Revenue Dashboard Panel ──────────── */
export function RevenueDashPanel() {
    return (
        <svg viewBox="0 0 400 320" fill="none" style={{ width: "100%", height: "auto" }}>
            <rect x="0" y="0" width="400" height="320" rx="20" fill="url(#dashGrad)" stroke="rgba(108,92,231,0.12)" strokeWidth="1" />
            <defs>
                <linearGradient id="dashGrad" x1="0" y1="0" x2="400" y2="320" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="rgba(15,15,30,0.95)" />
                    <stop offset="100%" stopColor="rgba(20,20,40,0.9)" />
                </linearGradient>
            </defs>

            {/* Header */}
            <text x="20" y="32" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="system-ui" fontWeight="700" letterSpacing="1.5">REVENUE RECOVERED — THIS MONTH</text>

            {/* Big number */}
            <text x="20" y="74" fill="rgba(0,210,255,0.9)" fontSize="34" fontFamily="system-ui" fontWeight="900">$14,280</text>
            <text x="172" y="74" fill="rgba(0,184,148,0.7)" fontSize="13" fontFamily="system-ui" fontWeight="600">↑ +38%</text>

            {/* Mini chart area */}
            <polyline points="20,140 60,132 100,136 140,120 180,118 220,105 260,108 300,95 340,90 380,82"
                stroke="rgba(0,210,255,0.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <polyline points="20,140 60,132 100,136 140,120 180,118 220,105 260,108 300,95 340,90 380,82"
                stroke="url(#chartLine)" strokeWidth="0" fill="url(#chartFill)" opacity="0.15" />
            <defs>
                <linearGradient id="chartLine" x1="20" y1="82" x2="380" y2="82" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="rgba(108,92,231,0.5)" />
                    <stop offset="100%" stopColor="rgba(0,210,255,0.5)" />
                </linearGradient>
                <linearGradient id="chartFill" x1="200" y1="82" x2="200" y2="145" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="rgba(0,210,255,0.3)" />
                    <stop offset="100%" stopColor="rgba(0,210,255,0)" />
                </linearGradient>
            </defs>
            {/* Chart area fill */}
            <polygon points="20,140 60,132 100,136 140,120 180,118 220,105 260,108 300,95 340,90 380,82 380,145 20,145"
                fill="url(#chartFill)" opacity="0.3" />

            {/* Metric tiles */}
            <rect x="20" y="160" width="115" height="60" rx="10" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <text x="32" y="180" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="system-ui" fontWeight="700" letterSpacing="1">CALLS ANSWERED</text>
            <text x="32" y="206" fill="rgba(255,255,255,0.85)" fontSize="20" fontFamily="system-ui" fontWeight="800">347</text>

            <rect x="143" y="160" width="115" height="60" rx="10" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <text x="155" y="180" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="system-ui" fontWeight="700" letterSpacing="1">LEADS QUALIFIED</text>
            <text x="155" y="206" fill="rgba(255,255,255,0.85)" fontSize="20" fontFamily="system-ui" fontWeight="800">89</text>

            <rect x="266" y="160" width="115" height="60" rx="10" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <text x="278" y="180" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="system-ui" fontWeight="700" letterSpacing="1">RESPONSE TIME</text>
            <text x="278" y="206" fill="rgba(0,210,255,0.85)" fontSize="20" fontFamily="system-ui" fontWeight="800">&lt;1s</text>

            {/* Recent activity */}
            <text x="20" y="248" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="system-ui" fontWeight="700" letterSpacing="1.5">RECENT ACTIVITY</text>
            <rect x="20" y="256" width="360" height="24" rx="6" fill="rgba(0,184,148,0.04)" />
            <circle cx="34" cy="268" r="3" fill="rgba(0,184,148,0.6)" />
            <text x="44" y="272" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="system-ui">Job booked — Sarah M. · Drain repair · $350</text>

            <rect x="20" y="284" width="360" height="24" rx="6" fill="rgba(0,210,255,0.04)" />
            <circle cx="34" cy="296" r="3" fill="rgba(0,210,255,0.6)" />
            <text x="44" y="300" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="system-ui">Lead qualified — Mike T. · Water heater · Urgent</text>
        </svg>
    );
}

/* ── Feature Icon Panels (small) ─────── */
export function FeaturePanel({ type }) {
    const panels = {
        phone: <PhoneFeature />,
        sms: <SmsFeature />,
        yelp: <PlatformFeature label="YELP" color="rgba(255,68,68,0.6)" />,
        google: <PlatformFeature label="GOOGLE" color="rgba(66,133,244,0.6)" />,
        dashboard: <DashboardFeature />,
        setup: <SetupFeature />,
    };
    return panels[type] || <DashboardFeature />;
}

function PhoneFeature() {
    return (
        <svg viewBox="0 0 160 160" fill="none" style={{ width: "100%", height: "auto" }}>
            <rect x="0" y="0" width="160" height="160" rx="16" fill="rgba(10,10,20,0.6)" />
            {/* Phone icon */}
            <circle cx="80" cy="60" r="28" fill="rgba(0,210,255,0.06)" stroke="rgba(0,210,255,0.15)" strokeWidth="1" />
            <path d="M72 50 C72 50 68 52 68 58 C68 64 72 70 78 76 C84 82 90 86 96 86 C102 86 104 82 104 82"
                stroke="rgba(0,210,255,0.7)" strokeWidth="2" strokeLinecap="round" fill="none" />
            {/* Waveform */}
            <g opacity="0.6">
                <rect x="40" y="108" width="3" height="12" rx="1.5" fill="rgba(0,210,255,0.4)"><animate attributeName="height" values="12;24;12" dur="1.2s" repeatCount="indefinite" /></rect>
                <rect x="48" y="104" width="3" height="20" rx="1.5" fill="rgba(0,210,255,0.5)"><animate attributeName="height" values="20;8;20" dur="1s" repeatCount="indefinite" /></rect>
                <rect x="56" y="100" width="3" height="28" rx="1.5" fill="rgba(0,210,255,0.6)"><animate attributeName="height" values="28;14;28" dur="1.4s" repeatCount="indefinite" /></rect>
                <rect x="64" y="106" width="3" height="16" rx="1.5" fill="rgba(0,210,255,0.5)"><animate attributeName="height" values="16;26;16" dur="0.9s" repeatCount="indefinite" /></rect>
                <rect x="72" y="102" width="3" height="24" rx="1.5" fill="rgba(0,210,255,0.6)"><animate attributeName="height" values="24;10;24" dur="1.1s" repeatCount="indefinite" /></rect>
                <rect x="80" y="98" width="3" height="32" rx="1.5" fill="rgba(0,210,255,0.7)"><animate attributeName="height" values="32;16;32" dur="1.3s" repeatCount="indefinite" /></rect>
                <rect x="88" y="104" width="3" height="20" rx="1.5" fill="rgba(0,210,255,0.5)"><animate attributeName="height" values="20;30;20" dur="1s" repeatCount="indefinite" /></rect>
                <rect x="96" y="108" width="3" height="12" rx="1.5" fill="rgba(0,210,255,0.4)"><animate attributeName="height" values="12;22;12" dur="1.2s" repeatCount="indefinite" /></rect>
                <rect x="104" y="106" width="3" height="16" rx="1.5" fill="rgba(0,210,255,0.5)"><animate attributeName="height" values="16;8;16" dur="0.8s" repeatCount="indefinite" /></rect>
                <rect x="112" y="110" width="3" height="8" rx="1.5" fill="rgba(0,210,255,0.3)"><animate attributeName="height" values="8;18;8" dur="1.1s" repeatCount="indefinite" /></rect>
            </g>
            <text x="46" y="148" fill="rgba(0,210,255,0.4)" fontSize="7" fontFamily="system-ui" fontWeight="700" letterSpacing="1">VOICE AI ACTIVE</text>
        </svg>
    );
}

function SmsFeature() {
    return (
        <svg viewBox="0 0 160 160" fill="none" style={{ width: "100%", height: "auto" }}>
            <rect x="0" y="0" width="160" height="160" rx="16" fill="rgba(10,10,20,0.6)" />
            {/* Chat bubbles */}
            <rect x="20" y="28" width="100" height="28" rx="10" fill="rgba(108,92,231,0.1)" stroke="rgba(108,92,231,0.15)" strokeWidth="1" />
            <text x="30" y="46" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="system-ui">Need a plumber ASAP</text>
            <rect x="50" y="64" width="96" height="40" rx="10" fill="rgba(0,210,255,0.06)" stroke="rgba(0,210,255,0.12)" strokeWidth="1" />
            <text x="58" y="78" fill="rgba(0,210,255,0.7)" fontSize="8" fontFamily="system-ui" fontWeight="600">Hi! I'm the AI assistant</text>
            <text x="58" y="92" fill="rgba(0,210,255,0.5)" fontSize="8" fontFamily="system-ui">for ProPlumb. Booking...</text>
            <text x="80" y="128" fill="rgba(0,210,255,0.3)" fontSize="7" fontFamily="system-ui" fontWeight="700" letterSpacing="1">SENT IN &lt;5 SECONDS</text>
            <circle cx="80" cy="144" r="3" fill="rgba(0,184,148,0.5)"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" /></circle>
        </svg>
    );
}

function PlatformFeature({ label, color }) {
    return (
        <svg viewBox="0 0 160 160" fill="none" style={{ width: "100%", height: "auto" }}>
            <rect x="0" y="0" width="160" height="160" rx="16" fill="rgba(10,10,20,0.6)" />
            <circle cx="80" cy="60" r="24" fill="rgba(255,255,255,0.02)" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" />
            <text x="80" y="65" fill={color} fontSize="10" fontFamily="system-ui" fontWeight="800" textAnchor="middle">{label}</text>
            {/* Connection lines */}
            <line x1="80" y1="84" x2="80" y2="110" stroke="rgba(0,210,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
            <rect x="45" y="110" width="70" height="22" rx="6" fill="rgba(0,210,255,0.04)" stroke="rgba(0,210,255,0.1)" strokeWidth="1" />
            <text x="56" y="124" fill="rgba(0,210,255,0.6)" fontSize="8" fontFamily="system-ui" fontWeight="600">AUTO-RESPOND</text>
            <text x="58" y="148" fill="rgba(255,255,255,0.2)" fontSize="7" fontFamily="system-ui" letterSpacing="0.5">Lead → Qualify → Book</text>
        </svg>
    );
}

function DashboardFeature() {
    return (
        <svg viewBox="0 0 160 160" fill="none" style={{ width: "100%", height: "auto" }}>
            <rect x="0" y="0" width="160" height="160" rx="16" fill="rgba(10,10,20,0.6)" />
            {/* Mini bars */}
            <rect x="24" y="90" width="14" height="40" rx="3" fill="rgba(0,210,255,0.2)"><animate attributeName="height" values="40;55;40" dur="3s" repeatCount="indefinite" /></rect>
            <rect x="44" y="75" width="14" height="55" rx="3" fill="rgba(0,210,255,0.3)"><animate attributeName="height" values="55;35;55" dur="2.5s" repeatCount="indefinite" /></rect>
            <rect x="64" y="60" width="14" height="70" rx="3" fill="rgba(0,210,255,0.4)"><animate attributeName="height" values="70;50;70" dur="3.2s" repeatCount="indefinite" /></rect>
            <rect x="84" y="70" width="14" height="60" rx="3" fill="rgba(108,92,231,0.3)"><animate attributeName="height" values="60;75;60" dur="2.8s" repeatCount="indefinite" /></rect>
            <rect x="104" y="55" width="14" height="75" rx="3" fill="rgba(108,92,231,0.4)"><animate attributeName="height" values="75;45;75" dur="3.1s" repeatCount="indefinite" /></rect>
            <rect x="124" y="65" width="14" height="65" rx="3" fill="rgba(108,92,231,0.3)"><animate attributeName="height" values="65;80;65" dur="2.9s" repeatCount="indefinite" /></rect>
            {/* Label */}
            <text x="24" y="30" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="system-ui" fontWeight="700" letterSpacing="1">REAL-TIME METRICS</text>
            <text x="24" y="50" fill="rgba(0,210,255,0.7)" fontSize="16" fontFamily="system-ui" fontWeight="800">$8,450</text>
            <text x="90" y="50" fill="rgba(0,184,148,0.6)" fontSize="9" fontFamily="system-ui">↑ 24%</text>
        </svg>
    );
}

function SetupFeature() {
    return (
        <svg viewBox="0 0 160 160" fill="none" style={{ width: "100%", height: "auto" }}>
            <rect x="0" y="0" width="160" height="160" rx="16" fill="rgba(10,10,20,0.6)" />
            {/* Steps */}
            <circle cx="40" cy="40" r="10" fill="rgba(0,184,148,0.1)" stroke="rgba(0,184,148,0.3)" strokeWidth="1" />
            <text x="37" y="44" fill="rgba(0,184,148,0.8)" fontSize="10" fontFamily="system-ui" fontWeight="700">✓</text>
            <text x="56" y="44" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="system-ui">Choose number</text>

            <line x1="40" y1="50" x2="40" y2="65" stroke="rgba(0,184,148,0.15)" strokeWidth="1" />

            <circle cx="40" cy="76" r="10" fill="rgba(0,184,148,0.1)" stroke="rgba(0,184,148,0.3)" strokeWidth="1" />
            <text x="37" y="80" fill="rgba(0,184,148,0.8)" fontSize="10" fontFamily="system-ui" fontWeight="700">✓</text>
            <text x="56" y="80" fill="rgba(255,255,255,0.5)" fontSize="9" fontFamily="system-ui">Customize AI</text>

            <line x1="40" y1="86" x2="40" y2="101" stroke="rgba(0,210,255,0.15)" strokeWidth="1" />

            <circle cx="40" cy="112" r="10" fill="rgba(0,210,255,0.1)" stroke="rgba(0,210,255,0.3)" strokeWidth="1">
                <animate attributeName="opacity" values="0.8;1;0.8" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <text x="37" y="116" fill="rgba(0,210,255,0.8)" fontSize="10" fontFamily="system-ui" fontWeight="700">3</text>
            <text x="56" y="116" fill="rgba(0,210,255,0.6)" fontSize="9" fontFamily="system-ui" fontWeight="600">Go Live →</text>

            <text x="24" y="148" fill="rgba(0,210,255,0.3)" fontSize="7" fontFamily="system-ui" fontWeight="700" letterSpacing="1">READY IN 5 MINUTES</text>
        </svg>
    );
}

/* ── Industry Glass Panel ──────────────── */
export function IndustryPanel({ name, desc }) {
    return (
        <svg viewBox="0 0 400 300" fill="none" style={{ width: "100%", height: "auto" }}>
            <rect x="0" y="0" width="400" height="300" rx="16" fill="rgba(10,10,20,0.7)" stroke="rgba(108,92,231,0.08)" strokeWidth="1" />

            {/* AI Classification Header */}
            <rect x="16" y="16" width="368" height="32" rx="8" fill="rgba(0,210,255,0.03)" />
            <circle cx="32" cy="32" r="4" fill="rgba(0,210,255,0.4)">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
            <text x="44" y="36" fill="rgba(0,210,255,0.5)" fontSize="9" fontFamily="system-ui" fontWeight="700" letterSpacing="1">AI INDUSTRY MODULE · {name.toUpperCase()}</text>

            {/* Flow diagram */}
            <g transform="translate(20, 70)">
                {/* Node 1: Call */}
                <rect x="0" y="0" width="80" height="36" rx="8" fill="rgba(108,92,231,0.08)" stroke="rgba(108,92,231,0.15)" strokeWidth="1" />
                <text x="20" y="22" fill="rgba(108,92,231,0.7)" fontSize="9" fontFamily="system-ui" fontWeight="600">📞 Call In</text>

                {/* Edge */}
                <line x1="80" y1="18" x2="110" y2="18" stroke="rgba(0,210,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />

                {/* Node 2: Classify */}
                <rect x="110" y="0" width="100" height="36" rx="8" fill="rgba(0,210,255,0.06)" stroke="rgba(0,210,255,0.12)" strokeWidth="1" />
                <text x="124" y="22" fill="rgba(0,210,255,0.7)" fontSize="9" fontFamily="system-ui" fontWeight="600">🧠 AI Classify</text>

                {/* Edge */}
                <line x1="210" y1="18" x2="240" y2="18" stroke="rgba(0,210,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />

                {/* Node 3: Book */}
                <rect x="240" y="0" width="110" height="36" rx="8" fill="rgba(0,184,148,0.06)" stroke="rgba(0,184,148,0.12)" strokeWidth="1" />
                <text x="258" y="22" fill="rgba(0,184,148,0.7)" fontSize="9" fontFamily="system-ui" fontWeight="600">📅 Auto-Book</text>
            </g>

            {/* Description area */}
            <rect x="16" y="130" width="368" height="60" rx="10" fill="rgba(255,255,255,0.015)" />
            <text x="28" y="155" fill="rgba(255,255,255,0.5)" fontSize="10" fontFamily="system-ui" style={{ fontStyle: "italic" }}>"{desc}"</text>

            {/* Metrics */}
            <g transform="translate(16, 210)">
                <rect x="0" y="0" width="115" height="50" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                <text x="12" y="18" fill="rgba(255,255,255,0.25)" fontSize="7" fontFamily="system-ui" fontWeight="700" letterSpacing="1">AVG RESPONSE</text>
                <text x="12" y="38" fill="rgba(0,210,255,0.8)" fontSize="16" fontFamily="system-ui" fontWeight="800">&lt;1s</text>

                <rect x="125" y="0" width="115" height="50" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                <text x="137" y="18" fill="rgba(255,255,255,0.25)" fontSize="7" fontFamily="system-ui" fontWeight="700" letterSpacing="1">CAPTURE RATE</text>
                <text x="137" y="38" fill="rgba(0,184,148,0.8)" fontSize="16" fontFamily="system-ui" fontWeight="800">98%</text>

                <rect x="250" y="0" width="118" height="50" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                <text x="262" y="18" fill="rgba(255,255,255,0.25)" fontSize="7" fontFamily="system-ui" fontWeight="700" letterSpacing="1">AVAILABILITY</text>
                <text x="262" y="38" fill="rgba(108,92,231,0.8)" fontSize="16" fontFamily="system-ui" fontWeight="800">24/7</text>
            </g>
        </svg>
    );
}
