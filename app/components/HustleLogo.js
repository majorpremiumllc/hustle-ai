"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./HustleLogo.module.css";

/**
 * HustleLogo — "Neural Pulse Bolt"
 * Lightning bolt with orbiting neural synapses + animated connections.
 * Variants: "full" (icon + wordmark), "icon" (icon only), "wordmark" (text only).
 */
export default function HustleLogo({ variant = "full", className = "", size = 32 }) {
    const glowRef = useRef(null);
    const [hovered, setHovered] = useState(false);

    useEffect(() => {
        const glow = glowRef.current;
        if (!glow) return;
        const interval = setInterval(() => {
            glow.classList.add(styles.pulse);
            setTimeout(() => glow.classList.remove(styles.pulse), 1200);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const iconSize = size;

    const BoltIcon = () => (
        <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 40 40"
            fill="none"
            className={styles.logoIcon}
            aria-hidden="true"
        >
            {/* Neural network nodes — orbiting synapses */}
            <circle cx="6" cy="8" r="1.5" fill="rgba(0,210,255,0.6)" className={styles.synapse}>
                <animate attributeName="cx" values="6;8;6" dur="6s" repeatCount="indefinite" />
                <animate attributeName="cy" values="8;5;8" dur="6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.9;0.3" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="34" cy="7" r="1.3" fill="rgba(108,92,231,0.6)" className={styles.synapse}>
                <animate attributeName="cx" values="34;32;34" dur="5s" repeatCount="indefinite" />
                <animate attributeName="cy" values="7;10;7" dur="5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;1;0.4" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="36" cy="28" r="1.2" fill="rgba(0,210,255,0.5)" className={styles.synapse}>
                <animate attributeName="cx" values="36;33;36" dur="7s" repeatCount="indefinite" />
                <animate attributeName="cy" values="28;31;28" dur="7s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="5s" repeatCount="indefinite" />
            </circle>
            <circle cx="4" cy="30" r="1.1" fill="rgba(162,155,254,0.5)" className={styles.synapse}>
                <animate attributeName="cx" values="4;7;4" dur="8s" repeatCount="indefinite" />
                <animate attributeName="cy" values="30;27;30" dur="8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.7;0.2" dur="6s" repeatCount="indefinite" />
            </circle>
            <circle cx="20" cy="2" r="1.0" fill="rgba(0,210,255,0.4)" className={styles.synapse}>
                <animate attributeName="cy" values="2;4;2" dur="4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="20" cy="38" r="1.1" fill="rgba(108,92,231,0.4)" className={styles.synapse}>
                <animate attributeName="cy" values="38;36;38" dur="5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.2;0.7;0.2" dur="4s" repeatCount="indefinite" />
            </circle>

            {/* Connecting lines with animated pulse */}
            <line x1="6" y1="8" x2="16" y2="14" stroke="url(#connGrad1)" strokeWidth="0.5" className={styles.connLine}>
                <animate attributeName="stroke-opacity" values="0.1;0.4;0.1" dur="3s" repeatCount="indefinite" />
            </line>
            <line x1="34" y1="7" x2="24" y2="12" stroke="url(#connGrad2)" strokeWidth="0.5" className={styles.connLine}>
                <animate attributeName="stroke-opacity" values="0.1;0.4;0.1" dur="4s" repeatCount="indefinite" begin="0.5s" />
            </line>
            <line x1="36" y1="28" x2="26" y2="24" stroke="url(#connGrad1)" strokeWidth="0.5" className={styles.connLine}>
                <animate attributeName="stroke-opacity" values="0.1;0.35;0.1" dur="5s" repeatCount="indefinite" begin="1s" />
            </line>
            <line x1="4" y1="30" x2="14" y2="24" stroke="url(#connGrad2)" strokeWidth="0.5" className={styles.connLine}>
                <animate attributeName="stroke-opacity" values="0.1;0.35;0.1" dur="4.5s" repeatCount="indefinite" begin="0.8s" />
            </line>
            <line x1="20" y1="2" x2="20" y2="10" stroke="url(#connGrad1)" strokeWidth="0.4" className={styles.connLine}>
                <animate attributeName="stroke-opacity" values="0.05;0.3;0.05" dur="3.5s" repeatCount="indefinite" begin="0.3s" />
            </line>
            <line x1="20" y1="38" x2="18" y2="32" stroke="url(#connGrad2)" strokeWidth="0.4" className={styles.connLine}>
                <animate attributeName="stroke-opacity" values="0.05;0.3;0.05" dur="4s" repeatCount="indefinite" begin="1.2s" />
            </line>

            {/* Traveling pulse dots */}
            <circle r="1" fill="#00D2FF" opacity="0.8">
                <animateMotion dur="2s" repeatCount="indefinite" path="M 6,8 L 16,14" />
                <animate attributeName="opacity" values="0;0.8;0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r="0.8" fill="#A29BFE" opacity="0.8">
                <animateMotion dur="2.5s" repeatCount="indefinite" path="M 34,7 L 24,12" begin="0.7s" />
                <animate attributeName="opacity" values="0;0.8;0" dur="2.5s" repeatCount="indefinite" begin="0.7s" />
            </circle>
            <circle r="0.9" fill="#6C5CE7" opacity="0.8">
                <animateMotion dur="3s" repeatCount="indefinite" path="M 36,28 L 26,24" begin="1.4s" />
                <animate attributeName="opacity" values="0;0.7;0" dur="3s" repeatCount="indefinite" begin="1.4s" />
            </circle>

            {/* Main bolt shape */}
            <path
                d="M22 4L12 20h7l-3 16 14-20h-8l4-12z"
                fill="url(#boltGradN)"
                className={styles.boltPath}
            />
            {/* Glow overlay */}
            <path
                ref={glowRef}
                d="M22 4L12 20h7l-3 16 14-20h-8l4-12z"
                fill="url(#boltGlowN)"
                className={styles.boltGlow}
                opacity="0"
            />

            <defs>
                <linearGradient id="boltGradN" x1="14" y1="4" x2="28" y2="36" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#00D2FF" />
                    <stop offset="50%" stopColor="#A29BFE" />
                    <stop offset="100%" stopColor="#6C5CE7" />
                </linearGradient>
                <linearGradient id="boltGlowN" x1="14" y1="4" x2="28" y2="36" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#6C5CE7" stopOpacity="0.3" />
                </linearGradient>
                <linearGradient id="connGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#6C5CE7" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="connGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#6C5CE7" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#00D2FF" stopOpacity="0.1" />
                </linearGradient>
            </defs>
        </svg>
    );

    const Wordmark = () => (
        <span className={styles.wordmark}>
            <span className={styles.wordHustle}>Hustle</span>
            <span className={styles.wordAI}>AI</span>
        </span>
    );

    return (
        <span
            className={`${styles.logo} ${styles[variant]} ${className}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            data-hovered={hovered || undefined}
        >
            {(variant === "full" || variant === "icon") && <BoltIcon />}
            {(variant === "full" || variant === "wordmark") && <Wordmark />}
        </span>
    );
}
