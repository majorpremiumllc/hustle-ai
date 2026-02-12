"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import styles from "./AIGreeter.module.css";

/* ═══════════════════════════════════════════════
   AI Fairy Guide — Flying Neural Agent
   ─────────────────────────────────────────────
   A fairy-like AI agent that flies out of the
   widget, points at sections with a glowing wand,
   and leaves trailing neuron particles.
   ═══════════════════════════════════════════════ */

const WELCOME_AUDIO = "/audio/ai-welcome.mp3";
const STORAGE_KEY = "hustleai_greeted";

const TOUR_STEPS = [
    { id: "features", title: "Core Features", audio: "/audio/tour-features.mp3", scrollTo: "features", transcript: "These are the core features that make HustleAI special. From instant call answering to smart appointment booking, we handle everything automatically — so you never miss a single customer again." },
    { id: "demo", title: "Live Demo", audio: "/audio/tour-demo.mp3", scrollTo: "features", scrollOffset: 600, transcript: "Here's a live demo. Click the play button and listen to how our AI handles a real phone call. It sounds just like a human receptionist, but works 24/7." },
    { id: "industries", title: "Industries We Serve", audio: "/audio/tour-industries.mp3", scrollTo: "industries", transcript: "We work with all kinds of service businesses. Plumbers, electricians, HVAC companies, dental offices, law firms, and more. No matter your industry, HustleAI adapts to your needs." },
    { id: "loss", title: "What You're Losing", audio: "/audio/tour-loss.mp3", scrollTo: "loss", scrollOffset: -80, transcript: "This is your wake-up call. See exactly how many calls you're missing and how much revenue that costs you every single month. The numbers might surprise you." },
    { id: "calculator", title: "Revenue Calculator", audio: "/audio/tour-calculator.mp3", scrollTo: "calculator", scrollOffset: -80, transcript: "Use this calculator to see your potential revenue recovery. Enter your numbers and watch how HustleAI turns missed calls into booked appointments and real money." },
    { id: "pricing", title: "Pricing", audio: "/audio/tour-pricing.mp3", scrollTo: "pricing", transcript: "Ready to stop missing calls? Choose a plan and start your free trial today. No credit card required, and you'll be set up in under five minutes." },
];

const WELCOME_TEXT = "Hey! Welcome to HustleAI. I'm your AI business assistant. We answer your calls 24/7, book appointments automatically, and make sure you never miss another lead. Let me show you how it works!";

