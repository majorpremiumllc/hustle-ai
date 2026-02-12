"use client";
import { useEffect, useRef } from "react";
import styles from "./HustleLogo.module.css";

/**
 * HustleLogo — "AI Pulse Bolt" concept
 * Lightning bolt with subtle neural nodes + connecting lines.
 * Variants: "full" (icon + wordmark), "icon" (icon only), "wordmark" (text only).
 */
export default function HustleLogo({ variant = "full", className = "", size = 32 }) {
    const glowRef = useRef(null);

    useEffect(() => {
        // Subtle pulse glow every 5s
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
            {/* Neural network nodes */}
            <circle cx="8" cy="10" r="1.5" fill="rgba(0,210,255,0.5)">
                <animate attributeName="opacity" values="0.3;0.8;0.3" dur="4s" repeatCount="indefinite" />
            </circle>
            <circle cx="32" cy="8" r="1.2" fill="rgba(108,92,231,0.5)">
                <animate attributeName="opacity" values="0.4;0.9;0.4" dur="5s" repeatCount="indefinite" />
            </circle>
            <circle cx="35" cy="28" r="1.3" fill="rgba(0,210,255,0.4)">
                <animate attributeName="opacity" values="0.3;0.7;0.3" dur="6s" repeatCount="indefinite" />
            </circle>
            {/* Connecting lines */}
            <line x1="8" y1="10" x2="16" y2="12" stroke="rgba(0,210,255,0.15)" strokeWidth="0.5" />
            <line x1="32" y1="8" x2="24" y2="12" stroke="rgba(108,92,231,0.15)" strokeWidth="0.5" />
            <line x1="35" y1="28" x2="26" y2="24" stroke="rgba(0,210,255,0.12)" strokeWidth="0.5" />

            {/* Main bolt shape */}
            <path
                d="M22 4L12 20h7l-3 16 14-20h-8l4-12z"
                fill="url(#boltGrad)"
                className={styles.boltPath}
            />
            {/* Glow overlay */}
            <path
                ref={glowRef}
                d="M22 4L12 20h7l-3 16 14-20h-8l4-12z"
                fill="url(#boltGlow)"
                className={styles.boltGlow}
                opacity="0"
            />
            <defs>
                <linearGradient id="boltGrad" x1="14" y1="4" x2="28" y2="36" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#00D2FF" />
                    <stop offset="50%" stopColor="#A29BFE" />
                    <stop offset="100%" stopColor="#6C5CE7" />
                </linearGradient>
                <linearGradient id="boltGlow" x1="14" y1="4" x2="28" y2="36" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#6C5CE7" stopOpacity="0.3" />
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
        <span className={`${styles.logo} ${styles[variant]} ${className}`}>
            {(variant === "full" || variant === "icon") && <BoltIcon />}
            {(variant === "full" || variant === "wordmark") && <Wordmark />}
        </span>
    );
}
