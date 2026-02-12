"use client";
import { useRef, useState, useEffect, useCallback, createContext, useContext } from "react";
import styles from "./UnlockSection.module.css";

/* ── Unlock Context ──────────────────── */
const UnlockCtx = createContext({
    unlocked: new Set(),
    progress: 0,
    unlock: () => { },
    total: 0,
});
export const useUnlockState = () => useContext(UnlockCtx);

/* ── Provider ────────────────────────── */
export function NeuralRevealProvider({ children, sectionIds = [] }) {
    const [unlocked, setUnlocked] = useState(new Set());
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (mq.matches) {
            setUnlocked(new Set(sectionIds));
            setProgress(1);
            return;
        }

        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const docH = document.documentElement.scrollHeight - window.innerHeight;
                setProgress(docH > 0 ? Math.min(window.scrollY / docH, 1) : 0);
                ticking = false;
            });
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, [sectionIds]);

    const unlock = useCallback((id) => {
        setUnlocked((prev) => {
            if (prev.has(id)) return prev;
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    }, []);

    return (
        <UnlockCtx.Provider value={{ unlocked, progress, unlock, total: sectionIds.length }}>
            {children}
        </UnlockCtx.Provider>
    );
}

/* ── UnlockSection ───────────────────── */
export default function UnlockSection({ id, children, threshold = 0.12 }) {
    const ref = useRef(null);
    const { unlocked, unlock } = useContext(UnlockCtx);
    const isUnlocked = unlocked.has(id);
    // phases: locked → building → revealed → settled
    const [phase, setPhase] = useState("locked");

    /* Observe viewport entry → unlock */
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (mq.matches) { setPhase("settled"); return; }

        const el = ref.current;
        if (!el) return;

        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isUnlocked) unlock(id);
            },
            { threshold, rootMargin: "0px 0px -30px 0px" }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [id, isUnlocked, threshold, unlock]);

    /* Phase progression: locked → building → revealed → settled */
    useEffect(() => {
        if (!isUnlocked || phase !== "locked") return;
        setPhase("building");
        const t1 = setTimeout(() => setPhase("revealed"), 180);
        const t2 = setTimeout(() => setPhase("settled"), 650);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, [isUnlocked, phase]);

    return (
        <div
            ref={ref}
            className={`${styles.wrap} ${styles["phase_" + phase]}`}
            data-unlock-id={id}
        >
            {/* Wireframe grid (only visible during building phase) */}
            <div className={styles.gridOverlay} aria-hidden="true">
                <div className={styles.hLine} style={{ top: "20%" }} />
                <div className={styles.hLine} style={{ top: "45%" }} />
                <div className={styles.hLine} style={{ top: "70%" }} />
                <div className={styles.vLine} style={{ left: "30%" }} />
                <div className={styles.vLine} style={{ left: "60%" }} />
            </div>

            {/* Unlock ring (only during revealed phase) */}
            <div className={styles.unlockRing} />

            {/* Actual content — always rendered, visibility controlled by CSS */}
            <div className={styles.inner}>
                {children}
            </div>
        </div>
    );
}
