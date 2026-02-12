"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./DemoModal.module.css";

/* ═══════════════════════════════════════════════
   Demo Modal — Live Call & SMS Simulation
   ─────────────────────────────────────────────
   Voice: Sequential speech queue — each line waits
   for the previous to finish before starting.
   No cancel() mid-sentence, no fixed timers.
   ═══════════════════════════════════════════════ */

const CALL_SCRIPT = [
    { type: "ring", text: "📞 Incoming Call — Sarah M.", speak: null },
    { type: "wave", text: "", speak: null },
    { type: "ai", text: "Thanks for calling Rivera Plumbing! I'm the AI assistant. How can I help?", speak: "ai" },
    { type: "caller", text: "Hi, my kitchen sink is leaking pretty badly...", speak: "caller" },
    { type: "ai", text: "I'm sorry to hear that! I can get a licensed plumber out today. Does 3:00 PM work for you?", speak: "ai" },
    { type: "caller", text: "Yes, that's perfect!", speak: "caller" },
    { type: "confirm", text: "✅ Appointment Booked — Today 3:00 PM", speak: null },
    { type: "notify", text: "📱 Owner notified • Lead scored: High", speak: null },
];

const SMS_SCRIPT = [
    { type: "missed", text: "Missed call from (555) 234-7890", speak: null },
    { type: "ai-sms", text: "Hey! Sorry we missed your call. This is Rivera Plumbing's AI assistant. How can I help? 🔧", speak: null },
    { type: "user-sms", text: "Hi! I need a quote for a bathroom remodel", speak: null },
    { type: "ai-sms", text: "Great! I can schedule a free estimate. We have openings tomorrow at 9 AM or 2 PM. Which works?", speak: null },
    { type: "user-sms", text: "2 PM works!", speak: null },
    { type: "ai-sms", text: "Perfect! ✅ Booked for tomorrow at 2 PM. You'll get a confirmation text shortly!", speak: null },
    { type: "confirm", text: "📅 Estimate Visit Scheduled — Tomorrow 2:00 PM", speak: null },
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

            /* en-US only — no British accents */
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

    /* Process the next item in queue */
    const processQueue = useCallback(() => {
        if (busyRef.current || !queueRef.current.length || !synthRef.current) return;

        const { text, role, onDone } = queueRef.current.shift();
        const cleanText = text.replace(/[📞📱✅📅🔧💬]/g, "").trim();

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
            /* Small pause between lines for natural feel */
            setTimeout(() => processQueue(), 600);
        };
        utterance.onerror = () => {
            busyRef.current = false;
            onDone?.();
            setTimeout(() => processQueue(), 300);
        };

        synthRef.current.speak(utterance);
    }, []);

    /* Enqueue a line to be spoken */
    const enqueue = useCallback((text, role, onDone) => {
        queueRef.current.push({ text, role, onDone });
        processQueue();
    }, [processQueue]);

    /* Stop everything */
    const stop = useCallback(() => {
        queueRef.current = [];
        busyRef.current = false;
        synthRef.current?.cancel();
    }, []);

    return { enqueue, stop };
}

export default function DemoModal({ isOpen, onClose }) {
    const [demoType, setDemoType] = useState(null);
    const [activeSteps, setActiveSteps] = useState([]);
    const [wavePhase, setWavePhase] = useState(0);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const cycleRef = useRef(0);
    const modalRef = useRef(null);
    const runningRef = useRef(false);
    const { enqueue, stop } = useVoiceEngine();

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
            runningRef.current = false;
            stop();
        }
    }, [isOpen, stop]);

    // Wave animation
    useEffect(() => {
        if (demoType !== "call") return;
        let raf;
        const animate = () => { setWavePhase((p) => p + 0.06); raf = requestAnimationFrame(animate); };
        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [demoType]);

    /* ── Sequential Demo Runner ─────────── */
    useEffect(() => {
        if (!demoType) return;
        const script = demoType === "call" ? CALL_SCRIPT : SMS_SCRIPT;
        const cycle = cycleRef.current;
        runningRef.current = true;

        let stepIndex = 0;

        const showNextStep = () => {
            if (cycleRef.current !== cycle || !runningRef.current) return;
            if (stepIndex >= script.length) {
                /* Pause then restart the loop */
                setTimeout(() => {
                    if (cycleRef.current !== cycle) return;
                    stepIndex = 0;
                    setActiveSteps([]);
                    setTimeout(() => showNextStep(), 1000);
                }, 3000);
                return;
            }

            const step = script[stepIndex];
            const currentIdx = stepIndex;

            /* Show the bubble */
            setActiveSteps(prev => [...prev, currentIdx]);

            /* If voice is enabled and this step has speech */
            if (voiceEnabled && demoType === "call" && step.speak) {
                enqueue(step.text, step.speak, () => {
                    /* After speech finishes → show next step */
                    stepIndex++;
                    showNextStep();
                });
            } else {
                /* No speech → just wait a beat then show next */
                const delay = step.text ? 1200 : 800;
                setTimeout(() => {
                    stepIndex++;
                    showNextStep();
                }, delay);
            }
        };

        /* Kick off — small initial delay */
        setTimeout(() => showNextStep(), 500);

        return () => {
            cycleRef.current++;
            runningRef.current = false;
            stop();
        };
    }, [demoType, voiceEnabled, enqueue, stop]);

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

                        {demoType === "call" && (
                            <div className={styles.waveform}>
                                {waveHeights.map((h, i) => (
                                    <div key={i} className={styles.waveBar} style={{ height: `${h}px`, opacity: 0.3 + (h / 21) * 0.7 }} />
                                ))}
                            </div>
                        )}

                        <div className={styles.chatArea}>
                            {(demoType === "call" ? CALL_SCRIPT : SMS_SCRIPT).map((step, i) => (
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
