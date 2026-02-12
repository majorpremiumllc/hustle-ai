"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./DemoModal.module.css";

/* ═══════════════════════════════════════════════
   Demo Modal — Live Call & SMS Simulation
   ─────────────────────────────────────────────
   Now with VOICE AUDIO using Web Speech API:
   • AI bot → lower pitch, slightly faster rate
   • Customer → natural pitch, normal rate
   • Different voices automatically selected
   ═══════════════════════════════════════════════ */

const CALL_STEPS = [
    { type: "ring", text: "📞 Incoming Call — Sarah M.", delay: 0, voice: null },
    { type: "wave", text: "", delay: 1000, voice: null },
    { type: "ai", text: "Thanks for calling Rivera Plumbing! I'm the AI assistant. How can I help?", delay: 2000, voice: "ai" },
    { type: "caller", text: "Hi, my kitchen sink is leaking pretty badly...", delay: 5500, voice: "caller" },
    { type: "ai", text: "I'm sorry to hear that! I can get a licensed plumber out today. Does 3:00 PM work for you?", delay: 8500, voice: "ai" },
    { type: "caller", text: "Yes, that's perfect!", delay: 12000, voice: "caller" },
    { type: "confirm", text: "✅ Appointment Booked — Today 3:00 PM", delay: 14000, voice: null },
    { type: "notify", text: "📱 Owner notified • Lead scored: High", delay: 15000, voice: null },
];

const SMS_STEPS = [
    { type: "missed", text: "Missed call from (555) 234-7890", delay: 0, voice: null },
    { type: "ai-sms", text: "Hey! Sorry we missed your call. This is Rivera Plumbing's AI assistant. How can I help? 🔧", delay: 1500, voice: null },
    { type: "user-sms", text: "Hi! I need a quote for a bathroom remodel", delay: 3500, voice: null },
    { type: "ai-sms", text: "Great! I can schedule a free estimate. We have openings tomorrow at 9 AM or 2 PM. Which works?", delay: 5500, voice: null },
    { type: "user-sms", text: "2 PM works!", delay: 7500, voice: null },
    { type: "ai-sms", text: "Perfect! ✅ Booked for tomorrow at 2 PM. You'll get a confirmation text shortly!", delay: 8500, voice: null },
    { type: "confirm", text: "📅 Estimate Visit Scheduled — Tomorrow 2:00 PM", delay: 10000, voice: null },
];

const LOOP_DURATION = 17000;

/* ── Voice Engine ──────────────────────── */
function useVoiceEngine() {
    const synthRef = useRef(null);
    const voicesRef = useRef({ ai: null, caller: null });
    const isSpeakingRef = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined" || !window.speechSynthesis) return;
        synthRef.current = window.speechSynthesis;

        const loadVoices = () => {
            const voices = synthRef.current.getVoices();
            if (!voices.length) return;

            /* PRIORITY: en-US voices for natural American English
               1st pick: Google US voices (most natural in Chrome)
               2nd pick: macOS US voices (Samantha, Alex)
               3rd pick: any en-US voice */
            const usVoices = voices.filter(v => v.lang === "en-US");
            const googleUS = usVoices.filter(v => v.name.includes("Google"));
            const naturalUS = usVoices.filter(v =>
                !v.name.includes("Google") && !v.name.includes("Compact")
            );

            /* Best pool: Google US > Natural US > any US > any en */
            const pool = googleUS.length > 1 ? googleUS
                : naturalUS.length > 1 ? naturalUS
                    : usVoices.length > 1 ? usVoices
                        : voices.filter(v => v.lang.startsWith("en"));

            if (pool.length >= 2) {
                /* AI → calmer, professional voice
                   Caller → warmer, conversational voice */
                const callerNames = ["samantha", "google us english 2", "karen",
                    "google us english female", "microsoft zira", "female"];
                const aiNames = ["alex", "google us english", "daniel",
                    "microsoft david", "google us english male", "male", "aaron"];

                const callerVoice = pool.find(v =>
                    callerNames.some(k => v.name.toLowerCase().includes(k))
                );
                const aiVoice = pool.find(v =>
                    aiNames.some(k => v.name.toLowerCase().includes(k)) &&
                    v !== callerVoice
                );

                voicesRef.current.caller = callerVoice || pool[0];
                voicesRef.current.ai = aiVoice || pool[1] || pool[0];
            } else if (pool.length === 1) {
                voicesRef.current.ai = pool[0];
                voicesRef.current.caller = pool[0];
            }
        };

        loadVoices();
        synthRef.current.addEventListener("voiceschanged", loadVoices);
        return () => {
            synthRef.current?.removeEventListener("voiceschanged", loadVoices);
            synthRef.current?.cancel();
        };
    }, []);

    const speak = useCallback((text, role) => {
        if (!synthRef.current || !text) return;

        /* Clean text of emojis/special chars for cleaner speech */
        const cleanText = text.replace(/[📞📱✅📅🔧💬]/g, "").trim();
        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);

        if (role === "ai") {
            utterance.voice = voicesRef.current.ai;
            utterance.pitch = 1.0;    /* Natural pitch — no robot effect */
            utterance.rate = 1.0;     /* Normal speed — professional */
            utterance.volume = 0.85;
        } else if (role === "caller") {
            utterance.voice = voicesRef.current.caller;
            utterance.pitch = 1.05;   /* Slightly warmer */
            utterance.rate = 0.92;    /* Slightly slower — casual, real person */
            utterance.volume = 0.8;
        }

        utterance.onstart = () => { isSpeakingRef.current = true; };
        utterance.onend = () => { isSpeakingRef.current = false; };
        utterance.onerror = () => { isSpeakingRef.current = false; };

        synthRef.current.cancel();
        synthRef.current.speak(utterance);
    }, []);

    const stop = useCallback(() => {
        synthRef.current?.cancel();
        isSpeakingRef.current = false;
    }, []);

    return { speak, stop };
}

