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
                const raw = docH > 0 ? window.scrollY / docH : 0;
                // Fail-safe: clamp to [0, 1], protect against NaN
                const clamped = Number.isFinite(raw) ? Math.max(0, Math.min(1, raw)) : 0;
                setProgress(clamped);
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

/* ── UnlockSection ───────────────────── 
   IMPORTANT: This component uses an OVERLAY div (position:absolute)
   to create the locked/dimmed effect. It NEVER applies filter:blur
   or opacity to the section container itself. This ensures:
   1) No stacking context contamination to parent/sibling elements
   2) No compounding with other CSS blur (like .reveal classes)
   3) Navbar and other fixed elements are never affected
   ──────────────────────────────────── */
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
            className={styles.wrap}
            data-unlock-id={id}
            data-phase={phase}
        >
            {/* Lock overlay — position:absolute, scoped to this container ONLY.
          This is the ONLY element that dims/blurs. It sits ON TOP of content
          and is removed when settled. It never affects parent elements. */}
            {phase !== "settled" && (
                <div
                    className={`${styles.lockOverlay} ${styles["ov_" + phase]}`}
                    aria-hidden="true"
                />
            )}

            {/* Wireframe grid (building phase only) */}
            {phase === "building" && (
                <div className={styles.gridOverlay} aria-hidden="true">
                    <div className={styles.hLine} style={{ top: "20%" }} />
                    <div className={styles.hLine} style={{ top: "45%" }} />
                    <div className={styles.hLine} style={{ top: "70%" }} />
                    <div className={styles.vLine} style={{ left: "30%" }} />
                    <div className={styles.vLine} style={{ left: "60%" }} />
                </div>
            )}

            {/* Actual content — NO filter/blur/opacity applied to this element */}
            {children}
        </div>
    );
}
