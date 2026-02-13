"use client";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTour } from "./TourManager";
import styles from "./NeuralPulse.module.css";

/* ═══════════════════════════════════════════════
   Neural Pulse Projectile
   ─────────────────────────────────────────────
   Glowing AI orb that shoots from the card origin
   to the target section. One-shot: unmounts after
   animation completes. No persistent artifacts.
   ═══════════════════════════════════════════════ */

const DURATION = 0.9; /* seconds */

export default function NeuralPulse() {
    const tour = useTour();
    const [origin, setOrigin] = useState({ x: 0, y: 0 });
    const firedRef = useRef(false);

    /* Origin: bottom-right near the guide card */
    useEffect(() => {
        const updateOrigin = () => {
            setOrigin({
                x: window.innerWidth - 60,
                y: window.innerHeight - 60,
            });
        };
        updateOrigin();
        window.addEventListener("resize", updateOrigin);
        return () => window.removeEventListener("resize", updateOrigin);
    }, []);

    if (!tour) return null;

    const { pulseActive, targetRect, onPulseComplete } = tour;

    const target = targetRect
        ? { x: targetRect.centerX, y: targetRect.centerY }
        : origin;

    /* Reset fired flag when pulse becomes active */
    if (pulseActive) {
        firedRef.current = false;
    }

    return (
        <AnimatePresence>
            {pulseActive && targetRect && (
                <PulseOrb
                    origin={origin}
                    target={target}
                    onComplete={onPulseComplete}
                    firedRef={firedRef}
                />
            )}
        </AnimatePresence>
    );
}

/* Separate component so we can use useEffect for the fallback timer */
function PulseOrb({ origin, target, onComplete, firedRef }) {
    useEffect(() => {
        /* Fallback: if framer-motion doesn't fire onAnimationComplete,
           trigger after duration + buffer */
        const t = setTimeout(() => {
            if (!firedRef.current) {
                firedRef.current = true;
                onComplete();
            }
        }, DURATION * 1000 + 200);
        return () => clearTimeout(t);
    }, [onComplete, firedRef]);

    return (
        <motion.div
            className={styles.pulse}
            initial={{
                x: origin.x,
                y: origin.y,
                scale: 0.3,
                opacity: 0,
            }}
            animate={{
                x: [origin.x, (origin.x + target.x) / 2, target.x],
                y: [origin.y, Math.min(origin.y, target.y) - 80, target.y],
                scale: [0.3, 1.2, 1],
                opacity: [0, 1, 1],
            }}
            exit={{
                scale: [1, 2.5],
                opacity: [1, 0],
                transition: { duration: 0.3 },
            }}
            transition={{
                duration: DURATION,
                ease: [0.22, 1, 0.36, 1],
                times: [0, 0.5, 1],
            }}
            onAnimationComplete={() => {
                if (!firedRef.current) {
                    firedRef.current = true;
                    onComplete();
                }
            }}
            aria-hidden="true"
        >
            <div className={styles.core} />
            <div className={styles.glow} />
            <div className={styles.ring} />
        </motion.div>
    );
}
