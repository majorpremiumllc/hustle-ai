"use client";
import {
    createContext, useContext, useState, useCallback,
    useEffect, useRef,
} from "react";

/* ═══════════════════════════════════════════════
   Tour State Manager — Centralized tour context
   ─────────────────────────────────────────────
   Manages: state machine, step navigation,
   auto-scroll, scroll locking, element validation.
   ═══════════════════════════════════════════════ */

/* ── Tour Step Definitions ────────────── */
const TOUR_STEPS = [
    {
        id: "features",
        selector: "#features",
        title: "Core Features",
        audio: "/audio/tour-features.mp3",
        transcript: "Here are our core features — instant call answering, smart lead capture, and automated appointment booking. HustleAI handles everything so you never miss a customer.",
    },
    {
        id: "industries",
        selector: "#industries",
        title: "Industries We Serve",
        audio: "/audio/tour-industries.mp3",
        transcript: "We support 25+ industries — plumbers, hair salons, electricians, landscapers, restaurants and more. Each module is tailored to your specific business type.",
    },
    {
        id: "loss",
        selector: "#loss",
        title: "Revenue You're Losing",
        audio: "/audio/tour-loss.mp3",
        transcript: "This section shows how much revenue you lose from missed calls. Most businesses miss 60% of inbound calls — that's thousands in lost revenue every month.",
    },
    {
        id: "calculator",
        selector: "#calculator",
        title: "Revenue Calculator",
        audio: "/audio/tour-calculator.mp3",
        transcript: "Try our revenue calculator — enter your numbers and see exactly how much HustleAI can recover for your business. Real projections based on real data.",
    },
    {
        id: "pricing",
        selector: "#pricing",
        title: "Plans & Pricing",
        audio: "/audio/tour-pricing.mp3",
        transcript: "Check out our plans — starting at just $49 per month with a 3-day free trial. No credit card required, set up in under 5 minutes.",
    },
];

/* ── Context ────────────────────────────── */
const TourCtx = createContext(null);
export const useTour = () => useContext(TourCtx);
export { TOUR_STEPS };

