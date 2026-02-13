"use client";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import NeuralFigure from "./NeuralFigure";
import styles from "./HoloAssistant.module.css";

/* ═══════════════════════════════════════════════
   Holographic AI Assistant — Human → Neural SVG
   ─────────────────────────────────────────────
   Real person appears, then transforms into SVG
   neural wireframe that is integrated with the
   site. Panels appear around the neural form.
   ═══════════════════════════════════════════════ */

const LEFT_PANELS = [
    { icon: "🎯", title: "Mood Analysis", progress: 92, live: true },
    { icon: "🧠", title: "Context Engine", progress: 88, live: true },
    { icon: "💬", title: "Tone Calibration", progress: 95, live: false },
];

const RIGHT_PANELS = [
    { icon: "⚡", title: "Intent Classification", progress: 97, live: true },
    { icon: "📊", title: "Lead Scoring", progress: 94, live: true },
    { icon: "🔄", title: "Response Generator", progress: 100, live: false },
];

const PANEL_VALUES = {
    "Mood Analysis": { before: "Scanning...", after: "Frustrated → Empathetic" },
    "Context Engine": { before: "Analyzing...", after: "Emergency Plumbing" },
    "Tone Calibration": { before: "Calibrating...", after: "Calm & Reassuring" },
    "Intent Classification": { before: "Classifying...", after: "Urgent Booking" },
    "Lead Scoring": { before: "Scoring...", after: "94/100 — Hot Lead" },
    "Response Generator": { before: "Generating...", after: "Personalized + Urgent" },
};

const SUMMARY_STATS = [
    { number: "98%", label: "Sentiment Accuracy" },
    { number: "< 1s", label: "Analysis Time" },
    { number: "24/7", label: "Always Active" },
    { number: "25+", label: "Industries Trained" },
];

function generateParticles(count) {
    const out = [];
    for (let i = 0; i < count; i++) {
        out.push({
            left: `${(i * 37 + 13) % 100}%`,
            top: `${(i * 53 + 7) % 100}%`,
            size: 2 + (i % 3),
            dur: 4 + (i % 5) * 1.2,
            delay: (i % 8) * 0.6,
            color: i % 3 === 0 ? "rgba(108,92,231,0.5)" : "rgba(0,210,255,0.5)",
        });
    }
    return out;
}

