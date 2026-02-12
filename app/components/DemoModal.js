"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./DemoModal.module.css";

/* ═══════════════════════════════════════════════
   Premium Call Simulation — ElevenLabs Voices
   ─────────────────────────────────────────────
   • Phone ring tone (Web Audio API)
   • ElevenLabs pre-generated voices (Josh + Rachel)
   • Call timer, waveform synced to audio
   • Premium animations and transitions
   ═══════════════════════════════════════════════ */

/* ── Call Script ──────────────────────── */
const CALL_SCRIPT = [
    { phase: "ring", label: "📞 Incoming Call", sub: "Sarah M. • (555) 891-4023", audio: null, duration: 3000 },
    { phase: "pickup", label: "Call Connected", sub: null, audio: null, duration: 800 },
    { phase: "ai", label: null, text: "Thanks for calling Rivera Plumbing! I'm the AI assistant. How can I help you today?", audio: "/audio/ai-1.mp3" },
    { phase: "caller", label: null, text: "Hi, yeah, my kitchen sink is leaking pretty badly. I need someone to come take a look at it as soon as possible.", audio: "/audio/caller-1.mp3" },
    { phase: "ai", label: null, text: "I'm sorry to hear that! I can get a licensed plumber out to you today. Does 3:00 PM work for you?", audio: "/audio/ai-2.mp3" },
    { phase: "caller", label: null, text: "Yes, 3 PM works great. Thank you so much!", audio: "/audio/caller-2.mp3" },
    { phase: "ai", label: null, text: "Perfect! I've booked a plumber for 3 PM today. You'll receive a confirmation text shortly. Is there anything else I can help with?", audio: "/audio/ai-3.mp3" },
    { phase: "confirm", label: "✅ Appointment Booked", sub: "Today 3:00 PM • Plumber dispatched", audio: null, duration: 2000 },
    { phase: "notify", label: "📱 Owner Notified", sub: "Lead scored: High • Revenue: $350+", audio: null, duration: 2000 },
];

const SMS_SCRIPT = [
    { type: "missed", text: "Missed call from (555) 234-7890" },
    { type: "ai-sms", text: "Hey! Sorry we missed your call. This is Rivera Plumbing's AI assistant. How can I help? 🔧" },
    { type: "user-sms", text: "Hi! I need a quote for a bathroom remodel" },
    { type: "ai-sms", text: "Great! I can schedule a free estimate. We have openings tomorrow at 9 AM or 2 PM. Which works?" },
    { type: "user-sms", text: "2 PM works!" },
    { type: "ai-sms", text: "Perfect! ✅ Booked for tomorrow at 2 PM. You'll get a confirmation text shortly!" },
    { type: "confirm", text: "📅 Estimate Visit Scheduled — Tomorrow 2:00 PM" },
];

/* ── Phone Ring Tone (Web Audio API) ────── */
function usePhoneRing() {
    const ctxRef = useRef(null);
    const oscillatorsRef = useRef([]);

    const ring = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            ctxRef.current = ctx;

            /* US phone ring: 440Hz + 480Hz dual tone, 2s on / 4s off */
            const playRingBurst = (startAt) => {
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const gain = ctx.createGain();

                osc1.frequency.value = 440;
                osc2.frequency.value = 480;
                osc1.type = "sine";
                osc2.type = "sine";

                gain.gain.setValueAtTime(0, startAt);
                gain.gain.linearRampToValueAtTime(0.15, startAt + 0.05);
                gain.gain.setValueAtTime(0.15, startAt + 0.9);
                gain.gain.linearRampToValueAtTime(0, startAt + 1.0);

                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(ctx.destination);

                osc1.start(startAt);
                osc1.stop(startAt + 1.0);
                osc2.start(startAt);
                osc2.stop(startAt + 1.0);

                oscillatorsRef.current.push(osc1, osc2);
            };

            const now = ctx.currentTime;
            playRingBurst(now);
            playRingBurst(now + 1.5);

        } catch (e) {
            console.warn("Phone ring not supported:", e);
        }
    }, []);

    const stopRing = useCallback(() => {
        oscillatorsRef.current.forEach(o => { try { o.stop(); } catch (e) { /* already stopped */ } });
        oscillatorsRef.current = [];
        ctxRef.current?.close();
    }, []);

    return { ring, stopRing };
}

/* ── Audio Player ────────────────────── */
function useAudioPlayer() {
    const audioRef = useRef(null);
    const analyserRef = useRef(null);
    const dataRef = useRef(new Uint8Array(0));

    const play = useCallback((src) => {
        return new Promise((resolve, reject) => {
            try {
                const audio = new Audio(src);
                audioRef.current = audio;

                /* Set up analyser for waveform visualization */
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const source = ctx.createMediaElementSource(audio);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 64;
                source.connect(analyser);
                analyser.connect(ctx.destination);
                analyserRef.current = analyser;
                dataRef.current = new Uint8Array(analyser.frequencyBinCount);

                audio.onended = () => {
                    resolve();
                    ctx.close();
                };
                audio.onerror = () => {
                    reject(new Error("Audio failed"));
                    ctx.close();
                };
                audio.play().catch(reject);
            } catch (e) {
                reject(e);
            }
        });
    }, []);

    const stop = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current = null;
        }
    }, []);

    const getWaveData = useCallback(() => {
        if (analyserRef.current) {
            analyserRef.current.getByteFrequencyData(dataRef.current);
            return dataRef.current;
        }
        return null;
    }, []);

    return { play, stop, getWaveData };
}