/* ── Provider ───────────────────────────── */
export default function TourProvider({ children }) {
    /* State machine: idle → touring → done → idle */
    const [tourState, setTourState] = useState("idle");
    const [currentStep, setCurrentStep] = useState(-1);
    const [targetRect, setTargetRect] = useState(null);
    const [pulseActive, setPulseActive] = useState(false);
    const [sectionRevealed, setSectionRevealed] = useState(false);

    const mountedRef = useRef(true);
    const scrollLockedRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    /* ── Scroll Lock ──────────────────────
       Use event listeners instead of overflow:hidden
       so programmatic scrollIntoView still works.     */
    const preventScroll = useCallback((e) => {
        e.preventDefault();
    }, []);

    const preventKeys = useCallback((e) => {
        const keys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];
        if (keys.includes(e.key)) e.preventDefault();
    }, []);

    const lockScroll = useCallback(() => {
        if (scrollLockedRef.current) return;
        scrollLockedRef.current = true;
        window.addEventListener("wheel", preventScroll, { passive: false });
        window.addEventListener("touchmove", preventScroll, { passive: false });
        window.addEventListener("keydown", preventKeys, { passive: false });
    }, [preventScroll, preventKeys]);

    const unlockScroll = useCallback(() => {
        if (!scrollLockedRef.current) return;
        scrollLockedRef.current = false;
        window.removeEventListener("wheel", preventScroll);
        window.removeEventListener("touchmove", preventScroll);
        window.removeEventListener("keydown", preventKeys);
    }, [preventScroll, preventKeys]);

    /* ── Validate & scroll to element ───── */
    const scrollToSection = useCallback((selector) => {
        return new Promise((resolve) => {
            let el = document.querySelector(selector);
            /* Fallback: try data-reveal-id */
            if (!el) {
                const fallbackId = selector.replace("#", "");
                el = document.querySelector(`[data-reveal-id="${fallbackId}"]`);
            }

            if (!el) {
                console.warn(`[Tour] Section not found: ${selector}`);
                resolve(null);
                return;
            }

            /* Calculate absolute target Y so element is centered in viewport */
            const rect = el.getBoundingClientRect();
            const absoluteTop = rect.top + window.scrollY;
            const viewportH = window.innerHeight;
            const elH = Math.min(rect.height, 600);
            const targetY = Math.max(0, absoluteTop - (viewportH - elH) / 2);

            console.log(`[Tour] Scrolling to ${selector}: targetY=${targetY}, current scrollY=${window.scrollY}`);

            /* CRITICAL: CSS `scroll-behavior: smooth` on <html> overrides
               even instant scrollTo calls. Temporarily disable it. */
            const htmlEl = document.documentElement;
            const prevBehavior = htmlEl.style.scrollBehavior;
            htmlEl.style.scrollBehavior = "auto";

            window.scrollTo({ top: targetY, behavior: "instant" });

            /* Restore after a tick */
            requestAnimationFrame(() => {
                htmlEl.style.scrollBehavior = prevBehavior;
            });

            /* Wait for reflow + trigger UnlockSection's scroll listener, then get rect */
            const settle = setTimeout(() => {
                if (!mountedRef.current) { resolve(null); return; }

                console.log(`[Tour] After scroll: scrollY=${window.scrollY}, target was ${targetY}`);

                const freshRect = el.getBoundingClientRect();
                resolve({
                    x: freshRect.left,
                    y: freshRect.top,
                    w: freshRect.width,
                    h: Math.min(freshRect.height, 600), /* cap visible area */
                    centerX: freshRect.left + freshRect.width / 2,
                    centerY: freshRect.top + Math.min(freshRect.height, 600) / 2,
                });
            }, 200); /* Quick settle — scroll is instant */

            return () => clearTimeout(settle);
        });
    }, []);

    /* ── Start Tour ─────────────────────── */
    const startTour = useCallback(() => {
        setTourState("touring");
        setCurrentStep(0);
        lockScroll();
    }, [lockScroll]);

    /* ── Navigate to Step (called by effect) */
    const navigateToStep = useCallback(async (stepIndex) => {
        if (stepIndex < 0 || stepIndex >= TOUR_STEPS.length) return;
        const step = TOUR_STEPS[stepIndex];

        setSectionRevealed(false);
        setPulseActive(false);
        setTargetRect(null);

        const rect = await scrollToSection(step.selector);
        if (!mountedRef.current) return;

        if (rect) {
            setTargetRect(rect);
            /* Fire pulse projectile */
            setPulseActive(true);
        } else {
            /* Fallback: skip animation, reveal immediately */
            setSectionRevealed(true);
        }
    }, [scrollToSection]);

    /* ── Pulse completed → reveal section ── */
    const onPulseComplete = useCallback(() => {
        setPulseActive(false);
        setSectionRevealed(true);
    }, []);

    /* ── Next Step ──────────────────────── */
    const nextStep = useCallback(() => {
        if (currentStep + 1 >= TOUR_STEPS.length) {
            setTourState("done");
            unlockScroll();
            /* Auto-dismiss after 2s */
            setTimeout(() => {
                if (!mountedRef.current) return;
                setTourState("idle");
                setCurrentStep(-1);
                setTargetRect(null);
                setPulseActive(false);
                setSectionRevealed(false);
            }, 1200);
        } else {
            setCurrentStep(s => s + 1);
        }
    }, [currentStep, unlockScroll]);

    /* ── Prev Step ──────────────────────── */
    const prevStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(s => s - 1);
        }
    }, [currentStep]);

    /* ── End Tour ───────────────────────── */
    const endTour = useCallback(() => {
        setTourState("idle");
        setCurrentStep(-1);
        setTargetRect(null);
        setPulseActive(false);
        setSectionRevealed(false);
        unlockScroll();
    }, [unlockScroll]);

    /* ── Auto-navigate when step changes ── */
    useEffect(() => {
        if (tourState !== "touring" || currentStep < 0) return;
        navigateToStep(currentStep);
    }, [tourState, currentStep, navigateToStep]);

    /* ── Cleanup on unmount ─────────────── */
    useEffect(() => {
        return () => { unlockScroll(); };
    }, [unlockScroll]);

    const value = {
        tourState,
        setTourState,
        currentStep,
        totalSteps: TOUR_STEPS.length,
        currentStepData: TOUR_STEPS[currentStep] || null,
        targetRect,
        pulseActive,
        sectionRevealed,
        startTour,
        nextStep,
        prevStep,
        endTour,
        onPulseComplete,
    };

    return (
        <TourCtx.Provider value={value}>
            {children}
        </TourCtx.Provider>
    );
}
