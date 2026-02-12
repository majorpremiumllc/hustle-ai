"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./VoiceDemo.module.css";

/* ═══════════════════════════════════════════════
   Voice Demo (In-Page) — With Audio Playback
   ─────────────────────────────────────────────
   Uses Web Speech API for voice synthesis.
   AI bot → lower pitch, faster rate
   Customer → natural pitch, conversational rate
   Voice auto-plays when section is visible.
   ═══════════════════════════════════════════════ */

const DEMO_STEPS = [
    { type: "incoming", text: "📞 Incoming Call — Mike Rodriguez", delay: 0, voice: null },
    { type: "status", text: "AI Answering...", delay: 1500, voice: null },
    { type: "ai", text: "Thanks for calling Rodriguez Plumbing! How can I help you today?", delay: 3000, voice: "ai" },
    { type: "caller", text: "Hi, I have a leaking pipe in my kitchen...", delay: 6500, voice: "caller" },
    { type: "ai", text: "I can get a technician to you today. How does 2:30 PM work?", delay: 9500, voice: "ai" },
    { type: "caller", text: "Yes, that works perfectly!", delay: 13000, voice: "caller" },
    { type: "notification", text: "✅ Appointment Confirmed — 2:30 PM", delay: 15000, voice: null },
];

const LOOP_DURATION = 18000;

/* ── Voice Engine Hook ────────────────── */
function useVoiceEngine() {
    const synthRef = useRef(null);
    const voicesRef = useRef({ ai: null, caller: null });

    useEffect(() => {
        if (typeof window === "undefined" || !window.speechSynthesis) return;
        synthRef.current = window.speechSynthesis;

        const loadVoices = () => {
            const voices = synthRef.current.getVoices();
            if (!voices.length) return;

            /* PRIORITY: en-US voices for natural American English */
            const usVoices = voices.filter(v => v.lang === "en-US");
            const googleUS = usVoices.filter(v => v.name.includes("Google"));
            const naturalUS = usVoices.filter(v =>
                !v.name.includes("Google") && !v.name.includes("Compact")
            );

            const pool = googleUS.length > 1 ? googleUS
                : naturalUS.length > 1 ? naturalUS
                    : usVoices.length > 1 ? usVoices
                        : voices.filter(v => v.lang.startsWith("en"));

            if (pool.length >= 2) {
                const callerNames = ["samantha", "google us english 2",
                    "google us english female", "microsoft zira", "female"];
                const aiNames = ["alex", "google us english",
                    "microsoft david", "google us english male", "male"];

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
        const cleanText = text.replace(/[📞📱✅🔧💬]/g, "").trim();
        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        if (role === "ai") {
            utterance.voice = voicesRef.current.ai;
            utterance.pitch = 1.0;     /* Natural pitch */
            utterance.rate = 1.0;      /* Normal speed */
            utterance.volume = 0.85;
        } else if (role === "caller") {
            utterance.voice = voicesRef.current.caller;
            utterance.pitch = 1.05;    /* Slightly warmer */
            utterance.rate = 0.92;     /* Casual, relaxed */
            utterance.volume = 0.8;
        }

        synthRef.current.cancel();
        synthRef.current.speak(utterance);
    }, []);

    const stop = useCallback(() => {
        synthRef.current?.cancel();
    }, []);

    return { speak, stop };
}

export default function VoiceDemo() {
    const [activeSteps, setActiveSteps] = useState([]);
    const [wavePhase, setWavePhase] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const containerRef = useRef(null);
    const cycleRef = useRef(0);
    const { speak, stop } = useVoiceEngine();

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0.2 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Stop voice when not visible
    useEffect(() => {
        if (!isVisible) stop();
    }, [isVisible, stop]);

    // Wave animation
    useEffect(() => {
        if (!isVisible) return;
        let raf;
        const animate = () => {
            setWavePhase((p) => p + 0.08);
            raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [isVisible]);

    // Demo loop
    useEffect(() => {
        if (!isVisible) return;
        const timers = [];

        const runCycle = () => {
            const cycle = cycleRef.current;
            setActiveSteps([]);

            DEMO_STEPS.forEach((step, i) => {
                const t = setTimeout(() => {
                    if (cycleRef.current !== cycle) return;
                    setActiveSteps((prev) => [...prev, i]);

                    /* Speak the line if voice is on */
                    if (voiceEnabled && step.voice) {
                        speak(step.text, step.voice);
                    }
                }, step.delay);
                timers.push(t);
            });

            const resetTimer = setTimeout(() => {
                cycleRef.current++;
                runCycle();
            }, LOOP_DURATION);
            timers.push(resetTimer);
        };

        runCycle();
        return () => {
            cycleRef.current++;
            timers.forEach(clearTimeout);
            stop();
        };
    }, [isVisible, voiceEnabled, speak, stop]);

    const waveHeights = Array.from({ length: 32 }, (_, i) =>
        Math.abs(Math.sin(wavePhase + i * 0.3)) * 20 + 3
    );

    return (
        <section ref={containerRef} className={styles.demoSection}>
            <div className="container">
                <div className="text-center reveal">
                    <span className={styles.sectionTag}>See AI in Action</span>
                    <h2>Watch Your AI <span className="text-gradient">Handle a Real Call</span></h2>
                    <p className={styles.sectionSub}>Every call is answered, every lead is captured — automatically.</p>
                </div>

                <div className={`${styles.demoCard} reveal-scale`}>
                    {/* Voice toggle */}
                    <button
                        className={`${styles.voiceToggle} ${voiceEnabled ? styles.voiceOn : ""}`}
                        onClick={() => setVoiceEnabled(v => !v)}
                        aria-label={voiceEnabled ? "Mute voice demo" : "Enable voice demo"}
                        title={voiceEnabled ? "🔊 Voice On" : "🔇 Voice Off — Click to hear the conversation"}
                    >
                        {voiceEnabled ? "🔊" : "🔇"}
                        <span className={styles.voiceLabel}>
                            {voiceEnabled ? "Voice On" : "Listen"}
                        </span>
                    </button>

                    {/* Voice waveform */}
                    <div className={styles.waveform}>
                        {waveHeights.map((h, i) => (
                            <div
                                key={i}
                                className={styles.waveBar}
                                style={{ height: `${h}px`, opacity: 0.3 + (h / 23) * 0.7 }}
                            />
                        ))}
                    </div>

                    {/* Chat simulation */}
                    <div className={styles.chatArea}>
                        {DEMO_STEPS.map((step, i) => (
                            <div
                                key={i}
                                className={`${styles.chatBubble} ${styles[step.type]} ${activeSteps.includes(i) ? styles.visible : ""
                                    }`}
                            >
                                {step.text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
