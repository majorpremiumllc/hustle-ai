"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./VoiceDemo.module.css";

/* ═══════════════════════════════════════════════
   Voice Demo (In-Page) — Sequential Speech Queue
   ─────────────────────────────────────────────
   Each spoken line waits for the previous to finish.
   No cancel() mid-sentence. Natural pauses.
   ═══════════════════════════════════════════════ */

const DEMO_SCRIPT = [
    { type: "incoming", text: "📞 Incoming Call — Mike Rodriguez", speak: null },
    { type: "status", text: "AI Answering...", speak: null },
    { type: "ai", text: "Thanks for calling Rodriguez Plumbing! How can I help you today?", speak: "ai" },
    { type: "caller", text: "Hi, I have a leaking pipe in my kitchen...", speak: "caller" },
    { type: "ai", text: "I can get a technician to you today. How does 2:30 PM work?", speak: "ai" },
    { type: "caller", text: "Yes, that works perfectly!", speak: "caller" },
    { type: "notification", text: "✅ Appointment Confirmed — 2:30 PM", speak: null },
];

/* ── Voice Engine (Sequential Queue) ────── */
function useVoiceEngine() {
    const synthRef = useRef(null);
    const voicesRef = useRef({ ai: null, caller: null });
    const queueRef = useRef([]);
    const busyRef = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined" || !window.speechSynthesis) return;
        synthRef.current = window.speechSynthesis;

        const loadVoices = () => {
            const voices = synthRef.current.getVoices();
            if (!voices.length) return;

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

    const processQueue = useCallback(() => {
        if (busyRef.current || !queueRef.current.length || !synthRef.current) return;

        const { text, role, onDone } = queueRef.current.shift();
        const cleanText = text.replace(/[📞📱✅🔧💬]/g, "").trim();

        if (!cleanText) {
            onDone?.();
            processQueue();
            return;
        }

        busyRef.current = true;
        const utterance = new SpeechSynthesisUtterance(cleanText);

        if (role === "ai") {
            utterance.voice = voicesRef.current.ai;
            utterance.pitch = 1.0;
            utterance.rate = 0.95;
            utterance.volume = 0.85;
        } else {
            utterance.voice = voicesRef.current.caller;
            utterance.pitch = 1.05;
            utterance.rate = 0.9;
            utterance.volume = 0.8;
        }

        utterance.onend = () => {
            busyRef.current = false;
            onDone?.();
            setTimeout(() => processQueue(), 600);
        };
        utterance.onerror = () => {
            busyRef.current = false;
            onDone?.();
            setTimeout(() => processQueue(), 300);
        };

        synthRef.current.speak(utterance);
    }, []);

    const enqueue = useCallback((text, role, onDone) => {
        queueRef.current.push({ text, role, onDone });
        processQueue();
    }, [processQueue]);

    const stop = useCallback(() => {
        queueRef.current = [];
        busyRef.current = false;
        synthRef.current?.cancel();
    }, []);

    return { enqueue, stop };
}

export default function VoiceDemo() {
    const [activeSteps, setActiveSteps] = useState([]);
    const [wavePhase, setWavePhase] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const containerRef = useRef(null);
    const cycleRef = useRef(0);
    const runningRef = useRef(false);
    const { enqueue, stop } = useVoiceEngine();

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0.2 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Stop voice when scrolling away
    useEffect(() => {
        if (!isVisible) {
            stop();
            runningRef.current = false;
        }
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

    /* ── Sequential Demo Runner ─────────── */
    useEffect(() => {
        if (!isVisible) return;
        const cycle = cycleRef.current;
        runningRef.current = true;

        let stepIndex = 0;

        const showNextStep = () => {
            if (cycleRef.current !== cycle || !runningRef.current) return;
            if (stepIndex >= DEMO_SCRIPT.length) {
                setTimeout(() => {
                    if (cycleRef.current !== cycle) return;
                    stepIndex = 0;
                    setActiveSteps([]);
                    setTimeout(() => showNextStep(), 1000);
                }, 3000);
                return;
            }

            const step = DEMO_SCRIPT[stepIndex];
            const currentIdx = stepIndex;

            setActiveSteps(prev => [...prev, currentIdx]);

            if (voiceEnabled && step.speak) {
                enqueue(step.text, step.speak, () => {
                    stepIndex++;
                    showNextStep();
                });
            } else {
                const delay = step.text ? 1200 : 800;
                setTimeout(() => {
                    stepIndex++;
                    showNextStep();
                }, delay);
            }
        };

        setTimeout(() => showNextStep(), 500);

        return () => {
            cycleRef.current++;
            runningRef.current = false;
            stop();
        };
    }, [isVisible, voiceEnabled, enqueue, stop]);

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

                    <div className={styles.waveform}>
                        {waveHeights.map((h, i) => (
                            <div
                                key={i}
                                className={styles.waveBar}
                                style={{ height: `${h}px`, opacity: 0.3 + (h / 23) * 0.7 }}
                            />
                        ))}
                    </div>

                    <div className={styles.chatArea}>
                        {DEMO_SCRIPT.map((step, i) => (
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
