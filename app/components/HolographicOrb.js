"use client";
import { useEffect, useRef } from "react";
import styles from "./HolographicOrb.module.css";

export default function HolographicOrb() {
    const orbRef = useRef(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (window.innerWidth < 768) return;
        const orb = orbRef.current;
        if (!orb) return;

        const handleMove = (e) => {
            const rect = orb.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const dx = (e.clientX - centerX) / window.innerWidth;
            const dy = (e.clientY - centerY) / window.innerHeight;
            mouseRef.current = { x: dx, y: dy };

            orb.style.setProperty("--mx", `${dx * 15}deg`);
            orb.style.setProperty("--my", `${-dy * 15}deg`);
        };

        window.addEventListener("mousemove", handleMove, { passive: true });
        return () => window.removeEventListener("mousemove", handleMove);
    }, []);

    return (
        <div ref={orbRef} className={styles.orbContainer} aria-hidden="true">
            <div className={styles.orb}>
                <div className={styles.orbInner} />
                <div className={styles.orbRing} />
                <div className={styles.orbRing2} />
                <div className={styles.orbPulse} />
                <div className={styles.orbGlow} />
            </div>
        </div>
    );
}
