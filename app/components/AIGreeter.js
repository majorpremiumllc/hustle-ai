"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import styles from "./AIGreeter.module.css";

/* ═══════════════════════════════════════════════
   AI Greeter + Guided Tour
   ─────────────────────────────────────────────
   1. First visit → AI agent prompt appears
   2. User clicks → Welcome greeting plays
   3. "Let me show you" → "Continue" button
   4. Tour: scrolls to each section, narrates it
   5. Tour finished → dismiss gracefully
   ═══════════════════════════════════════════════ */

const WELCOME_AUDIO = "/audio/ai-welcome.mp3";
const STORAGE_KEY = "hustleai_greeted";

const TOUR_STEPS = [
    {
        id: "features",
        title: "Core Features",
        audio: "/audio/tour-features.mp3",
        transcript: "These are the core features that make HustleAI special. From instant call answering to smart appointment booking, we handle everything automatically — so you never miss a single customer again.",
        scrollTo: "features",
    },
    {
        id: "demo",
        title: "Live Demo",
        audio: "/audio/tour-demo.mp3",
        transcript: "Here's a live demo. Click the play button and listen to how our AI handles a real phone call. It sounds just like a human receptionist, but works 24/7.",
        scrollTo: "features", /* VoiceDemo is near features */
        scrollOffset: 600,
    },
    {
        id: "industries",
        title: "Industries We Serve",
        audio: "/audio/tour-industries.mp3",
        transcript: "We work with all kinds of service businesses. Plumbers, electricians, HVAC companies, dental offices, law firms, and more. No matter your industry, HustleAI adapts to your needs.",
        scrollTo: "industries",
    },
    {
        id: "loss",
        title: "What You're Losing",
        audio: "/audio/tour-loss.mp3",
        transcript: "This is your wake-up call. See exactly how many calls you're missing and how much revenue that costs you every single month. The numbers might surprise you.",
        scrollTo: "loss",
        scrollOffset: -80,
    },
    {
        id: "calculator",
        title: "Revenue Calculator",
        audio: "/audio/tour-calculator.mp3",
        transcript: "Use this calculator to see your potential revenue recovery. Enter your numbers and watch how HustleAI turns missed calls into booked appointments and real money.",
        scrollTo: "calculator",
        scrollOffset: -80,
    },
    {
        id: "pricing",
        title: "Pricing",
        audio: "/audio/tour-pricing.mp3",
        transcript: "Ready to stop missing calls? Choose a plan and start your free trial today. No credit card required, and you'll be set up in under five minutes.",
        scrollTo: "pricing",
    },
];