export default function DemoModal({ isOpen, onClose }) {
    const [demoType, setDemoType] = useState(null);
    const [phase, setPhase] = useState("idle"); /* idle | ring | active | done */
    const [messages, setMessages] = useState([]);
    const [callTime, setCallTime] = useState(0);
    const [waveHeights, setWaveHeights] = useState(Array(24).fill(3));
    const [typing, setTyping] = useState(null); /* "ai" | "caller" | null */
    const [smsSteps, setSmsSteps] = useState([]);

    const cycleRef = useRef(0);
    const runningRef = useRef(false);
    const modalRef = useRef(null);

    const { ring, stopRing } = usePhoneRing();
    const { play, stop: stopAudio, getWaveData } = useAudioPlayer();

    /* ── Close & Reset ────────────────── */
    useEffect(() => {
        const handleKey = (e) => { if (e.key === "Escape") onClose(); };
        if (isOpen) window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen) {
            setDemoType(null);
            setPhase("idle");
            setMessages([]);
            setCallTime(0);
            setTyping(null);
            setSmsSteps([]);
            cycleRef.current++;
            runningRef.current = false;
            stopRing();
            stopAudio();
        }
    }, [isOpen, stopRing, stopAudio]);

    /* ── Call Timer ────────────────────── */
    useEffect(() => {
        if (phase !== "active") return;
        const iv = setInterval(() => setCallTime(t => t + 1), 1000);
        return () => clearInterval(iv);
    }, [phase]);

    /* ── Waveform Sync ────────────────── */
    useEffect(() => {
        if (phase !== "active") return;
        let raf;
        const animate = () => {
            const data = getWaveData();
            if (data && data.length > 0) {
                const heights = Array.from({ length: 24 }, (_, i) => {
                    const idx = Math.floor(i * data.length / 24);
                    return Math.max(3, (data[idx] / 255) * 28);
                });
                setWaveHeights(heights);
            } else {
                /* Subtle idle animation */
                setWaveHeights(prev => prev.map((_, i) =>
                    3 + Math.abs(Math.sin(Date.now() / 400 + i * 0.3)) * 5
                ));
            }
            raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [phase, getWaveData]);

    /* ── Call Demo Runner ─────────────── */
    const startCallDemo = useCallback(async () => {
        const cycle = ++cycleRef.current;
        runningRef.current = true;
        setDemoType("call");

        const guard = () => cycleRef.current === cycle && runningRef.current;
        const wait = (ms) => new Promise(r => setTimeout(r, ms));

        /* Phase 1: Ring */
        setPhase("ring");
        ring();
        await wait(3000);
        if (!guard()) return;
        stopRing();

        /* Phase 2: Active call */
        setPhase("active");
        setCallTime(0);
        await wait(600);

        /* Phase 3: Conversation */
        const voiceSteps = CALL_SCRIPT.filter(s => s.audio);
        for (const step of voiceSteps) {
            if (!guard()) return;

            /* Show typing indicator */
            setTyping(step.phase);
            await wait(800);
            if (!guard()) return;

            /* Show message bubble */
            setTyping(null);
            setMessages(prev => [...prev, { type: step.phase, text: step.text }]);

            /* Play audio and wait for it to finish */
            try {
                await play(step.audio);
            } catch (e) {
                console.warn("Audio play error:", e);
                await wait(2000);
            }

            /* Pause between messages */
            await wait(700);
        }

        if (!guard()) return;

        /* Phase 4: Confirmation */
        setMessages(prev => [...prev, { type: "confirm", text: "✅ Appointment Booked — Today 3:00 PM" }]);
        await wait(1500);
        if (!guard()) return;

        setMessages(prev => [...prev, { type: "notify", text: "📱 Owner notified • Lead scored: High" }]);
        await wait(2000);
        if (!guard()) return;

        setPhase("done");

        /* Wait then loop */
        await wait(4000);
        if (!guard()) return;
        setPhase("idle");
        setMessages([]);
        setCallTime(0);
        startCallDemo();
    }, [ring, stopRing, play]);

    /* ── SMS Demo Runner ──────────────── */
    useEffect(() => {
        if (demoType !== "sms") return;
        const cycle = cycleRef.current;
        const timers = [];

        const run = () => {
            setSmsSteps([]);
            SMS_SCRIPT.forEach((_, i) => {
                const t = setTimeout(() => {
                    if (cycleRef.current !== cycle) return;
                    setSmsSteps(prev => [...prev, i]);
                }, (i + 1) * 1500);
                timers.push(t);
            });
            const loopT = setTimeout(() => {
                if (cycleRef.current !== cycle) return;
                run();
            }, (SMS_SCRIPT.length + 2) * 1500);
            timers.push(loopT);
        };
        run();
        return () => { cycleRef.current++; timers.forEach(clearTimeout); };
    }, [demoType]);

    /* ── Format time ──────────────────── */
    const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div ref={modalRef} className={styles.modal} role="dialog" aria-modal="true" aria-label="AI Demo">
                <button className={styles.closeBtn} onClick={onClose} aria-label="Close demo">✕</button>

                {!demoType ? (
                    /* ── Chooser ────────────── */
                    <div className={styles.chooser}>
                        <h3>Try a 10-Second Demo</h3>
                        <p className={styles.chooserSub}>See how HustleAI handles calls and texts</p>
                        <div className={styles.chooserBtns}>
                            <button onClick={startCallDemo} className={styles.chooserBtn}>
                                <span className={styles.chooserIcon}>📞</span>
                                <span>Call Demo</span>
                                <span className={styles.chooserHint}>🔊 With realistic AI voice</span>
                            </button>
                            <button onClick={() => { setDemoType("sms"); cycleRef.current++; }} className={styles.chooserBtn}>
                                <span className={styles.chooserIcon}>💬</span>
                                <span>SMS Demo</span>
                                <span className={styles.chooserHint}>AI handles a text thread</span>
                            </button>
                        </div>
                    </div>

                ) : demoType === "call" ? (
                    /* ── Call Demo ──────────── */
                    <div className={styles.demoView}>
                        {/* Header */}
                        <div className={styles.callHeader}>
                            {phase === "ring" ? (
                                <>
                                    <div className={styles.callerAvatar}>
                                        <span className={styles.avatarLetter}>S</span>
                                        <span className={styles.ringPulse} />
                                        <span className={styles.ringPulse2} />
                                    </div>
                                    <div className={styles.callerInfo}>
                                        <span className={styles.callerName}>Sarah M.</span>
                                        <span className={styles.callerNumber}>(555) 891-4023</span>
                                    </div>
                                    <div className={styles.ringLabel}>Incoming Call...</div>
                                </>
                            ) : (
                                <>
                                    <span className={`${styles.liveDot} ${phase === "active" ? styles.liveDotActive : ""}`} />
                                    <span className={styles.headerTitle}>
                                        {phase === "done" ? "Call Ended" : "Live Call"}
                                    </span>
                                    <span className={styles.headerSub}>Sarah M. • (555) 891-4023</span>
                                    {phase === "active" && (
                                        <span className={styles.callTimer}>{formatTime(callTime)}</span>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Waveform */}
                        {(phase === "active" || phase === "done") && (
                            <div className={styles.waveform}>
                                {waveHeights.map((h, i) => (
                                    <div
                                        key={i}
                                        className={styles.waveBar}
                                        style={{
                                            height: `${h}px`,
                                            opacity: 0.3 + (h / 28) * 0.7,
                                            background: phase === "done"
                                                ? "rgba(255,255,255,0.15)"
                                                : undefined
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Chat */}
                        <div className={styles.chatArea}>
                            {messages.map((msg, i) => (
                                <div key={i} className={`${styles.bubble} ${styles[msg.type]} ${styles.visible}`}>
                                    {msg.type === "ai" && <span className={styles.bubbleLabel}>AI Assistant</span>}
                                    {msg.type === "caller" && <span className={styles.bubbleLabel}>Sarah M.</span>}
                                    <span>{msg.text}</span>
                                </div>
                            ))}

                            {/* Typing indicator */}
                            {typing && (
                                <div className={`${styles.bubble} ${styles[typing]} ${styles.visible}`}>
                                    {typing === "ai" && <span className={styles.bubbleLabel}>AI Assistant</span>}
                                    {typing === "caller" && <span className={styles.bubbleLabel}>Sarah M.</span>}
                                    <span className={styles.typingDots}>
                                        <span /><span /><span />
                                    </span>
                                </div>
                            )}
                        </div>

                        <button onClick={() => { setDemoType(null); setPhase("idle"); setMessages([]); setCallTime(0); stopAudio(); cycleRef.current++; runningRef.current = false; }} className={styles.backBtn}>← Try another demo</button>
                    </div>

                ) : (
                    /* ── SMS Demo ───────────── */
                    <div className={styles.demoView}>
                        <div className={styles.demoHeader}>
                            <span className={styles.demoDot} />
                            <span>SMS Thread Simulation</span>
                        </div>
                        <div className={styles.chatArea}>
                            {SMS_SCRIPT.map((step, i) => (
                                <div
                                    key={i}
                                    className={`${styles.bubble} ${styles[step.type]} ${smsSteps.includes(i) ? styles.visible : ""}`}
                                >
                                    {step.text}
                                </div>
                            ))}
                        </div>
                        <button onClick={() => { setDemoType(null); cycleRef.current++; }} className={styles.backBtn}>← Try another demo</button>
                    </div>
                )}
            </div>
        </div>
    );
}