export default function DemoModal({ isOpen, onClose }) {
    const [demoType, setDemoType] = useState(null);
    const [activeSteps, setActiveSteps] = useState([]);
    const [wavePhase, setWavePhase] = useState(0);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const cycleRef = useRef(0);
    const modalRef = useRef(null);
    const { speak, stop } = useVoiceEngine();

    // Close on Escape
    useEffect(() => {
        const handleKey = (e) => { if (e.key === "Escape") onClose(); };
        if (isOpen) window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [isOpen, onClose]);

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setDemoType(null);
            setActiveSteps([]);
            setVoiceEnabled(false);
            cycleRef.current++;
            stop();
        }
    }, [isOpen, stop]);

    // Wave animation for call demo
    useEffect(() => {
        if (demoType !== "call") return;
        let raf;
        const animate = () => { setWavePhase((p) => p + 0.06); raf = requestAnimationFrame(animate); };
        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [demoType]);

    // Demo steps animation loop
    useEffect(() => {
        if (!demoType) return;
        const steps = demoType === "call" ? CALL_STEPS : SMS_STEPS;
        const timers = [];
        const cycle = cycleRef.current;

        const run = () => {
            setActiveSteps([]);
            stop();

            steps.forEach((step, i) => {
                const t = setTimeout(() => {
                    if (cycleRef.current !== cycle) return;
                    setActiveSteps((prev) => [...prev, i]);

                    /* Speak the line if voice is on and it's a call demo */
                    if (voiceEnabled && demoType === "call" && step.voice) {
                        speak(step.text, step.voice);
                    }
                }, step.delay);
                timers.push(t);
            });

            // Loop
            const loopTimer = setTimeout(() => {
                if (cycleRef.current !== cycle) return;
                run();
            }, LOOP_DURATION);
            timers.push(loopTimer);
        };
        run();
        return () => { cycleRef.current++; timers.forEach(clearTimeout); stop(); };
    }, [demoType, voiceEnabled, speak, stop]);

    const waveHeights = Array.from({ length: 24 }, (_, i) =>
        Math.abs(Math.sin(wavePhase + i * 0.35)) * 18 + 3
    );

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div ref={modalRef} className={styles.modal} role="dialog" aria-modal="true" aria-label="AI Demo">
                <button className={styles.closeBtn} onClick={onClose} aria-label="Close demo">✕</button>

                {!demoType ? (
                    <div className={styles.chooser}>
                        <h3>Try a 10-Second Demo</h3>
                        <p className={styles.chooserSub}>See how HustleAI handles calls and texts</p>
                        <div className={styles.chooserBtns}>
                            <button onClick={() => { setDemoType("call"); setVoiceEnabled(true); }} className={styles.chooserBtn}>
                                <span className={styles.chooserIcon}>📞</span>
                                <span>Call Demo</span>
                                <span className={styles.chooserHint}>🔊 With voice audio</span>
                            </button>
                            <button onClick={() => setDemoType("sms")} className={styles.chooserBtn}>
                                <span className={styles.chooserIcon}>💬</span>
                                <span>SMS Demo</span>
                                <span className={styles.chooserHint}>AI handles a text thread</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.demoView}>
                        <div className={styles.demoHeader}>
                            <span className={styles.demoDot} />
                            <span>{demoType === "call" ? "Live Call Simulation" : "SMS Thread Simulation"}</span>
                            {/* Voice toggle for call demo */}
                            {demoType === "call" && (
                                <button
                                    className={`${styles.voiceToggle} ${voiceEnabled ? styles.voiceOn : ""}`}
                                    onClick={() => { setVoiceEnabled(v => !v); if (voiceEnabled) stop(); }}
                                    aria-label={voiceEnabled ? "Mute voice" : "Enable voice"}
                                    title={voiceEnabled ? "Voice On" : "Voice Off"}
                                >
                                    {voiceEnabled ? "🔊" : "🔇"}
                                </button>
                            )}
                        </div>

                        {/* Waveform for call only */}
                        {demoType === "call" && (
                            <div className={styles.waveform}>
                                {waveHeights.map((h, i) => (
                                    <div key={i} className={styles.waveBar} style={{ height: `${h}px`, opacity: 0.3 + (h / 21) * 0.7 }} />
                                ))}
                            </div>
                        )}

                        {/* Chat steps */}
                        <div className={styles.chatArea}>
                            {(demoType === "call" ? CALL_STEPS : SMS_STEPS).map((step, i) => (
                                step.text && (
                                    <div
                                        key={i}
                                        className={`${styles.bubble} ${styles[step.type]} ${activeSteps.includes(i) ? styles.visible : ""}`}
                                    >
                                        {step.text}
                                    </div>
                                )
                            ))}
                        </div>

                        <button onClick={() => { setDemoType(null); stop(); }} className={styles.backBtn}>← Try another demo</button>
                    </div>
                )}
            </div>
        </div>
    );
}
