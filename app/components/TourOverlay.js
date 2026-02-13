"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useTour, TOUR_STEPS } from "./TourManager";
import styles from "./TourOverlay.module.css";

/* ═══════════════════════════════════════════════
   Tour Overlay — Floating AI Guide Card
   ─────────────────────────────────────────────
   Glassmorphism panel + dim overlay with radial
   mask cutout revealing the active section.
   Speaks each step using Web Speech API.
   ═══════════════════════════════════════════════ */

export default function TourOverlay() {
    const tour = useTour();
    const [speaking, setSpeaking] = useState(false);
    const [typedText, setTypedText] = useState("");
    const audioRef = useRef(null);
    const mountedRef = useRef(true);
    const synthRef = useRef(null);
    const typingRef = useRef(null);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            /* Cleanup speech on unmount */
            if (synthRef.current) {
                window.speechSynthesis?.cancel();
            }
            if (typingRef.current) {
                clearInterval(typingRef.current);
            }
        };
    }, []);

    /* ── Speak step transcript using Web Speech API ── */
    const speakStep = useCallback((text) => {
        if (typeof window === "undefined" || !window.speechSynthesis) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.volume = 0.85;
        utterance.lang = "en-US";

        // Try to pick a good English voice
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v =>
            v.name.includes("Samantha") || v.name.includes("Karen") ||
            v.name.includes("Google US English") || v.name.includes("Alex")
        ) || voices.find(v => v.lang.startsWith("en") && !v.localService === false)
            || voices[0];
        if (preferred) utterance.voice = preferred;

        synthRef.current = utterance;

        utterance.onstart = () => {
            if (mountedRef.current) setSpeaking(true);
        };
        utterance.onend = () => {
            if (mountedRef.current) setSpeaking(false);
            synthRef.current = null;
        };
        utterance.onerror = () => {
            if (mountedRef.current) setSpeaking(false);
            synthRef.current = null;
        };

        window.speechSynthesis.speak(utterance);
    }, []);

    /* ── Typing animation for transcript ── */
    const animateTyping = useCallback((text) => {
        if (typingRef.current) clearInterval(typingRef.current);
        const words = text.split(" ");
        let idx = 0;
        setTypedText("");

        typingRef.current = setInterval(() => {
            if (!mountedRef.current) {
                clearInterval(typingRef.current);
                return;
            }
            idx++;
            setTypedText(words.slice(0, idx).join(" "));
            if (idx >= words.length) {
                clearInterval(typingRef.current);
                typingRef.current = null;
            }
        }, 80); // fast word-by-word reveal
    }, []);

    /* ── Speak when step changes and section is revealed ── */
    const prevStepRef = useRef(-1);
    useEffect(() => {
        if (!tour) return;
        const { tourState, currentStep, sectionRevealed, currentStepData } = tour;

        if (tourState !== "touring" || currentStep < 0 || !sectionRevealed || !currentStepData) return;

        // Only speak when step changes (or first reveal)
        if (prevStepRef.current === currentStep) return;
        prevStepRef.current = currentStep;

        // Try audio file first, fall back to speechSynthesis
        const audioSrc = currentStepData.audio;
        const transcript = currentStepData.transcript;

        // Start typing animation
        animateTyping(transcript);

        // Try playing the audio file
        if (audioSrc) {
            const audio = new Audio(audioSrc);
            audioRef.current = audio;

            audio.oncanplaythrough = () => {
                setSpeaking(true);
                audio.play().catch(() => {
                    // Audio file unavailable — fall back to speech
                    speakStep(transcript);
                });
            };
            audio.onended = () => {
                if (mountedRef.current) setSpeaking(false);
            };
            audio.onerror = () => {
                // Audio file doesn't exist or failed — use speech
                speakStep(transcript);
            };

            // Timeout fallback if audio doesn't load in 500ms
            setTimeout(() => {
                if (audio.readyState < 3) {
                    audio.src = ""; // cancel loading
                    speakStep(transcript);
                }
            }, 500);
        } else {
            speakStep(transcript);
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [tour?.tourState, tour?.currentStep, tour?.sectionRevealed, tour?.currentStepData, speakStep, animateTyping]);

    /* ── Stop speech when tour ends ── */
    useEffect(() => {
        if (!tour) return;
        if (tour.tourState === "done" || tour.tourState === "idle") {
            window.speechSynthesis?.cancel();
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            setSpeaking(false);
            prevStepRef.current = -1;
        }
    }, [tour?.tourState]);

    if (!tour) return null;

    const {
        tourState, currentStep, totalSteps,
        currentStepData, targetRect, sectionRevealed,
        nextStep, endTour,
    } = tour;

    const isActive = tourState === "touring" || tourState === "done";
    if (!isActive) return null;

    /* ── Handle next with speech cancel ── */
    const handleNext = () => {
        window.speechSynthesis?.cancel();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setSpeaking(false);
        nextStep();
    };

    const handleEnd = () => {
        window.speechSynthesis?.cancel();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setSpeaking(false);
        endTour();
    };

    /* ── Dim overlay clip-path ─────────── */
    const clipStyle = {};
    if (targetRect && sectionRevealed) {
        const pad = 16;
        const top = Math.max(0, targetRect.y - pad);
        const left = Math.max(0, targetRect.x - pad);
        const bottom = window.innerHeight - (targetRect.y + targetRect.h + pad);
        const right = window.innerWidth - (targetRect.x + targetRect.w + pad);
        clipStyle["--cutTop"] = `${top}px`;
        clipStyle["--cutLeft"] = `${left}px`;
        clipStyle["--cutBottom"] = `${Math.max(0, bottom)}px`;
        clipStyle["--cutRight"] = `${Math.max(0, right)}px`;
        clipStyle["--cutRadius"] = "16px";
    }

    return (
        <>
            {/* ── Dim Overlay with Cutout ── */}
            <AnimatePresence>
                {sectionRevealed && targetRect && (
                    <motion.div
                        className={styles.dimOverlay}
                        style={clipStyle}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        aria-hidden="true"
                    />
                )}
            </AnimatePresence>

            {/* ── Section Glow Ring ── */}
            <AnimatePresence>
                {sectionRevealed && targetRect && (
                    <motion.div
                        className={styles.sectionGlow}
                        style={{
                            top: targetRect.y - 8,
                            left: targetRect.x - 8,
                            width: targetRect.w + 16,
                            height: targetRect.h + 16,
                        }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        aria-hidden="true"
                    />
                )}
            </AnimatePresence>

            {/* ── Floating Guide Card ── */}
            <AnimatePresence>
                {tourState === "touring" && currentStepData && (
                    <motion.div
                        className={styles.card}
                        initial={{ opacity: 0, y: 20, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.92 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Close button */}
                        <button
                            className={styles.closeBtn}
                            onClick={handleEnd}
                            aria-label="End tour"
                        >
                            ✕
                        </button>

                        {/* Neural step dots */}
                        <div className={styles.stepDots}>
                            {TOUR_STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`${styles.dot} ${i === currentStep ? styles.dotActive : ""} ${i < currentStep ? styles.dotDone : ""}`}
                                />
                            ))}
                        </div>

                        {/* Header */}
                        <div className={styles.header}>
                            <div className={styles.avatarWrap}>
                                <Image
                                    src="/images/ai-agent.png"
                                    alt="AI"
                                    width={32}
                                    height={32}
                                    className={styles.avatar}
                                />
                                <span className={`${styles.avatarGlow} ${speaking ? styles.avatarSpeaking : ""}`} />
                            </div>
                            <div className={styles.headerText}>
                                <span className={styles.title}>{currentStepData.title}</span>
                                <span className={styles.stepCount}>
                                    {speaking ? "🔊 Speaking..." : `Step ${currentStep + 1}/${totalSteps}`}
                                </span>
                            </div>
                        </div>

                        {/* Transcript — word-by-word typing */}
                        <AnimatePresence mode="wait">
                            {sectionRevealed && (
                                <motion.p
                                    key={currentStep}
                                    className={styles.transcript}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {typedText || "..."}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div className={styles.actions}>
                            <button
                                className={styles.skipBtn}
                                onClick={handleEnd}
                            >
                                End tour
                            </button>
                            <button
                                className={styles.nextBtn}
                                onClick={handleNext}
                                disabled={!sectionRevealed}
                            >
                                {currentStep + 1 >= totalSteps ? "Finish ✓" : "Continue →"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Done State ── */}
            <AnimatePresence>
                {tourState === "done" && (
                    <motion.div
                        className={styles.doneToast}
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                    >
                        <span className={styles.doneIcon}>✦</span>
                        <span>Tour Complete</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
