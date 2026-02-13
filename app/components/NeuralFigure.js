"use client";
import { memo } from "react";
import Image from "next/image";
import styles from "./NeuralFigure.module.css";

/* ═══════════════════════════════════════════════
   3D Wireframe Mesh Human Figure
   ─────────────────────────────────────────────
   High-quality 3D wireframe mesh image with
   interactive CSS effects and SVG energy
   overlays. The figure glows, floats, and
   integrates naturally with the dark site theme.
   
   Props:
     pointing - "center" | "topLeft" | "topRight"
                | "bottomLeft" | "bottomRight" | "both"
     glowing  - boolean, whether the figure is actively glowing
   ═══════════════════════════════════════════════ */

function NeuralFigure({ pointing = "center", glowing = false }) {
    const showLeftEnergy = ["topLeft", "bottomLeft", "both"].includes(pointing);
    const showRightEnergy = ["topRight", "bottomRight", "both"].includes(pointing);

    return (
        <div className={`${styles.wrapper} ${glowing ? styles.glowing : ""} ${styles[`point_${pointing}`] || ""}`}>
            {/* Ambient glow behind figure */}
            <div className={styles.ambientGlow} />

            {/* Main 3D wireframe image */}
            <div className={styles.figureContainer}>
                <Image
                    src="/images/ai-wireframe-v2.png"
                    alt="Neural AI Entity"
                    width={420}
                    height={520}
                    className={styles.figureImage}
                    priority
                />

                {/* Holographic scan line passes over figure */}
                <div className={styles.scanLine} />

                {/* Glitch bars */}
                <div className={styles.glitchOverlay} />
            </div>

            {/* Interactive energy nodes at hands */}
            <svg className={styles.energySvg} viewBox="0 0 420 520" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <radialGradient id="nfHandGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#6C5CE7" stopOpacity="0" />
                    </radialGradient>
                    <filter id="nfEGlow" x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
                    </filter>
                </defs>

                {/* Left hand energy */}
                {showLeftEnergy && (
                    <g className={styles.handEnergy}>
                        <circle cx="85" cy="330" r="15" fill="url(#nfHandGrad)" filter="url(#nfEGlow)" />
                        <circle cx="85" cy="330" r="8" fill="none" stroke="#00D2FF" strokeWidth="1.5" className={styles.pulse1} />
                        <circle cx="85" cy="330" r="12" fill="none" stroke="#6C5CE7" strokeWidth="0.8" className={styles.pulse2} />
                        <circle cx="85" cy="330" r="18" fill="none" stroke="#00D2FF" strokeWidth="0.5" className={styles.pulse3} />
                    </g>
                )}

                {/* Right hand energy */}
                {showRightEnergy && (
                    <g className={styles.handEnergy}>
                        <circle cx="335" cy="330" r="15" fill="url(#nfHandGrad)" filter="url(#nfEGlow)" />
                        <circle cx="335" cy="330" r="8" fill="none" stroke="#00D2FF" strokeWidth="1.5" className={styles.pulse1} />
                        <circle cx="335" cy="330" r="12" fill="none" stroke="#6C5CE7" strokeWidth="0.8" className={styles.pulse2} />
                        <circle cx="335" cy="330" r="18" fill="none" stroke="#00D2FF" strokeWidth="0.5" className={styles.pulse3} />
                    </g>
                )}

                {/* Core heartbeat */}
                <circle cx="210" cy="205" r="10" fill="none" stroke="#00D2FF" strokeWidth="0.8" className={styles.heartbeat} />
                <circle cx="210" cy="205" r="16" fill="none" stroke="#6C5CE7" strokeWidth="0.5" className={styles.heartbeat2} />
            </svg>

            {/* Base platform glow */}
            <div className={styles.platformGlow} />
        </div>
    );
}

export default memo(NeuralFigure);
