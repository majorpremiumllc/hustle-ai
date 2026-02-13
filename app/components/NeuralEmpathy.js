"use client";
import { useEffect, useRef, useState } from "react";
import NeuralFigure from "./NeuralFigure";
import styles from "./NeuralEmpathy.module.css";

/* ═══════════════════════════════════════════════
   Neural Empathy Engine — SVG Figure Pointing
   ─────────────────────────────────────────────
   SVG neural figure points at cards with its
   arms, each card glows when touched by neural
   energy flowing from the figure's hands.
   ═══════════════════════════════════════════════ */

const ANALYSIS_NODES = [
    {
        title: "MOOD DETECTION",
        icon: "🎭",
        from: "Frustrated",
        to: "Empathetic Tone",
        position: "topLeft",
        delay: 0,
    },
    {
        title: "BUSINESS CONTEXT",
        icon: "🏢",
        from: "Emergency Plumbing",
        to: "Priority Route",
        position: "topRight",
        delay: 2,
    },
    {
        title: "TONE ADAPTATION",
        icon: "🎵",
        from: "Urgent + Worried",
        to: "Calm & Reassuring",
        position: "bottomLeft",
        delay: 4,
    },
    {
        title: "INTENT CLASSIFICATION",
        icon: "⚡",
        from: "Booking Request",
        to: "Schedule Flow",
        position: "bottomRight",
        delay: 6,
    },
];

const RESPONSE_TEXT =
    "I completely understand the urgency — a burst pipe is stressful. I'm dispatching our closest available technician to your location right now. They'll be there within 30 minutes. In the meantime, can you locate your main water shutoff valve?";

export default function NeuralEmpathy() {
    const sectionRef = useRef(null);
    const hasTriggered = useRef(false);
    const [active, setActive] = useState(false);
    const [activeNodeIndex, setActiveNodeIndex] = useState(-1);
    const [allNodesShown, setAllNodesShown] = useState(false);
    const [showResponse, setShowResponse] = useState(false);
    const [typedText, setTypedText] = useState("");
    const [showScenario, setShowScenario] = useState(false);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasTriggered.current) {
                    hasTriggered.current = true;
                    setShowScenario(true);

                    setTimeout(() => setActive(true), 500);

                    ANALYSIS_NODES.forEach((node, i) => {
                        setTimeout(() => {
                            setActiveNodeIndex(i);
                        }, (node.delay + 1) * 1000);
                    });

                    const lastDelay = ANALYSIS_NODES[ANALYSIS_NODES.length - 1].delay;
                    setTimeout(() => {
                        setAllNodesShown(true);
                        setActiveNodeIndex(-1);
                    }, (lastDelay + 2.8) * 1000);

                    setTimeout(() => {
                        setShowResponse(true);
                    }, (lastDelay + 3.5) * 1000);
                }
            },
            { threshold: 0.15 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!showResponse) return;
        let idx = 0;
        const interval = setInterval(() => {
            idx++;
            setTypedText(RESPONSE_TEXT.slice(0, idx));
            if (idx >= RESPONSE_TEXT.length) clearInterval(interval);
        }, 20);
        return () => clearInterval(interval);
    }, [showResponse]);

    /* Figure pointing direction based on active card */
    const pointDirection =
        activeNodeIndex >= 0 ? ANALYSIS_NODES[activeNodeIndex].position : "center";

    return (
        <section className={styles.section} ref={sectionRef}>
            <div className={styles.inner}>
                <div className={`${styles.header} reveal`}>
                    <span className={styles.tag}>Neural Intelligence</span>
                    <h2 className={styles.title}>
                        AI That <span className="text-gradient">Feels</span> Your Customer
                    </h2>
                    <p className={styles.subtitle}>
                        Watch as our neural AI analyzes every dimension of a customer
                        interaction in real-time.
                    </p>
                </div>

                {showScenario && (
                    <div className={styles.scenario}>
                        <span className={styles.scenarioDot} />
                        Incoming Call: &quot;My pipe burst! I need someone NOW!&quot;
                    </div>
                )}

                <div className={styles.arena}>
                    {/* SVG Neural Figure — integrated into the site */}
                    <div
                        className={`${styles.figure} ${active ? styles.figureActive : ""}`}
                    >
                        <NeuralFigure
                            pointing={pointDirection}
                            glowing={activeNodeIndex >= 0 || allNodesShown}
                        />

                        {/* Connection energy lines from figure to active card */}
                        {activeNodeIndex >= 0 && (
                            <svg className={styles.energyBeams} viewBox="0 0 800 600" preserveAspectRatio="none">
                                {ANALYSIS_NODES[activeNodeIndex].position.includes("Left") ? (
                                    <path
                                        d={ANALYSIS_NODES[activeNodeIndex].position === "topLeft"
                                            ? "M 350 180 Q 200 120 50 160"
                                            : "M 350 350 Q 200 380 50 370"}
                                        className={styles.energyLine}
                                    />
                                ) : (
                                    <path
                                        d={ANALYSIS_NODES[activeNodeIndex].position === "topRight"
                                            ? "M 450 180 Q 600 120 750 160"
                                            : "M 450 350 Q 600 380 750 370"}
                                        className={styles.energyLine}
                                    />
                                )}
                            </svg>
                        )}
                    </div>

                    {/* Analysis Cards */}
                    {ANALYSIS_NODES.map((node, i) => {
                        const isActive = activeNodeIndex === i;
                        const isShown = allNodesShown || activeNodeIndex >= i;
                        return (
                            <div
                                key={i}
                                className={`${styles.card} ${styles[`card_${node.position}`]} ${isShown ? styles.cardVisible : ""
                                    } ${isActive ? styles.cardGlowing : ""}`}
                            >
                                {isActive && <div className={styles.cardNeuralGlow} />}

                                <div className={styles.cardIcon}>{node.icon}</div>
                                <div className={styles.cardTitle}>{node.title}</div>
                                <div className={styles.cardValue}>
                                    {node.from}{" "}
                                    <span className={styles.arrow}>→</span>{" "}
                                    <span className={styles.cardHighlight}>
                                        <span className={styles.dot} />
                                        {node.to}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {showResponse && (
                    <div className={styles.response}>
                        <div className={styles.responseHeader}>
                            <span className={styles.responseIcon}>🤖</span>
                            <span className={styles.responseLabel}>AI-Generated Response</span>
                        </div>
                        <p className={styles.responseText}>
                            {typedText}
                            <span className={styles.cursor} />
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
