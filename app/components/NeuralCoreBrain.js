"use client";
import { useEffect, useRef } from "react";
import styles from "./NeuralCoreBrain.module.css";

/**
 * NeuralCoreBrain — SVG brain-like silhouette with glowing nodes.
 * Nodes blink asynchronously, connection lines pulse, breathing glow (10s cycle).
 */
export default function NeuralCoreBrain() {
    const containerRef = useRef(null);

    // The brain is a collection of positioned neural nodes
    const nodes = [
        // Left hemisphere
        { cx: 38, cy: 28, r: 2.5 }, { cx: 26, cy: 40, r: 2 }, { cx: 32, cy: 55, r: 2.2 },
        { cx: 20, cy: 58, r: 1.8 }, { cx: 28, cy: 72, r: 2 }, { cx: 40, cy: 68, r: 2.5 },
        { cx: 35, cy: 45, r: 1.5 }, { cx: 22, cy: 48, r: 1.8 },
        // Right hemisphere
        { cx: 62, cy: 28, r: 2.5 }, { cx: 74, cy: 40, r: 2 }, { cx: 68, cy: 55, r: 2.2 },
        { cx: 80, cy: 58, r: 1.8 }, { cx: 72, cy: 72, r: 2 }, { cx: 60, cy: 68, r: 2.5 },
        { cx: 65, cy: 45, r: 1.5 }, { cx: 78, cy: 48, r: 1.8 },
        // Center (corpus callosum)
        { cx: 50, cy: 35, r: 3 }, { cx: 50, cy: 50, r: 2.8 }, { cx: 50, cy: 65, r: 2.5 },
        { cx: 45, cy: 42, r: 1.5 }, { cx: 55, cy: 42, r: 1.5 },
    ];

    // Connections between nodes
    const connections = [
        [0, 6], [0, 16], [1, 7], [1, 6], [2, 3], [2, 17], [3, 7], [4, 5], [4, 18],
        [5, 17], [6, 19], [7, 3],
        [8, 14], [8, 16], [9, 15], [9, 14], [10, 11], [10, 17], [11, 15], [12, 13], [12, 18],
        [13, 17], [14, 20], [15, 11],
        [16, 17], [17, 18], [19, 16], [20, 16],
    ];

    return (
        <div className={styles.brainContainer}>
            <div className={styles.brainLabel}>Neural Core Online</div>
            <div className={styles.brainGlow} />
            <svg viewBox="0 0 100 100" className={styles.brainSvg} aria-hidden="true">
                {/* Connections */}
                {connections.map(([a, b], i) => (
                    <line
                        key={`c${i}`}
                        x1={nodes[a].cx} y1={nodes[a].cy}
                        x2={nodes[b].cx} y2={nodes[b].cy}
                        stroke="rgba(0,210,255,0.12)"
                        strokeWidth="0.4"
                        className={styles.connectionLine}
                        style={{ animationDelay: `${(i * 0.7) % 8}s` }}
                    />
                ))}
                {/* Nodes */}
                {nodes.map((n, i) => (
                    <g key={`n${i}`}>
                        {/* Glow halo */}
                        <circle
                            cx={n.cx} cy={n.cy} r={n.r * 3}
                            fill="rgba(108,92,231,0.08)"
                            className={styles.nodeHalo}
                            style={{ animationDelay: `${(i * 1.3) % 6}s` }}
                        />
                        {/* Core node */}
                        <circle
                            cx={n.cx} cy={n.cy} r={n.r}
                            fill="rgba(0,210,255,0.7)"
                            className={styles.node}
                            style={{ animationDelay: `${(i * 0.9) % 5}s` }}
                        />
                    </g>
                ))}
                {/* Brain outline (subtle) */}
                <ellipse cx="50" cy="50" rx="36" ry="32" fill="none"
                    stroke="rgba(108,92,231,0.06)" strokeWidth="0.5"
                    className={styles.brainOutline}
                />
            </svg>
        </div>
    );
}
