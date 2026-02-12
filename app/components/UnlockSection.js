"use client";
import { useRef, useState, useEffect, createContext, useContext } from "react";
import styles from "./UnlockSection.module.css";

/* ── Unlock Context ──────────────────── */
const UnlockCtx = createContext({ unlocked: new Set(), progress: 0 });
export const useUnlockState = () => useContext(UnlockCtx);

/* ── Provider: tracks scroll progress + unlocked sections ── */
export function NeuralRevealProvider({ children, sectionIds = [] }) {
    const [unlocked, setUnlocked] = useState(new Set());
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (mq.matches) {
            // Unlock everything immediately for reduced motion
            setUnlocked(new Set(sectionIds));
            setProgress(1);
            return;
        }

        const onScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const p = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
            setProgress(p);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, [sectionIds]);

    const unlock = (id) => {
        setUnlocked((prev) => {
            if (prev.has(id)) return prev;
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };

    return (
        <UnlockCtx.Provider value={{ unlocked, progress, unlock, total: sectionIds.length }}>
            {children}
        </UnlockCtx.Provider>
    );
}

/* ── UnlockSection: wraps a section with lock/unlock behavior ── */
export default function UnlockSection({ id, children, threshold = 0.15 }) {
    const ref = useRef(null);
    const { unlocked, unlock } = useContext(UnlockCtx);
    const isUnlocked = unlocked.has(id);
    const [phase, setPhase] = useState("locked"); // locked → wireframe → revealed → settled

    // Observe when section enters viewport
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (mq.matches) {
            setPhase("settled");
            return;
        }

        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isUnlocked) {
                    unlock(id);
                }
            },
            { threshold }
        );
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [id, isUnlocked, threshold, unlock]);

    // Phased reveal animation
    useEffect(() => {
        if (!isUnlocked || phase !== "locked") return;

        // Phase 1: wireframe
        setPhase("wireframe");

        // Phase 2: revealed (content fades in)
        const t1 = setTimeout(() => setPhase("revealed"), 200);

        // Phase 3: settled (glow fades)
        const t2 = setTimeout(() => setPhase("settled"), 700);

        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [isUnlocked, phase]);

    return (
        <div
            ref={ref}
            className={`${styles.section} ${styles[phase]}`}
            data-unlock-id={id}
        >
            {/* Wireframe overlay */}
            <div className={styles.wireframe} aria-hidden="true">
                <div className={styles.wireLine} style={{ top: "20%" }} />
                <div className={styles.wireLine} style={{ top: "40%" }} />
                <div className={styles.wireLine} style={{ top: "60%" }} />
                <div className={styles.wireLine} style={{ top: "80%" }} />
                <div className={styles.wireLineV} style={{ left: "25%" }} />
                <div className={styles.wireLineV} style={{ left: "50%" }} />
                <div className={styles.wireLineV} style={{ left: "75%" }} />
            </div>

            {/* Unlock glow ring */}
            <div className={styles.glowRing} />

            {/* Content */}
            <div className={styles.content}>
                {children}
            </div>
        </div>
    );
}