export default function AIGreeter() {
    const [state, setState] = useState("hidden");
    /* hidden → prompt → speaking → tour-prompt → touring → tour-speaking → tour-done → exit */
    const [waveHeights, setWaveHeights] = useState(Array(20).fill(3));
    const [progress, setProgress] = useState(0);
    const [transcript, setTranscript] = useState("");
    const [tourStep, setTourStep] = useState(-1);
    const [tourSpeaking, setTourSpeaking] = useState(false);

    const audioRef = useRef(null);
    const analyserRef = useRef(null);
    const audioCtxRef = useRef(null);
    const rafRef = useRef(null);
    const mountedRef = useRef(true);

    const FULL_TEXT = "Hey! Welcome to HustleAI. I'm your AI business assistant. We answer your calls 24/7, book appointments automatically, and make sure you never miss another lead. Let me show you how it works!";

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    /* ── Check if already greeted ────── */
    useEffect(() => {
        if (typeof window === "undefined") return;
        const greeted = sessionStorage.getItem(STORAGE_KEY);
        if (!greeted) {
            const t = setTimeout(() => {
                if (mountedRef.current) setState("prompt");
            }, 1500);
            return () => clearTimeout(t);
        }
    }, []);

    /* ── Waveform animation ─────────── */
    useEffect(() => {
        if (state !== "speaking" && !tourSpeaking) return;
        const animate = () => {
            if (analyserRef.current) {
                const data = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteFrequencyData(data);
                const heights = Array.from({ length: 20 }, (_, i) => {
                    const idx = Math.floor(i * data.length / 20);
                    return Math.max(3, (data[idx] / 255) * 32);
                });
                setWaveHeights(heights);
            }
            rafRef.current = requestAnimationFrame(animate);
        };
        rafRef.current = requestAnimationFrame(animate);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [state, tourSpeaking]);

    /* ── Transcript animation for welcome ──────── */
    useEffect(() => {
        if (state !== "speaking") return;
        const words = FULL_TEXT.split(" ");
        const totalDuration = 10000;
        const perWord = totalDuration / words.length;
        const timers = [];
        words.forEach((_, i) => {
            const t = setTimeout(() => {
                if (!mountedRef.current) return;
                setTranscript(words.slice(0, i + 1).join(" "));
                setProgress(((i + 1) / words.length) * 100);
            }, i * perWord);
            timers.push(t);
        });
        return () => timers.forEach(clearTimeout);
    }, [state]);

    /* ── Play audio helper ──────────── */
    const playAudio = useCallback((src) => {
        return new Promise((resolve, reject) => {
            try {
                // Cleanup previous
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                }
                if (audioCtxRef.current) {
                    try { audioCtxRef.current.close(); } catch (e) { /* ok */ }
                }

                const audio = new Audio(src);
                audioRef.current = audio;

                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                audioCtxRef.current = ctx;
                const source = ctx.createMediaElementSource(audio);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 64;
                source.connect(analyser);
                analyser.connect(ctx.destination);
                analyserRef.current = analyser;

                audio.onended = () => resolve();
                audio.onerror = () => reject(new Error("Audio failed"));

                audio.play().catch(reject);
            } catch (e) {
                reject(e);
            }
        });
    }, []);

    /* ── Play welcome greeting ──────── */
    const playGreeting = useCallback(async () => {
        setState("speaking");
        sessionStorage.setItem(STORAGE_KEY, "true");

        try {
            await playAudio(WELCOME_AUDIO);
        } catch (e) {
            console.warn("Greeting audio failed:", e);
        }

        if (!mountedRef.current) return;
        setState("tour-prompt");
    }, [playAudio]);

    /* ── Start tour ─────────────────── */
    const startTour = useCallback(() => {
        setState("touring");
        setTourStep(0);
    }, []);

    /* ── Play current tour step ─────── */
    useEffect(() => {
        if (state !== "touring" || tourStep < 0 || tourStep >= TOUR_STEPS.length) return;

        const step = TOUR_STEPS[tourStep];

        /* Scroll to section */
        const el = document.getElementById(step.scrollTo);
        if (el) {
            const offset = step.scrollOffset || 0;
            const y = el.getBoundingClientRect().top + window.scrollY + offset - 120;
            window.scrollTo({ top: y, behavior: "smooth" });
        }

        /* Brief delay for scroll, then play */
        const t = setTimeout(async () => {
            if (!mountedRef.current) return;

            /* Animate transcript word by word */
            setTranscript("");
            setTourSpeaking(true);
            const words = step.transcript.split(" ");
            const perWord = 8000 / words.length; /* ~8s per narration */
            const wordTimers = [];
            words.forEach((_, i) => {
                const wt = setTimeout(() => {
                    if (!mountedRef.current) return;
                    setTranscript(words.slice(0, i + 1).join(" "));
                    setProgress(((i + 1) / words.length) * 100);
                }, i * perWord);
                wordTimers.push(wt);
            });

            try {
                await playAudio(step.audio);
            } catch (e) {
                console.warn("Tour audio failed:", e);
                /* Wait 5s fallback */
                await new Promise(r => setTimeout(r, 5000));
            }

            wordTimers.forEach(clearTimeout);
            if (!mountedRef.current) return;

            setTranscript(step.transcript);
            setProgress(100);
            setTourSpeaking(false);
        }, 800);

        return () => clearTimeout(t);
    }, [state, tourStep, playAudio]);

    /* ── Next tour step ─────────────── */
    const nextTourStep = useCallback(() => {
        if (tourStep + 1 >= TOUR_STEPS.length) {
            /* Tour complete */
            setState("tour-done");
            setTimeout(() => {
                if (!mountedRef.current) return;
                setState("exit");
                setTimeout(() => setState("hidden"), 500);
            }, 3000);
        } else {
            setTourStep(s => s + 1);
            setProgress(0);
            setTranscript("");
        }
    }, [tourStep]);

    /* ── Dismiss ────────────────────── */
    const dismiss = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (audioCtxRef.current) {
            try { audioCtxRef.current.close(); } catch (e) { /* ok */ }
        }
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        sessionStorage.setItem(STORAGE_KEY, "true");
        setState("exit");
        setTimeout(() => setState("hidden"), 500);
    }, []);

    /* ── Skip tour ──────────────────── */
    const skipTour = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        dismiss();
    }, [dismiss]);

    if (state === "hidden") return null;

    const currentStep = TOUR_STEPS[tourStep];
    const isSpeaking = state === "speaking" || tourSpeaking;

    return (
        <div className={`${styles.greeter} ${state === "exit" ? styles.exit : ""}`}>

            {/* ══ Prompt: Click to hear ══ */}
            {state === "prompt" && (
                <button className={styles.promptBtn} onClick={playGreeting}>
                    <div className={styles.avatarWrap}>
                        <Image src="/images/ai-agent.png" alt="AI Assistant" width={56} height={56} className={styles.avatar} />
                        <span className={styles.avatarPulse} />
                        <span className={styles.avatarPulse2} />
                    </div>
                    <div className={styles.promptText}>
                        <span className={styles.promptName}>AI Assistant</span>
                        <span className={styles.promptHint}>🔊 Click to hear about HustleAI</span>
                    </div>
                    <span className={styles.playIcon}>▶</span>
                </button>
            )}

            {/* ══ Speaking (Welcome) ══ */}
            {state === "speaking" && (
                <div className={styles.card}>
                    <button className={styles.dismissBtn} onClick={dismiss} aria-label="Close">✕</button>
                    <div className={styles.cardHeader}>
                        <div className={styles.avatarSmall}>
                            <Image src="/images/ai-agent.png" alt="AI Assistant" width={40} height={40} className={styles.avatar} />
                            <span className={styles.speakingRing} />
                        </div>
                        <div className={styles.headerInfo}>
                            <span className={styles.agentName}>AI Assistant</span>
                            <span className={styles.agentStatus}>Speaking...</span>
                        </div>
                    </div>
                    <div className={styles.waveform}>
                        {waveHeights.map((h, i) => (
                            <div key={i} className={styles.waveBar} style={{ height: `${h}px` }} />
                        ))}
                    </div>
                    <div className={styles.transcript}>{transcript || "..."}</div>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}

            {/* ══ Tour Prompt: Continue? ══ */}
            {state === "tour-prompt" && (
                <div className={styles.card}>
                    <button className={styles.dismissBtn} onClick={dismiss} aria-label="Close">✕</button>
                    <div className={styles.cardHeader}>
                        <div className={styles.avatarSmall}>
                            <Image src="/images/ai-agent.png" alt="AI Assistant" width={40} height={40} className={styles.avatar} />
                        </div>
                        <div className={styles.headerInfo}>
                            <span className={styles.agentName}>AI Assistant</span>
                            <span className={styles.agentStatus}>Ready to guide you</span>
                        </div>
                    </div>
                    <div className={styles.tourPromptText}>
                        Want me to walk you through the site? I&apos;ll show you each feature.
                    </div>
                    <div className={styles.tourPromptBtns}>
                        <button className={styles.tourStartBtn} onClick={startTour}>
                            ▶ Yes, show me
                        </button>
                        <button className={styles.tourSkipBtn} onClick={dismiss}>
                            Maybe later
                        </button>
                    </div>
                </div>
            )}

            {/* ══ Touring (Active narration) ══ */}
            {(state === "touring" || state === "tour-done") && currentStep && (
                <div className={styles.card}>
                    <button className={styles.dismissBtn} onClick={skipTour} aria-label="Close">✕</button>

                    {/* Step indicator */}
                    <div className={styles.tourSteps}>
                        {TOUR_STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={`${styles.stepDot} ${i === tourStep ? styles.stepActive : ""} ${i < tourStep ? styles.stepDone : ""}`}
                            />
                        ))}
                    </div>

                    <div className={styles.cardHeader}>
                        <div className={styles.avatarSmall}>
                            <Image src="/images/ai-agent.png" alt="AI Assistant" width={40} height={40} className={styles.avatar} />
                            {tourSpeaking && <span className={styles.speakingRing} />}
                        </div>
                        <div className={styles.headerInfo}>
                            <span className={styles.agentName}>{currentStep.title}</span>
                            <span className={styles.agentStatus}>
                                {tourSpeaking ? "Speaking..." : `Step ${tourStep + 1} of ${TOUR_STEPS.length}`}
                            </span>
                        </div>
                    </div>

                    {/* Waveform */}
                    {tourSpeaking && (
                        <div className={styles.waveform}>
                            {waveHeights.map((h, i) => (
                                <div key={i} className={styles.waveBar} style={{ height: `${h}px` }} />
                            ))}
                        </div>
                    )}

                    {/* Transcript */}
                    <div className={styles.transcript}>{transcript || "..."}</div>

                    {/* Progress */}
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                    </div>

                    {/* Navigation */}
                    {!tourSpeaking && (
                        <div className={styles.tourNav}>
                            <button className={styles.tourSkipBtn} onClick={skipTour}>
                                End tour
                            </button>
                            <button className={styles.tourNextBtn} onClick={nextTourStep}>
                                {tourStep + 1 >= TOUR_STEPS.length ? "Finish ✓" : "Continue →"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ══ Tour Done ══ */}
            {state === "tour-done" && !currentStep && (
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.avatarSmall}>
                            <Image src="/images/ai-agent.png" alt="AI Assistant" width={40} height={40} className={styles.avatar} />
                        </div>
                        <div className={styles.headerInfo}>
                            <span className={styles.agentName}>Tour Complete!</span>
                            <span className={styles.agentStatus}>Thanks for watching 🎉</span>
                        </div>
                    </div>
                    <div className={styles.transcript}>
                        That&apos;s everything! Ready to get started? Pick a plan above and launch your AI assistant in minutes.
                    </div>
                </div>
            )}
        </div>
    );
}