/* ── Neuron Particle System ──────────── */
class NeuronParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.particles = [];
        this.running = false;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    burst(x, y, count = 15) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
            const speed = 2 + Math.random() * 4;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                decay: 0.015 + Math.random() * 0.02,
                size: 2 + Math.random() * 3,
                hue: 200 + Math.random() * 60, /* cyan-purple range */
            });
        }
    }

    trail(x, y) {
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 1.5,
                vy: -1 - Math.random() * 2,
                life: 1,
                decay: 0.025 + Math.random() * 0.02,
                size: 1.5 + Math.random() * 2.5,
                hue: 200 + Math.random() * 60,
            });
        }
    }

    drawWandLine(fromX, fromY, toX, toY) {
        const ctx = this.ctx;
        const gradient = ctx.createLinearGradient(fromX, fromY, toX, toY);
        gradient.addColorStop(0, "rgba(0, 210, 255, 0.6)");
        gradient.addColorStop(0.5, "rgba(108, 92, 231, 0.4)");
        gradient.addColorStop(1, "rgba(0, 210, 255, 0)");

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.stroke();

        /* Glow at target */
        ctx.beginPath();
        ctx.arc(toX, toY, 8, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 210, 255, 0.3)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(toX, toY, 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0, 210, 255, 0.8)";
        ctx.fill();
    }

    update() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles = this.particles.filter(p => p.life > 0);

        for (const p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.life -= p.decay;

            const alpha = p.life * 0.8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${alpha})`;
            ctx.fill();

            /* Glow */
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life * 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${alpha * 0.15})`;
            ctx.fill();
        }
    }

    start() {
        this.running = true;
        const loop = () => {
            if (!this.running) return;
            this.update();
            requestAnimationFrame(loop);
        };
        loop();
    }

    stop() {
        this.running = false;
        this.particles = [];
        this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

export default function AIGreeter() {
    const [state, setState] = useState("hidden");
    const [transcript, setTranscript] = useState("");
    const [progress, setProgress] = useState(0);
    const [tourStep, setTourStep] = useState(-1);
    const [speaking, setSpeaking] = useState(false);
    const [agentPos, setAgentPos] = useState({ x: 0, y: 0 }); /* screen coords */
    const [showAgent, setShowAgent] = useState(false);
    const [wandTarget, setWandTarget] = useState(null);

    const audioRef = useRef(null);
    const audioCtxRef = useRef(null);
    const analyserRef = useRef(null);
    const canvasRef = useRef(null);
    const particlesRef = useRef(null);
    const mountedRef = useRef(true);
    const trailIntervalRef = useRef(null);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    /* ── Init particle canvas ───────── */
    useEffect(() => {
        if (!canvasRef.current) return;
        const ps = new NeuronParticleSystem(canvasRef.current);
        ps.resize();
        particlesRef.current = ps;

        const handleResize = () => ps.resize();
        window.addEventListener("resize", handleResize);

        return () => {
            ps.stop();
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    /* ── Show prompt after delay ─────── */
    useEffect(() => {
        if (typeof window === "undefined") return;
        const greeted = sessionStorage.getItem(STORAGE_KEY);
        if (!greeted) {
            const t = setTimeout(() => {
                if (mountedRef.current) {
                    setState("prompt");
                    /* Position agent at bottom-right */
                    setAgentPos({
                        x: window.innerWidth - 100,
                        y: window.innerHeight - 100,
                    });
                }
            }, 1500);
            return () => clearTimeout(t);
        }
    }, []);

    /* ── Trail particles while flying ── */
    useEffect(() => {
        if (!showAgent || !particlesRef.current) return;
        const iv = setInterval(() => {
            if (particlesRef.current && showAgent) {
                particlesRef.current.trail(agentPos.x + 40, agentPos.y + 40);
            }
        }, 60);
        trailIntervalRef.current = iv;
        return () => clearInterval(iv);
    }, [showAgent, agentPos]);

    /* ── Audio helper ────────────────── */
    const playAudio = useCallback((src) => {
        return new Promise((resolve) => {
            try {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                }
                if (audioCtxRef.current) {
                    try { audioCtxRef.current.close(); } catch (e) {/* ok */ }
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

                audio.onended = () => { resolve(); };
                audio.onerror = () => { resolve(); };
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

    /* ── Fly agent to section ────────── */
    const flyToSection = useCallback((sectionId, offset = 0) => {
        const el = document.getElementById(sectionId);
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const scrollY = window.scrollY;
        const targetScrollY = scrollY + rect.top + offset - 200;

        /* Scroll page */
        window.scrollTo({ top: targetScrollY, behavior: "smooth" });

        /* Position agent near the section (left side) */
        setTimeout(() => {
            if (!mountedRef.current) return;
            const newRect = el.getBoundingClientRect();
            const newX = Math.min(window.innerWidth - 120, Math.max(40, newRect.left - 80));
            const newY = Math.max(80, newRect.top + 20);

            setAgentPos({ x: newX, y: newY });

            /* Set wand target to the section center */
            setWandTarget({
                x: newRect.left + newRect.width / 2,
                y: newRect.top + 30,
            });

            /* Burst particles at arrival */
            if (particlesRef.current) {
                particlesRef.current.burst(newX + 40, newY + 40, 20);
            }
        }, 600);
    }, []);

    /* ── Draw wand line on canvas ────── */
    useEffect(() => {
        if (!wandTarget || !showAgent || !particlesRef.current) return;
        let raf;
        const draw = () => {
            if (particlesRef.current && wandTarget) {
                particlesRef.current.drawWandLine(
                    agentPos.x + 40, agentPos.y + 60,
                    wandTarget.x, wandTarget.y
                );
            }
            raf = requestAnimationFrame(draw);
        };
        /* small delay for position to settle */
        const t = setTimeout(() => { raf = requestAnimationFrame(draw); }, 800);
        return () => { clearTimeout(t); if (raf) cancelAnimationFrame(raf); };
    }, [wandTarget, showAgent, agentPos]);

    /* ── Start greeting ──────────────── */
    const startGreeting = useCallback(async () => {
        sessionStorage.setItem(STORAGE_KEY, "true");

        /* Start particles */
        particlesRef.current?.start();

        /* Fly out the agent */
        setState("speaking");
        setShowAgent(true);

        /* Burst at spawn */
        const spawnX = window.innerWidth - 100;
        const spawnY = window.innerHeight - 100;
        if (particlesRef.current) {
            particlesRef.current.burst(spawnX, spawnY, 25);
        }

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

        /* Show tour prompt */
        setState("tour-prompt");
    }, [playAudio, animateTranscript]);

    /* ── Start tour ─────────────────── */
    const startTour = useCallback(async () => {
        setState("touring");
        setTourStep(0);
    }, []);

    /* ── Play tour step ─────────────── */
    useEffect(() => {
        if (state !== "touring" || tourStep < 0 || tourStep >= TOUR_STEPS.length) return;
        let cancelled = false;

        const runStep = async () => {
            const step = TOUR_STEPS[tourStep];

            /* Fly to section */
            flyToSection(step.scrollTo, step.scrollOffset || 0);
            setSpeaking(true);
            setTranscript("");
            setProgress(0);

            await wait(1200);
            if (cancelled || !mountedRef.current) return;

            /* Play narration */
            const clearTranscript = animateTranscript(step.transcript, 8000);
            await playAudio(step.audio);
            clearTranscript();
            if (cancelled || !mountedRef.current) return;

            setTranscript(step.transcript);
            setProgress(100);
            setSpeaking(false);
            setWandTarget(null);
        };

        runStep();

        return () => { cancelled = true; };
    }, [state, tourStep, flyToSection, playAudio, animateTranscript]);

    /* ── Next step ──────────────────── */
    const nextStep = useCallback(() => {
        if (tourStep + 1 >= TOUR_STEPS.length) {
            /* Tour done */
            setState("tour-done");
            setSpeaking(false);
            setWandTarget(null);
            if (particlesRef.current) {
                particlesRef.current.burst(agentPos.x + 40, agentPos.y + 40, 30);
            }
            setTimeout(() => {
                if (!mountedRef.current) return;
                dismiss();
            }, 3000);
        } else {
            setTourStep(s => s + 1);
            setProgress(0);
            setTranscript("");
        }
    }, [tourStep, agentPos]);

    /* ── Dismiss ────────────────────── */
    const dismiss = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (audioCtxRef.current) {
            try { audioCtxRef.current.close(); } catch (e) {/* ok */ }
        }
        sessionStorage.setItem(STORAGE_KEY, "true");

        /* Fly away */
        setAgentPos({ x: window.innerWidth + 100, y: -100 });
        if (particlesRef.current) {
            particlesRef.current.burst(agentPos.x + 40, agentPos.y + 40, 20);
        }
        setWandTarget(null);

        setTimeout(() => {
            if (!mountedRef.current) return;
            setShowAgent(false);
            setState("hidden");
            particlesRef.current?.stop();
        }, 800);
    }, [agentPos]);

    const currentStep = TOUR_STEPS[tourStep];
    const isActive = state !== "hidden";

    return (
        <>
            {/* ── Particle Canvas (always present, behind agent) ── */}
            <canvas
                ref={canvasRef}
                className={styles.particleCanvas}
                style={{ display: isActive ? "block" : "none" }}
            />

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
                            <span className={styles.promptHint}>🔊 Click to hear about HustleAI</span>
                        </div>
                        <span className={styles.playIcon}>▶</span>
                    </button>
                </div>
            )}

            {/* ── Info Card (follows agent or fixed bottom-right) ── */}
            {(state === "speaking" || state === "tour-prompt" || state === "touring" || state === "tour-done") && (
                <div className={styles.infoCard}>
                    <button className={styles.dismissBtn} onClick={dismiss} aria-label="Close">✕</button>

                    {/* Tour step dots */}
                    {(state === "touring" || state === "tour-done") && (
                        <div className={styles.tourSteps}>
                            {TOUR_STEPS.map((_, i) => (
                                <div key={i} className={`${styles.stepDot} ${i === tourStep ? styles.stepActive : ""} ${i < tourStep ? styles.stepDone : ""}`} />
                            ))}
                        </div>
                    )}

                    {/* Header */}
                    <div className={styles.cardHeader}>
                        <div className={styles.avatarSmall}>
                            <Image src="/images/ai-agent.png" alt="AI" width={36} height={36} className={styles.avatarThumb} />
                            {speaking && <span className={styles.miniRing} />}
                        </div>
                        <div className={styles.headerInfo}>
                            <span className={styles.agentName}>
                                {state === "touring" && currentStep ? currentStep.title : state === "tour-done" ? "Tour Complete! 🎉" : "AI Assistant"}
                            </span>
                            <span className={styles.agentStatus}>
                                {speaking ? "Speaking..." : state === "tour-prompt" ? "Ready to guide you" : state === "tour-done" ? "Thanks for watching" : `Step ${tourStep + 1}/${TOUR_STEPS.length}`}
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

                    {/* Tour nav */}
                    {state === "touring" && !speaking && (
                        <div className={styles.tourNav}>
                            <button className={styles.tourSkipBtn} onClick={dismiss}>End tour</button>
                            <button className={styles.tourNextBtn} onClick={nextStep}>
                                {tourStep + 1 >= TOUR_STEPS.length ? "Finish ✓" : "Continue →"}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
