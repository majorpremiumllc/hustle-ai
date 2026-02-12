"use client";
import { useContext } from "react";
import styles from "./NeuralGuideSpine.module.css";

/* Import the unlock context from UnlockSection */
import { useUnlockState } from "./UnlockSection";

const STATUS_LABELS = ["INITIALIZING", "ACTIVATING", "PROCESSING", "ONLINE"];

export default function NeuralGuideSpine() {
    const { progress, unlocked, total } = useUnlockState();
    const pct = Math.round(progress * 100);

    // Status label based on progress
    const statusIdx = Math.min(Math.floor(progress * STATUS_LABELS.length), STATUS_LABELS.length - 1);
    const statusLabel = STATUS_LABELS[statusIdx];

    // Nodes at unlock thresholds (evenly spaced)
    const nodeCount = total || 4;

    return (
        <div className={styles.spine} aria-hidden="true">
            {/* Track */}
            <div className={styles.track}>
                {/* Fill (progress) */}
                <div className={styles.fill} style={{ height: `${pct}%` }} />

                {/* Traveling pulse */}
                <div className={styles.pulse} style={{ top: `${pct}%` }}>
                    <div className={styles.pulseCore} />
                    <div className={styles.pulseSpark} />
                    <div className={styles.pulseSpark} style={{ animationDelay: "0.3s" }} />
                </div>

                {/* Anchor nodes */}
                {Array.from({ length: nodeCount }).map((_, i) => {
                    const pos = ((i + 1) / (nodeCount + 1)) * 100;
                    const isActive = pct >= pos;
                    return (
                        <div
                            key={i}
                            className={`${styles.node} ${isActive ? styles.nodeActive : ""}`}
                            style={{ top: `${pos}%` }}
                        >
                            <div className={styles.nodeRing} />
                        </div>
                    );
                })}
            </div>

            {/* Progress label */}
            <div className={styles.label} style={{ top: `${Math.min(pct + 2, 95)}%` }}>
                <span className={styles.labelText}>AI {statusLabel}</span>
                <span className={styles.labelPct}>{pct}%</span>
            </div>
        </div>
    );
}
