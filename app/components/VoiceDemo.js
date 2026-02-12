"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./VoiceDemo.module.css";

/* ═══════════════════════════════════════════════
   Voice Demo (In-Page) — ElevenLabs Audio
   ─────────────────────────────────────────────
   Pre-generated MP3 files, sequential playback,
   waveform synchronized to audio analyser.
   ═══════════════════════════════════════════════ */

const DEMO_SCRIPT = [
    { type: "incoming", text: "📞 Incoming Call — Mike Rodriguez", speak: null },
    { type: "status", text: "AI Answering...", speak: null },
    { type: "ai", text: "Thanks for calling Rivera Plumbing! I'm the AI assistant. How can I help you today?", audio: "/audio/ai-1.mp3" },
    { type: "caller", text: "Hi, yeah, my kitchen sink is leaking pretty badly. I need someone to come take a look at it as soon as possible.", audio: "/audio/caller-1.mp3" },
    { type: "ai", text: "I'm sorry to hear that! I can get a licensed plumber out to you today. Does 3:00 PM work for you?", audio: "/audio/ai-2.mp3" },
    { type: "caller", text: "Yes, 3 PM works great. Thank you so much!", audio: "/audio/caller-2.mp3" },
    { type: "notification", text: "✅ Appointment Confirmed — 2:30 PM", speak: null },
];

export default function VoiceDemo() {
    const [activeSteps, setActiveSteps] = useState([]);
    const [wavePhase, setWavePhase] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [typing, setTyping] = useState(null);
    const containerRef = useRef(null);
    const cycleRef = useRef(0);
    const runningRef = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0.2 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    /* Wave animation */
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

    /* Sequential demo runner */
    useEffect(() => {
        if (!isVisible) return;
        const cycle = ++cycleRef.current;
        runningRef.current = true;

        const guard = () => cycleRef.current === cycle && runningRef.current;
        const wait = (ms) => new Promise(r => setTimeout(r, ms));

        const playAudio = (src) => new Promise((resolve) => {
            try {
                const audio = new Audio(src);
                audio.onended = resolve;
                audio.onerror = resolve;
                audio.play().catch(resolve);
            } catch {
                resolve();
            }
        });

        const run = async () => {
            while (guard()) {
                setActiveSteps([]);
                setTyping(null);

                for (let i = 0; i < DEMO_SCRIPT.length; i++) {
                    if (!guard()) return;
                    const step = DEMO_SCRIPT[i];

                    /* Show typing indicator for voice lines */
                    if (step.audio && voiceEnabled) {
                        setTyping(step.type);
                        await wait(600);
                        if (!guard()) return;
                    }

                    /* Show bubble */
                    setTyping(null);
                    setActiveSteps(prev => [...prev, i]);

                    /* Play audio if enabled */
                    if (voiceEnabled && step.audio) {
                        await playAudio(step.audio);
                        await wait(500);
                    } else {
                        await wait(step.text ? 1200 : 800);
                    }
                }

                /* Pause then loop */
                await wait(4000);
                if (!guard()) return;
            }
        };

        run();

        return () => {
            cycleRef.current++;
            runningRef.current = false;
        };
    }, [isVisible, voiceEnabled]);

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
                        title={voiceEnabled ? "🔊 Voice On" : "🔇 Click to hear the conversation"}
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
                                className={`${styles.chatBubble} ${styles[step.type]} ${activeSteps.includes(i) ? styles.visible : ""}`}
                            >
                                {step.type === "ai" && <span className={styles.bubbleLabel}>AI Assistant</span>}
                                {step.type === "caller" && <span className={styles.bubbleLabel}>Mike R.</span>}
                                <span>{step.text}</span>
                            </div>
                        ))}

                        {typing && (
                            <div className={`${styles.chatBubble} ${styles[typing]} ${styles.visible}`}>
                                {typing === "ai" && <span className={styles.bubbleLabel}>AI Assistant</span>}
                                {typing === "caller" && <span className={styles.bubbleLabel}>Mike R.</span>}
                                <span className={styles.typingDots}>
                                    <span /><span /><span />
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
