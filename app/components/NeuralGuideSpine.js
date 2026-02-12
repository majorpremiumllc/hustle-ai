"use client";
import { useUnlockState } from "./UnlockSection";
import styles from "./NeuralGuideSpine.module.css";

const LABELS = ["INITIALIZING", "ACTIVATING", "PROCESSING", "ONLINE"];

export default function NeuralGuideSpine() {
    const { progress, unlocked, total } = useUnlockState();
    const pct = Math.round(progress * 100);
    const statusIdx = Math.min(Math.floor(progress * LABELS.length), LABELS.length - 1);
    const nodes = total || 4;

    return (
        <div className={styles.spine} aria-hidden="true">
            <div className={styles.track}>
                <div className={styles.fill} style={{ height: `${pct}%` }} />

                {/* Traveling dot */}
                <div className={styles.dot} style={{ top: `${pct}%` }} />

                {/* Section nodes */}
                {Array.from({ length: nodes }).map((_, i) => {
                    const y = ((i + 1) / (nodes + 1)) * 100;
                    const on = pct >= y;
                    return (
                        <div key={i} className={`${styles.node} ${on ? styles.on : ""}`} style={{ top: `${y}%` }} />
                    );
                })}
            </div>

            {/* Status badge */}
            <div className={styles.badge} style={{ top: `${Math.min(pct + 2, 94)}%` }}>
                <span>{LABELS[statusIdx]}</span>
                <span className={styles.pct}>{pct}%</span>
            </div>
        </div>
    );
}
