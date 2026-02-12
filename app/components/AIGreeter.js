"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import styles from "./AIGreeter.module.css";

/* ═══════════════════════════════════════════════
   AI Greeter — Welcome Agent Widget
   ─────────────────────────────────────────────
   A floating AI agent that greets first-time visitors
   with a realistic ElevenLabs voice introduction.

   Features:
   • Photorealistic AI avatar with glow ring
   • Waveform visualization synced to audio
   • Auto-plays on first visit (with user interaction)
   • Dismissible with smooth exit animation
   • Remembers if user already heard the greeting
   ═══════════════════════════════════════════════ */

const WELCOME_AUDIO = "/audio/ai-welcome.mp3";
const STORAGE_KEY = "hustleai_greeted";

export default function AIGreeter() {
    const [state, setState] = useState("hidden");
    /* hidden → prompt → speaking → done → exit */
    const [waveHeights, setWaveHeights] = useState(Array(20).fill(3));
    const [progress, setProgress] = useState(0);
    const [transcript, setTranscript] = useState("");

    const audioRef = useRef(null);
    const analyserRef = useRef(null);
    const rafRef = useRef(null);

    const FULL_TEXT = "Hey! Welcome to HustleAI. I'm your AI business assistant. We answer your calls 24/7, book appointments automatically, and make sure you never miss another lead. Let me show you how it works!";

    /* ── Check if already greeted ────── */
    useEffect(() => {
        if (typeof window === "undefined") return;
        const greeted = sessionStorage.getItem(STORAGE_KEY);
        if (!greeted) {
            /* Show prompt after 1.5s */
            const t = setTimeout(() => setState("prompt"), 1500);
            return () => clearTimeout(t);
        }
    }, []);

    /* ── Waveform animation ─────────── */
    useEffect(() => {
        if (state !== "speaking") return;
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
    }, [state]);

    /* ── Transcript animation ──────── */
    useEffect(() => {
        if (state !== "speaking") return;
        const words = FULL_TEXT.split(" ");
        const totalDuration = 10000; /* ~10 seconds */
        const perWord = totalDuration / words.length;
        const timers = [];

        words.forEach((_, i) => {
            const t = setTimeout(() => {
                setTranscript(words.slice(0, i + 1).join(" "));
                setProgress(((i + 1) / words.length) * 100);
            }, i * perWord);
            timers.push(t);
        });

        return () => timers.forEach(clearTimeout);
    }, [state]);

    /* ── Play greeting ──────────────── */
    const playGreeting = useCallback(async () => {
        setState("speaking");
        sessionStorage.setItem(STORAGE_KEY, "true");

        try {
            const audio = new Audio(WELCOME_AUDIO);
            audioRef.current = audio;

            /* Web Audio API for waveform */
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const source = ctx.createMediaElementSource(audio);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            source.connect(analyser);
            analyser.connect(ctx.destination);
            analyserRef.current = analyser;

            audio.onended = () => {
                setState("done");
                setTimeout(() => setState("exit"), 3000);
                setTimeout(() => setState("hidden"), 3500);
                ctx.close();
            };

            audio.onerror = () => {
                setState("done");
                setTimeout(() => setState("exit"), 2000);
                setTimeout(() => setState("hidden"), 2500);
                ctx.close();
            };

            await audio.play();
        } catch (e) {
            console.warn("Greeting audio failed:", e);
            setState("done");
            setTimeout(() => setState("exit"), 2000);
            setTimeout(() => setState("hidden"), 2500);
        }
    }, []);

    /* ── Dismiss ────────────────────── */
    const dismiss = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        sessionStorage.setItem(STORAGE_KEY, "true");
        setState("exit");
        setTimeout(() => setState("hidden"), 500);
    }, []);

    if (state === "hidden") return null;

    return (
        <div className={`${styles.greeter} ${state === "exit" ? styles.exit : ""}`}>
            {/* ── Prompt State: "Click to hear" ── */}
            {state === "prompt" && (
                <button className={styles.promptBtn} onClick={playGreeting}>
                    <div className={styles.avatarWrap}>
                        <Image
                            src="/images/ai-agent.png"
                            alt="AI Assistant"
                            width={56}
                            height={56}
                            className={styles.avatar}
                        />
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

            {/* ── Speaking & Done States ── */}
            {(state === "speaking" || state === "done") && (
                <div className={styles.card}>
                    <button className={styles.dismissBtn} onClick={dismiss} aria-label="Close">✕</button>

                    {/* Header */}
                    <div className={styles.cardHeader}>
                        <div className={styles.avatarSmall}>
                            <Image
                                src="/images/ai-agent.png"
                                alt="AI Assistant"
                                width={40}
                                height={40}
                                className={styles.avatar}
                            />
                            {state === "speaking" && <span className={styles.speakingRing} />}
                        </div>
                        <div className={styles.headerInfo}>
                            <span className={styles.agentName}>AI Assistant</span>
                            <span className={styles.agentStatus}>
                                {state === "speaking" ? "Speaking..." : "Finished"}
                            </span>
                        </div>
                    </div>

                    {/* Waveform */}
                    {state === "speaking" && (
                        <div className={styles.waveform}>
                            {waveHeights.map((h, i) => (
                                <div
                                    key={i}
                                    className={styles.waveBar}
                                    style={{ height: `${h}px` }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Transcript */}
                    <div className={styles.transcript}>
                        {transcript || "..."}
                    </div>

                    {/* Progress bar */}
                    {state === "speaking" && (
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
