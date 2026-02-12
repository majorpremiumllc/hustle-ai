"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import styles from "./LossSimulation.module.css";

const STORY_LINES = [
    "Customer calls at 8:43 PM.",
    "No answer.",
    "They call someone else.",
    "Job booked.",
];
const STORY_CODA = "That happens 3–5 times per week.";

const LOSS_METRICS = [
    { label: "Missed Calls", steps: [1, 2, 5, 12], detail: "After-hours leads never returned." },
    { label: "Lost Revenue", steps: [450, 1200, 3750, 9800], prefix: "$", detail: "Customers book with competitors." },
    { label: "Unqualified Leads", steps: [3, 8, 14, 22], detail: "Wasted time on tire-kickers." },
];

const RECOVERY = [
    { label: "Missed Calls", value: "Answered in <1s", color: "#00D2FF" },
    { label: "Lost Revenue", value: "$0 lost", color: "#00B894" },
    { label: "Answer Rate", value: "99%", color: "#6C5CE7" },
];

export default function LossSimulation() {
    const sectionRef = useRef(null);
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const nodesRef = useRef([]);
    const phaseRef = useRef(0); // 0=healthy, 1=degrading, 2=recovered

    const [isVisible, setIsVisible] = useState(false);
    const [phase, setPhase] = useState(0); // 0=loss, 1=recovering, 2=recovered
    const [storyIdx, setStoryIdx] = useState(-1);
    const [showCoda, setShowCoda] = useState(false);
    const [metricStep, setMetricStep] = useState(-1);
    const [showMetrics, setShowMetrics] = useState(false);

    // Observe visibility
    useEffect(() => {
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting && !isVisible) setIsVisible(true); },
            { threshold: 0.2 }
        );
        if (sectionRef.current) obs.observe(sectionRef.current);
        return () => obs.disconnect();
    }, [isVisible]);

    // Timeline: story → metrics → pause → recovery
    useEffect(() => {
        if (!isVisible) return;
        const timers = [];

        // Show metrics container
        timers.push(setTimeout(() => setShowMetrics(true), 300));

        // Story lines appear one by one
        STORY_LINES.forEach((_, i) => {
            timers.push(setTimeout(() => setStoryIdx(i), 800 + i * 1200));
        });

        // Metrics step through
        for (let s = 0; s < 4; s++) {
            timers.push(setTimeout(() => setMetricStep(s), 1000 + s * 1100));
        }

        // Coda
        timers.push(setTimeout(() => setShowCoda(true), 800 + STORY_LINES.length * 1200 + 600));

        // Recovery phase
        timers.push(setTimeout(() => {
            setPhase(1);
            phaseRef.current = 1;
        }, 7500));

        timers.push(setTimeout(() => {
            setPhase(2);
            phaseRef.current = 2;
        }, 9000));

        return () => timers.forEach(clearTimeout);
    }, [isVisible]);

    // Canvas neural network
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (mq.matches) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        const resize = () => {
            const rect = canvas.parentElement.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = rect.width + "px";
            canvas.style.height = rect.height + "px";
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            initNodes(rect.width, rect.height);
        };

        const initNodes = (w, h) => {
            const count = w < 500 ? 16 : 28;
            const nodes = [];
            for (let i = 0; i < count; i++) {
                nodes.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    r: Math.random() * 2 + 1.5,
                    phase: Math.random() * Math.PI * 2,
                    alive: 1, // 1=fully alive, 0=dead
                });
            }
            nodesRef.current = nodes;
        };

        const draw = (time) => {
            const w = canvas.width / Math.min(window.devicePixelRatio || 1, 2);
            const h = canvas.height / Math.min(window.devicePixelRatio || 1, 2);
            const nodes = nodesRef.current;
            const p = phaseRef.current;
            ctx.clearRect(0, 0, w, h);

            // Phase-dependent behavior
            const isHealthy = p === 0 && !isVisible;
            const isDegrading = p === 0 && isVisible;
            const isRecovering = p >= 1;

            for (const n of nodes) {
                // Degradation: nodes slowly die
                if (isDegrading && n.alive > 0) {
                    n.alive = Math.max(0, n.alive - 0.0008);
                }
                // Recovery: nodes come back
                if (isRecovering && n.alive < 1) {
                    n.alive = Math.min(1, n.alive + 0.005);
                }

                n.x += n.vx * (0.3 + n.alive * 0.7);
                n.y += n.vy * (0.3 + n.alive * 0.7);
                if (n.x < 0 || n.x > w) n.vx *= -1;
                if (n.y < 0 || n.y > h) n.vy *= -1;

                const pulse = Math.sin(time * 0.002 + n.phase) * 0.5 + 0.5;
                const alpha = n.alive * (0.3 + pulse * 0.5);

                // Degrading color shift: cyan → dim purple
                const r = isDegrading ? Math.round(108 * (1 - n.alive) + 0 * n.alive) : (isRecovering ? 0 : 0);
                const g = isDegrading ? Math.round(92 * (1 - n.alive) + 210 * n.alive) : (isRecovering ? 210 : 210);
                const b = isDegrading ? Math.round(231 * (1 - n.alive) + 255 * n.alive) : (isRecovering ? 255 : 255);

                // Glow
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r * 3.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.06})`;
                ctx.fill();

                // Glitch flicker on degrading nodes
                if (isDegrading && n.alive < 0.5 && Math.random() > 0.97) continue;

                // Core node
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r * n.alive, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`;
                ctx.fill();
            }

            // Connections
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const a = nodes[i], b = nodes[j];
                    const dx = a.x - b.x, dy = a.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const maxDist = 100;
                    if (dist < maxDist) {
                        const connAlpha = (1 - dist / maxDist) * Math.min(a.alive, b.alive) * 0.2;
                        // Flicker on dying connections
                        if (isDegrading && Math.min(a.alive, b.alive) < 0.4 && Math.random() > 0.8) continue;

                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);

                        if (isRecovering) {
                            ctx.strokeStyle = `rgba(0, 210, 255, ${connAlpha})`;
                        } else {
                            const cAlpha = Math.min(a.alive, b.alive);
                            ctx.strokeStyle = `rgba(${Math.round(108 * (1 - cAlpha))}, ${Math.round(92 + 118 * cAlpha)}, ${Math.round(231 + 24 * cAlpha)}, ${connAlpha})`;
                        }
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            // Recovery pulse
            if (isRecovering) {
                const pulseT = (time * 0.0006) % 1;
                const px = w * pulseT;
                const py = h * 0.5 + Math.sin(pulseT * Math.PI * 3) * h * 0.25;
                const grd = ctx.createRadialGradient(px, py, 0, px, py, 35);
                grd.addColorStop(0, "rgba(0, 210, 255, 0.2)");
                grd.addColorStop(1, "transparent");
                ctx.fillStyle = grd;
                ctx.fillRect(px - 35, py - 35, 70, 70);
            }

            animRef.current = requestAnimationFrame(draw);
        };

        resize();
        window.addEventListener("resize", resize);
        animRef.current = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener("resize", resize);
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, [isVisible]);

    const currentMetricValues = useMemo(() => {
        if (metricStep < 0) return LOSS_METRICS.map(() => 0);
        const idx = Math.min(metricStep, 3);
        return LOSS_METRICS.map(m => m.steps[idx]);
    }, [metricStep]);

    return (
        <section ref={sectionRef} className={`${styles.section} ${isVisible ? styles.visible : ""} ${phase >= 1 ? styles.recovering : ""} ${phase >= 2 ? styles.recovered : ""}`}>
            <div className={`container ${styles.inner}`}>

                {/* Left: Neural Visualization */}
                <div className={styles.vizCol}>
                    <div className={styles.vizFrame}>
                        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
                        <div className={`${styles.vizLabel} ${phase >= 2 ? styles.vizLabelRecovered : ""}`}>
                            {phase < 2 ? "System Offline" : "System Online"}
                        </div>
                    </div>

                    {/* Micro Story */}
                    <div className={styles.story}>
                        {STORY_LINES.map((line, i) => (
                            <div key={i} className={`${styles.storyLine} ${i <= storyIdx ? styles.storyVisible : ""}`}>
                                {line}
                            </div>
                        ))}
                        <div className={`${styles.storyLine} ${styles.storyCoda} ${showCoda ? styles.storyVisible : ""}`}>
                            {STORY_CODA}
                        </div>
                    </div>
                </div>

                {/* Right: Metrics + Recovery */}
                <div className={styles.metricsCol}>
                    <div className={styles.sectionTag}>
                        {phase < 2 ? "Without HustleAI" : "With HustleAI"}
                    </div>
                    <h2 className={styles.heading}>
                        {phase < 2
                            ? <>What Happens <span className={styles.dimGrad}>Without HustleAI?</span></>
                            : <>Everything <span className="text-gradient">Changes.</span></>
                        }
                    </h2>
                    <p className={styles.subtitle}>
                        {phase < 2 ? "Every missed call is silent lost revenue." : "Every call answered. Every lead captured."}
                    </p>

                    {/* Loss / Recovery Metrics */}
                    <div className={`${styles.metricsGrid} ${showMetrics ? styles.metricsVisible : ""}`}>
                        {phase < 2 ? (
                            LOSS_METRICS.map((m, i) => (
                                <div key={i} className={`${styles.metricCard} ${styles.lossCard}`} style={{ transitionDelay: `${i * 0.15}s` }}>
                                    <div className={styles.metricLabel}>{m.label}</div>
                                    <div className={styles.metricValue}>
                                        {m.prefix || ""}{currentMetricValues[i].toLocaleString()}
                                    </div>
                                    <div className={styles.metricDetail}>{m.detail}</div>
                                </div>
                            ))
                        ) : (
                            RECOVERY.map((m, i) => (
                                <div key={i} className={`${styles.metricCard} ${styles.recoveryCard}`} style={{ transitionDelay: `${i * 0.15}s` }}>
                                    <div className={styles.metricLabel}>{m.label}</div>
                                    <div className={styles.metricValue} style={{ color: m.color }}>{m.value}</div>
                                    <div className={styles.metricDetail}>Powered by HustleAI</div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* CTA */}
                    <div className={`${styles.ctaRow} ${phase >= 2 ? styles.ctaVisible : ""}`}>
                        <a href="/signup" className="btn btn-accent btn-lg">Stop Losing Revenue</a>
                        <a href="/signup" className="btn btn-secondary">Start Free Trial</a>
                    </div>
                    <div className={`${styles.ctaMicro} ${phase >= 2 ? styles.ctaVisible : ""}`}>
                        Go live in minutes. No complex setup.
                    </div>
                </div>
            </div>
        </section>
    );
}