export default function HoloAssistant() {
    const sectionRef = useRef(null);
    const [phase, setPhase] = useState("real"); // "real" → "transforming" → "neural"
    const [visiblePanels, setVisiblePanels] = useState([]);
    const [showSummary, setShowSummary] = useState(false);
    const hasTriggered = useRef(false);
    const particles = useMemo(() => generateParticles(20), []);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasTriggered.current) {
                    hasTriggered.current = true;

                    setTimeout(() => setPhase("transforming"), 1500);
                    setTimeout(() => setPhase("neural"), 2800);

                    const allPanels = [...LEFT_PANELS, ...RIGHT_PANELS];
                    allPanels.forEach((_, i) => {
                        setTimeout(() => {
                            setVisiblePanels((prev) => [...prev, i]);
                        }, 3200 + i * 250);
                    });

                    setTimeout(
                        () => setShowSummary(true),
                        3200 + allPanels.length * 250 + 500
                    );
                }
            },
            { threshold: 0.2 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const renderPanel = useCallback(
        (panel, globalIndex) => {
            const isVisible = visiblePanels.includes(globalIndex);
            const vals = PANEL_VALUES[panel.title];
            return (
                <div
                    key={globalIndex}
                    className={`${styles.panel} ${isVisible ? styles.visible : ""}`}
                    style={{ transitionDelay: `${globalIndex * 0.05}s` }}
                >
                    <div className={styles.panelHeader}>
                        <div className={styles.panelIcon}>{panel.icon}</div>
                        <div className={styles.panelTitle}>{panel.title}</div>
                    </div>
                    <div className={styles.panelValue}>
                        {isVisible ? (
                            <span className={styles.highlight}>{vals.after}</span>
                        ) : (
                            <span className={styles.scanning}>{vals.before}</span>
                        )}
                    </div>
                    <div className={styles.progressTrack}>
                        <div
                            className={styles.progressFill}
                            style={{ width: isVisible ? `${panel.progress}%` : "0%" }}
                        />
                    </div>
                    {panel.live && (
                        <div className={styles.liveTag}>
                            <span className={styles.liveDot} />
                            Processing Live
                        </div>
                    )}
                </div>
            );
        },
        [visiblePanels]
    );

    return (
        <section className={styles.section} ref={sectionRef}>
            <div className={styles.inner}>
                {/* Header */}
                <div className={`${styles.header} reveal`}>
                    <span className={styles.tag}>AI Intelligence Core</span>
                    <h2 className={styles.title}>
                        Meet Your <span className="text-gradient">AI Employee</span>
                    </h2>
                    <p className={styles.subtitle}>
                        A real AI that feels, understands, and transforms into pure neural
                        intelligence to handle every customer interaction perfectly.
                    </p>
                </div>

                {/* Hologram Stage */}
                <div className={styles.stage}>
                    {/* Particles */}
                    <div
                        className={`${styles.particleAura} ${phase !== "real" ? styles.particlesActive : ""
                            }`}
                    >
                        {particles.map((p, i) => (
                            <div
                                key={i}
                                className={styles.particle}
                                style={{
                                    left: p.left,
                                    top: p.top,
                                    width: p.size,
                                    height: p.size,
                                    background: p.color,
                                    animationDuration: `${p.dur}s`,
                                    animationDelay: `${p.delay}s`,
                                }}
                            />
                        ))}
                    </div>

                    {/* Neural connection SVG lines to panels */}
                    <svg
                        className={`${styles.neuralLines} ${phase === "neural" ? styles.linesActive : ""
                            }`}
                        viewBox="0 0 1300 600"
                        preserveAspectRatio="none"
                    >
                        {[
                            { d: "M 360 100 Q 440 80 480 150", dur: "3s" },
                            { d: "M 360 280 Q 440 290 480 300", dur: "4s", begin: "0.5s" },
                            { d: "M 360 450 Q 440 460 490 430", dur: "3.5s", begin: "1s" },
                            { d: "M 820 150 Q 860 80 940 100", dur: "3.5s", begin: "0.3s" },
                            { d: "M 820 300 Q 860 290 940 280", dur: "4.5s", begin: "0.8s" },
                            { d: "M 810 430 Q 860 460 940 450", dur: "3s", begin: "1.5s" },
                        ].map((line, i) => (
                            <path key={i} className={styles.neuralLine} d={line.d}>
                                <animate attributeName="stroke-opacity" values="0.05;0.25;0.05" dur={line.dur} repeatCount="indefinite" begin={line.begin || "0s"} />
                            </path>
                        ))}

                        {[
                            { path: "M 360 100 Q 440 80 480 150", dur: "2.5s" },
                            { path: "M 820 150 Q 860 80 940 100", dur: "3s", begin: "0.5s" },
                            { path: "M 360 450 Q 440 460 490 430", dur: "2.8s", begin: "1s" },
                            { path: "M 810 430 Q 860 460 940 450", dur: "3.2s", begin: "1.5s" },
                        ].map((dot, i) => (
                            <circle key={i} className={styles.neuralDot} r="2.5" opacity="0">
                                <animateMotion dur={dot.dur} repeatCount="indefinite" path={dot.path} begin={dot.begin || "0s"} />
                                <animate attributeName="opacity" values="0;0.8;0" dur={dot.dur} repeatCount="indefinite" begin={dot.begin || "0s"} />
                            </circle>
                        ))}
                    </svg>

                    {/* Left Panels */}
                    <div className={styles.panelsLeft}>
                        {LEFT_PANELS.map((p, i) => renderPanel(p, i))}
                    </div>

                    {/* Figure Container — real person → SVG neural */}
                    <div className={`${styles.figureContainer} ${styles[phase]}`}>
                        {/* Real person image */}
                        <div className={styles.realPerson}>
                            <Image
                                src="/images/ai-person-real.png"
                                alt="AI Employee"
                                width={420}
                                height={520}
                                className={styles.personImage}
                                priority
                            />
                        </div>

                        {/* SVG Neural figure — replaces the image */}
                        <div className={styles.neuralPerson}>
                            <NeuralFigure pointing="both" glowing={phase === "neural"} />
                        </div>

                        {/* Glitch overlay */}
                        <div className={styles.glitchOverlay} />

                        {/* Scan line */}
                        <div className={styles.holoScan} />

                        {/* Base glow */}
                        <div className={styles.holoBase} />
                    </div>

                    {/* Right Panels */}
                    <div className={styles.panelsRight}>
                        {RIGHT_PANELS.map((p, i) =>
                            renderPanel(p, LEFT_PANELS.length + i)
                        )}
                    </div>
                </div>

                {/* Summary Stats */}
                <div className={styles.summaryBar}>
                    {SUMMARY_STATS.map((stat, i) => (
                        <div
                            key={i}
                            className={`${styles.summaryItem} ${showSummary ? styles.visible : ""
                                }`}
                            style={{ transitionDelay: `${i * 0.12}s` }}
                        >
                            <div className={styles.summaryNumber}>{stat.number}</div>
                            <div className={styles.summaryLabel}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
