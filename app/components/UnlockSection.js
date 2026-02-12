"use client";
import {
    useRef, useState, useEffect, useCallback,
    createContext, useContext,
} from "react";
import styles from "./UnlockSection.module.css";

/* ═══════════════════════════════════════════════
   Neural De-blur Reveal System
   ─────────────────────────────────────────────
   Architecture:
   • SHARP layer  = the real content (children)
   • FROST overlay = position:absolute div with
     backdrop-filter:blur sitting ON TOP
   • CSS mask on the overlay hides it progressively
     as the user scrolls → revealing sharp content
   • The mask is driven by --reveal CSS variable (0→1)
   • Once fully revealed, overlay is unmounted from DOM
   ─────────────────────────────────────────────
   RULES:
   • NEVER apply filter/blur to the content container
   • NEVER apply filter to body/html/main
   • Navbar is never inside a reveal section
   ═══════════════════════════════════════════════ */

/* ── Context ─────────────────────────── */
const UnlockCtx = createContext({
    progress: 0,
    revealedSections: new Set(),
    registerReveal: () => { },
    total: 0,
});
export const useUnlockState = () => useContext(UnlockCtx);

/* ── Provider ────────────────────────── */
export function NeuralRevealProvider({ children, sectionIds = [] }) {
    const [progress, setProgress] = useState(0);
    const [revealedSections, setRevealedSections] = useState(new Set());

    /* Global scroll progress (0–1) */
    useEffect(() => {
        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const docH = document.documentElement.scrollHeight - window.innerHeight;
                const raw = docH > 0 ? window.scrollY / docH : 0;
                const clamped = Number.isFinite(raw)
                    ? Math.max(0, Math.min(1, raw))
                    : 0;
                setProgress(clamped);
                ticking = false;
            });
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const registerReveal = useCallback((id) => {
        setRevealedSections((prev) => {
            if (prev.has(id)) return prev;
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    }, []);

    return (
        <UnlockCtx.Provider
            value={{
                progress,
                revealedSections,
                registerReveal,
                total: sectionIds.length,
                unlocked: revealedSections, // compat alias
            }}
        >
            {children}
        </UnlockCtx.Provider>
    );
}

/* ── NeuralRevealSection ─────────────── */
export default function UnlockSection({ id, children, threshold = 0.12 }) {
    const ref = useRef(null);
    const { registerReveal } = useContext(UnlockCtx);
    const [settled, setSettled] = useState(false);

    useEffect(() => {
        /* prefers-reduced-motion: skip all blur, just fade in */
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (mq.matches) {
            setSettled(true);
            registerReveal(id);
            return;
        }

        const el = ref.current;
        if (!el) return;

        let ticking = false;

        const update = () => {
            const rect = el.getBoundingClientRect();
            const viewH = window.innerHeight;

            /* Reveal window:
               section top at 90% of viewport → start (progress 0)
               section top at 20% of viewport → done  (progress 1) */
            const startY = viewH * 0.9;
            const endY = viewH * 0.2;

            let p;
            if (rect.top >= startY) {
                p = 0;
            } else if (rect.top <= endY) {
                p = 1;
            } else {
                p = (startY - rect.top) / (startY - endY);
            }

            /* Also fully reveal if section is entirely above viewport
               (user loaded mid-page or scrolled past) */
            if (rect.bottom < 0) p = 1;

            const clamped = Number.isFinite(p) ? Math.max(0, Math.min(1, p)) : 0;

            /* Update CSS variable directly (no React re-render) */
            el.style.setProperty("--reveal", clamped.toFixed(3));

            /* Once fully revealed, unmount the overlay */
            if (clamped >= 1 && !settled) {
                setSettled(true);
                registerReveal(id);
            }

            ticking = false;
        };

        const onScroll = () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(update);
            }
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        /* Initial calc (handles mid-page load) */
        update();

        return () => window.removeEventListener("scroll", onScroll);
    }, [id, registerReveal, settled]);

    return (
        <div
            ref={ref}
            className={`${styles.section} ${settled ? styles.settled : ""}`}
            data-reveal-id={id}
            style={{ "--reveal": 0 }}
        >
            {/* Sharp content — always rendered, never blurred */}
            {children}

            {/* Frost overlay — masked away as --reveal goes 0→1
          Removed from DOM once settled for zero ongoing cost */}
            {!settled && (
                <div className={styles.frost} aria-hidden="true">
                    {/* Feathered glow at the reveal edge */}
                    <div className={styles.revealEdge} />
                </div>
            )}
        </div>
    );
}
