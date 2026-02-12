"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./NeuralProof.module.css";

/* ── Proof card data ─────────────────────────── */
const PROOF_CARDS = [
    {
        title: "Instant Answer Rate",
        metric: "< 1 second",
        detail: "No voicemail black holes",
        barWidth: 98,
        icon: "⚡",
    },
    {
        title: "Qualification Engine",
        metric: "Auto-filters tire-kickers",
        detail: "Collects details, photos, zip & timeline",
        barWidth: 88,
        icon: "🎯",
    },
    {
        title: "Booking → Revenue",
        metric: "Books & follows up",
        detail: "Recovers missed revenue with auto re-contact",
        barWidth: 92,
        icon: "💰",
    },
];

const ADVANTAGES = [
    { icon: "🧠", title: "Context Memory", desc: "Remembers caller history and continues the same thread" },
    { icon: "📈", title: "Revenue-First Logic", desc: "Prioritizes booking & follow-up, not just answering" },
    { icon: "🔀", title: "Escalation Rules", desc: "Hands off to human only when necessary — VIP, urgent, high ticket" },
];

export default function NeuralProof() {
    const sectionRef = useRef(null);
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const nodesRef = useRef([]);
    const pulseRef = useRef({ x: 0, y: 0, progress: 0 });
    const [isVisible, setIsVisible] = useState(false);
    const [activeCard, setActiveCard] = useState(-1);
    const [factRevealed, setFactRevealed] = useState(false);
    const [factCount, setFactCount] = useState(0);

    // Visibility observer
    useEffect(() => {
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setIsVisible(true); },
            { threshold: 0.15 }
        );
        if (sectionRef.current) obs.observe(sectionRef.current);
        return () => obs.disconnect();
    }, []);

    // Fact reveal after 1s of visibility
    useEffect(() => {
        if (!isVisible) return;
        const t = setTimeout(() => {
            setFactRevealed(true);
            // Animate 60% count-up
            const dur = 1200;
            const start = performance.now();
            const tick = (now) => {
                const p = Math.min((now - start) / dur, 1);
                setFactCount(Math.round(p * 60));
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }, 1000);
        return () => clearTimeout(t);
    }, [isVisible]);

    // Pulse cycle: highlight cards in sequence
    useEffect(() => {
        if (!isVisible) return;
        let cycle = 0;
        const interval = setInterval(() => {
            const cardIdx = cycle % 3;
            setActiveCard(cardIdx);
            setTimeout(() => setActiveCard(-1), 500);
            cycle++;
        }, 2500);
        return () => clearInterval(interval);
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
            const isMobile = w < 500;
            const count = isMobile ? 18 : 35;
            const nodes = [];
            for (let i = 0; i < count; i++) {
                nodes.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    vx: (Math.random() - 0.5) * 0.2,
                    vy: (Math.random() - 0.5) * 0.2,
                    r: Math.random() * 2 + 1.2,
                    phase: Math.random() * Math.PI * 2,
                });
            }
            nodesRef.current = nodes;
        };

        const draw = (time) => {
            const w = canvas.width / (Math.min(window.devicePixelRatio || 1, 2));
            const h = canvas.height / (Math.min(window.devicePixelRatio || 1, 2));
            const nodes = nodesRef.current;
            ctx.clearRect(0, 0, w, h);

            // Update + draw nodes
            for (const n of nodes) {
                n.x += n.vx;
                n.y += n.vy;
                if (n.x < 0 || n.x > w) n.vx *= -1;
                if (n.y < 0 || n.y > h) n.vy *= -1;

                const pulse = Math.sin(time * 0.002 + n.phase) * 0.5 + 0.5;
                const alpha = 0.3 + pulse * 0.5;

                // Glow
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r * 4, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(108, 92, 231, ${alpha * 0.08})`;
                ctx.fill();

                // Core
                ctx.beginPath();
                ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 210, 255, ${alpha * 0.8})`;
                ctx.fill();
            }

            // Connections
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        const lineAlpha = (1 - dist / 120) * 0.15;
                        ctx.beginPath();
                        ctx.moveTo(nodes[i].x, nodes[i].y);
                        ctx.lineTo(nodes[j].x, nodes[j].y);
                        ctx.strokeStyle = `rgba(0, 210, 255, ${lineAlpha})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            // Traveling pulse (data flow)
            const pulsePhase = (time * 0.0005) % 1;
            const px = w * pulsePhase;
            const py = h * 0.5 + Math.sin(pulsePhase * Math.PI * 4) * h * 0.2;
            const grd = ctx.createRadialGradient(px, py, 0, px, py, 40);
            grd.addColorStop(0, "rgba(0, 210, 255, 0.2)");
            grd.addColorStop(0.5, "rgba(108, 92, 231, 0.06)");
            grd.addColorStop(1, "transparent");
            ctx.fillStyle = grd;
            ctx.fillRect(px - 40, py - 40, 80, 80);

            // Decision branch (occasional)
            if (Math.sin(time * 0.001) > 0.85) {
                ctx.beginPath();
                ctx.moveTo(px, py);
                ctx.lineTo(px + 25, py - 15);
                ctx.lineTo(px + 35, py - 8);
                ctx.strokeStyle = "rgba(0, 210, 255, 0.12)";
                ctx.lineWidth = 0.6;
                ctx.stroke();
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
    }, []);

    return (
        <section ref={sectionRef} className={`${styles.section} ${isVisible ? styles.visible : ""}`}>
            <div className={`container ${styles.inner}`}>

                {/* Left: Neural visualization */}
                <div className={styles.vizCol}>
                    <div className={styles.vizFrame}>
                        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
                        <div className={styles.vizOverlay} />
                        {/* "Did you know?" callout */}
                        <div className={`${styles.factBubble} ${factRevealed ? styles.factVisible : ""}`}>
                            <span className={styles.factLabel}>Did you know?</span>
                            <span className={styles.factText}>
                                <strong className={styles.factNum}>{factCount}%</strong> of leads call outside business hours — HustleAI converts them while you sleep.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right: Proof Cards + Comparison */}
                <div className={styles.contentCol}>
                    <div className={styles.sectionTag}>Neural Proof</div>
                    <h2 className={styles.heading}>Why HustleAI <span className="text-gradient">Wins</span></h2>

                    {/* Proof Cards */}
                    <div className={styles.proofCards}>
                        {PROOF_CARDS.map((card, i) => (
                            <div
                                key={i}
                                className={`${styles.proofCard} ${activeCard === i ? styles.proofPulse : ""}`}
                                style={{ transitionDelay: `${i * 0.12}s` }}
                            >
                                <div className={styles.proofHeader}>
                                    <span className={styles.proofIcon}>{card.icon}</span>
                                    <span className={styles.proofTitle}>{card.title}</span>
                                </div>
                                <div className={styles.proofMetric}>{card.metric}</div>
                                <div className={styles.proofDetail}>{card.detail}</div>
                                <div className={styles.proofBar}>
                                    <div
                                        className={styles.proofBarFill}
                                        style={{ width: isVisible ? `${card.barWidth}%` : "0%" }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Comparison Strip */}
                    <div className={styles.comparison}>
                        <div className={styles.compTitle}>HustleAI vs Typical AI Receptionists</div>
                        {ADVANTAGES.map((a, i) => (
                            <div key={i} className={styles.compRow}>
                                <span className={styles.compIcon}>{a.icon}</span>
                                <div className={styles.compText}>
                                    <strong>{a.title}</strong>
                                    <span>{a.desc}</span>
                                </div>
                                <span className={`${styles.compCheck} ${isVisible ? styles.checkVisible : ""}`}
                                    style={{ transitionDelay: `${0.8 + i * 0.2}s` }}
                                >✓</span>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className={styles.ctaRow}>
                        <a href="/signup" className="btn btn-accent btn-lg">Start Free Trial</a>
                        <button
                            onClick={() => {
                                const el = document.getElementById("voice-demo");
                                if (el) el.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="btn btn-secondary btn-lg"
                        >
                            Watch Live Demo
                        </button>
                    </div>
                    <div className={styles.ctaMicro}>No setup calls. Go live in minutes.</div>
                </div>
            </div>
        </section>
    );
}
