"use client";
import { useUnlockState } from "./UnlockSection";
import styles from "./NeuralGuideSpine.module.css";

/* ═══════════════════════════════════════════════
   Neuron Traveler — Scroll Progress Indicator
   ─────────────────────────────────────────────
   A glowing neuron dot travels down a thin neural
   path on the left edge. Nodes light up as sections
   are revealed. Purely decorative (aria-hidden).
   z-index 5 → always behind page content.
   ═══════════════════════════════════════════════ */

const LABELS = ["Scanning", "Mapping", "Activating", "Optimizing", "Complete"];

export default function NeuralGuideSpine() {
    const { progress, revealedSections, total } = useUnlockState();
    const pct = Math.round(progress * 100);
    const labelIdx = Math.min(
        Math.floor(progress * LABELS.length),
        LABELS.length - 1
    );
    const nodes = total || 4;

    return (
        <div className={styles.spine} aria-hidden="true">
            {/* Neural path (vertical line) */}
            <div className={styles.track}>
                {/* Progress fill */}
                <div className={styles.fill} style={{ height: `${pct}%` }} />

                {/* Traveling neuron dot */}
                <div className={styles.neuron} style={{ top: `${pct}%` }}>
                    <div className={styles.neuronCore} />
                    <div className={styles.neuronGlow} />
                    <div className={styles.neuronPulse} />
                </div>

                {/* Trail above the dot */}
                <div
                    className={styles.trail}
                    style={{
                        top: `${Math.max(0, pct - 12)}%`,
                        height: "12%",
                        opacity: pct > 5 ? 0.6 : 0
                    }}
                />

                {/* Section anchor nodes */}
                {Array.from({ length: nodes }).map((_, i) => {
                    const y = ((i + 1) / (nodes + 1)) * 100;
                    const active = pct >= y;
                    return (
                        <div
                            key={i}
                            className={`${styles.node} ${active ? styles.nodeActive : ""}`}
                            style={{ top: `${y}%` }}
                        >
                            {/* Branch lines from active nodes */}
                            {active && <div className={styles.branch} />}
                        </div>
                    );
                })}
            </div>

            {/* Status badge */}
            <div
                className={styles.badge}
                style={{ top: `${Math.min(pct + 3, 94)}%` }}
            >
                <span className={styles.badgeLabel}>{LABELS[labelIdx]}</span>
                <span className={styles.badgePct}>{pct}%</span>
            </div>
        </div>
    );
}
