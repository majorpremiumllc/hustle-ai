"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useTour } from "./TourManager";
import styles from "./AIGreeter.module.css";

/* ═══════════════════════════════════════════════
   AI Greeter — Welcome Prompt + Flying Agent
   ─────────────────────────────────────────────
   Simplified: handles greeting flow only.
   Tour logic delegated to TourManager/TourOverlay.
   ═══════════════════════════════════════════════ */

const WELCOME_AUDIO = "/audio/ai-welcome.mp3";
const STORAGE_KEY = "hustleai_greeted";
const WELCOME_TEXT = "Hey! I'm your AI assistant from HustleAI. We answer your business calls 24/7, capture every lead, and book appointments automatically. Let me show you around!";
const GREETER_DELAY = 2000; // ms before showing prompt

export default function AIGreeter() {
    const tour = useTour();
    const [state, setState] = useState("hidden"); /* hidden | prompt | speaking | tour-prompt */
    const [transcript, setTranscript] = useState("");
    const [progress, setProgress] = useState(0);
    const [speaking, setSpeaking] = useState(false);
    const [agentPos, setAgentPos] = useState({ x: 0, y: 0 });
    const [showAgent, setShowAgent] = useState(false);

    const audioRef = useRef(null);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    /* ── Show prompt after delay (once per session) ─── */
    useEffect(() => {
        if (typeof window === "undefined") return;

        /* Handle ?reset=1 param */
        const params = new URLSearchParams(window.location.search);
        if (params.get("reset") === "1") {
            sessionStorage.removeItem(STORAGE_KEY);
            const url = new URL(window.location);
            url.searchParams.delete("reset");
            window.history.replaceState({}, "", url);
        }

        /* Always expose global function for nav Tour button */
        window.__hustleStartTour = () => {
            if (tour) {
                tour.startTour();
            }
        };

        const greeted = sessionStorage.getItem(STORAGE_KEY);
        if (!greeted) {
            const t = setTimeout(() => {
                if (mountedRef.current) {
                    setState("prompt");
                    setAgentPos({
                        x: window.innerWidth - 100,
                        y: window.innerHeight - 100,
                    });
                }
            }, GREETER_DELAY);
            return () => { clearTimeout(t); delete window.__hustleStartTour; };
        }

        return () => { delete window.__hustleStartTour; };
    }, [tour]);

    /* ── Audio helper ────────────────── */
    const playAudio = useCallback((src) => {
        return new Promise((resolve) => {
            try {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                }
                const audio = new Audio(src);
                audioRef.current = audio;
                audio.onended = () => resolve();
                audio.onerror = () => resolve();
                audio.play().catch(() => resolve());
            } catch (e) {
                resolve();
            }
        });
    }, []);

    const wait = (ms) => new Promise(r => setTimeout(r, ms));

    /* ── Animate transcript ──────────── */
    const animateTranscript = useCallback((text, durationMs) => {
        const words = text.split(" ");
        const perWord = durationMs / words.length;
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
    }, []);

    /* ── Start greeting ──────────────── */
    const startGreeting = useCallback(async () => {
        sessionStorage.setItem(STORAGE_KEY, "true");

        setState("speaking");
        setShowAgent(true);

        /* Fly to center-right */
        await wait(300);
        setAgentPos({
            x: window.innerWidth - 160,
            y: window.innerHeight / 2 - 60,
        });

        /* Play welcome */
        setSpeaking(true);
        const clearTranscript = animateTranscript(WELCOME_TEXT, 10000);
        await playAudio(WELCOME_AUDIO);
        clearTranscript();
        if (!mountedRef.current) return;

        setTranscript(WELCOME_TEXT);
        setProgress(100);
        setSpeaking(false);

        await wait(500);
        if (!mountedRef.current) return;

        setState("tour-prompt");
    }, [playAudio, animateTranscript]);

    /* ── Start tour (delegates to TourManager) ── */
    const startTour = useCallback(() => {
        if (tour) tour.startTour();
        dismiss();
    }, [tour]);

    /* ── Dismiss ────────────────────── */
    const dismiss = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        sessionStorage.setItem(STORAGE_KEY, "true");

        /* Fly away */
        setAgentPos({ x: window.innerWidth + 100, y: -100 });

        setTimeout(() => {
            if (!mountedRef.current) return;
            setShowAgent(false);
            setState("hidden");
        }, 800);
    }, []);

    const isActive = state !== "hidden";

    return (
        <>
            {/* ── Flying AI Agent ── */}
            {showAgent && (
                <div
                    className={`${styles.flyingAgent} ${speaking ? styles.agentSpeaking : ""}`}
                    style={{
                        transform: `translate(${agentPos.x}px, ${agentPos.y}px)`,
                    }}
                >
                    <div className={styles.agentGlow} />
                    <Image
                        src="/images/ai-agent.png"
                        alt="AI Guide"
                        width={80}
                        height={80}
                        className={styles.agentAvatar}
                    />
                    {speaking && <span className={styles.agentRing} />}
                </div>
            )}

            {/* ── Prompt Button (bottom-right) ── */}
            {state === "prompt" && (
                <div className={styles.greeter}>
                    <button className={styles.promptBtn} onClick={startGreeting}>
                        <div className={styles.avatarWrap}>
                            <Image src="/images/ai-agent.png" alt="AI Assistant" width={48} height={48} className={styles.avatarThumb} />
                            <span className={styles.avatarPulse} />
                            <span className={styles.avatarPulse2} />
                        </div>
                        <div className={styles.promptText}>
                            <span className={styles.promptName}>AI Assistant</span>
                            <span className={styles.promptHint}>Click to hear about HustleAI</span>
                        </div>
                        <span className={styles.playIcon}>▶</span>
                    </button>
                </div>
            )}

            {/* ── Speaking / Tour Prompt Card ── */}
            {(state === "speaking" || state === "tour-prompt") && (
                <div className={styles.infoCard}>
                    <button className={styles.dismissBtn} onClick={dismiss} aria-label="Close">✕</button>

                    {/* Header */}
                    <div className={styles.cardHeader}>
                        <div className={styles.avatarSmall}>
                            <Image src="/images/ai-agent.png" alt="AI" width={36} height={36} className={styles.avatarThumb} />
                            {speaking && <span className={styles.miniRing} />}
                        </div>
                        <div className={styles.headerInfo}>
                            <span className={styles.agentName}>AI Assistant</span>
                            <span className={styles.agentStatus}>
                                {speaking ? "Speaking..." : "Ready to guide you"}
                            </span>
                        </div>
                    </div>

                    {/* Transcript */}
                    <div className={styles.transcript}>{transcript || "..."}</div>

                    {/* Progress */}
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                    </div>

                    {/* Tour prompt buttons */}
                    {state === "tour-prompt" && (
                        <div className={styles.tourPromptBtns}>
                            <button className={styles.tourStartBtn} onClick={startTour}>▶ Yes, show me</button>
                            <button className={styles.tourSkipBtn} onClick={dismiss}>Maybe later</button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
