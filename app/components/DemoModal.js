"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./DemoModal.module.css";

const CALL_STEPS = [
    { type: "ring", text: "📞 Incoming Call — Sarah M.", delay: 0 },
    { type: "wave", text: "", delay: 1000 },
    { type: "ai", text: "Thanks for calling Rivera Plumbing! I'm the AI assistant. How can I help?", delay: 2000 },
    { type: "caller", text: "Hi, my kitchen sink is leaking pretty badly...", delay: 4500 },
    { type: "ai", text: "I'm sorry to hear that! I can get a licensed plumber out today. Does 3:00 PM work for you?", delay: 6500 },
    { type: "caller", text: "Yes, that's perfect!", delay: 8500 },
    { type: "confirm", text: "✅ Appointment Booked — Today 3:00 PM", delay: 9500 },
    { type: "notify", text: "📱 Owner notified • Lead scored: High", delay: 10500 },
];

const SMS_STEPS = [
    { type: "missed", text: "Missed call from (555) 234-7890", delay: 0 },
    { type: "ai-sms", text: "Hey! Sorry we missed your call. This is Rivera Plumbing's AI assistant. How can I help? 🔧", delay: 1500 },
    { type: "user-sms", text: "Hi! I need a quote for a bathroom remodel", delay: 3500 },
    { type: "ai-sms", text: "Great! I can schedule a free estimate. We have openings tomorrow at 9 AM or 2 PM. Which works?", delay: 5500 },
    { type: "user-sms", text: "2 PM works!", delay: 7500 },
    { type: "ai-sms", text: "Perfect! ✅ Booked for tomorrow at 2 PM. You'll get a confirmation text shortly!", delay: 8500 },
    { type: "confirm", text: "📅 Estimate Visit Scheduled — Tomorrow 2:00 PM", delay: 10000 },
];

export default function DemoModal({ isOpen, onClose }) {
    const [demoType, setDemoType] = useState(null);
    const [activeSteps, setActiveSteps] = useState([]);
    const [wavePhase, setWavePhase] = useState(0);
    const cycleRef = useRef(0);
    const modalRef = useRef(null);

    // Close on Escape
    useEffect(() => {
        const handleKey = (e) => { if (e.key === "Escape") onClose(); };
        if (isOpen) window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [isOpen, onClose]);

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            setDemoType(null);
            setActiveSteps([]);
            cycleRef.current++;
        }
    }, [isOpen]);

    // Wave animation for call demo
    useEffect(() => {
        if (demoType !== "call") return;
        let raf;
        const animate = () => { setWavePhase((p) => p + 0.06); raf = requestAnimationFrame(animate); };
        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [demoType]);

    // Demo steps animation loop
    useEffect(() => {
        if (!demoType) return;
        const steps = demoType === "call" ? CALL_STEPS : SMS_STEPS;
        const timers = [];
        const cycle = cycleRef.current;

        const run = () => {
            setActiveSteps([]);
            steps.forEach((step, i) => {
                const t = setTimeout(() => {
                    if (cycleRef.current !== cycle) return;
                    setActiveSteps((prev) => [...prev, i]);
                }, step.delay);
                timers.push(t);
            });
            // Loop
            const loopTimer = setTimeout(() => {
                if (cycleRef.current !== cycle) return;
                run();
            }, 12000);
            timers.push(loopTimer);
        };
        run();
        return () => { cycleRef.current++; timers.forEach(clearTimeout); };
    }, [demoType]);

    const waveHeights = Array.from({ length: 24 }, (_, i) =>
        Math.abs(Math.sin(wavePhase + i * 0.35)) * 18 + 3
    );

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div ref={modalRef} className={styles.modal} role="dialog" aria-modal="true" aria-label="AI Demo">
                <button className={styles.closeBtn} onClick={onClose} aria-label="Close demo">✕</button>

                {!demoType ? (
                    <div className={styles.chooser}>
                        <h3>Try a 10-Second Demo</h3>
                        <p className={styles.chooserSub}>See how HustleAI handles calls and texts</p>
                        <div className={styles.chooserBtns}>
                            <button onClick={() => setDemoType("call")} className={styles.chooserBtn}>
                                <span className={styles.chooserIcon}>📞</span>
                                <span>Call Demo</span>
                                <span className={styles.chooserHint}>AI answers a live call</span>
                            </button>
                            <button onClick={() => setDemoType("sms")} className={styles.chooserBtn}>
                                <span className={styles.chooserIcon}>💬</span>
                                <span>SMS Demo</span>
                                <span className={styles.chooserHint}>AI handles a text thread</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={styles.demoView}>
                        <div className={styles.demoHeader}>
                            <span className={styles.demoDot} />
                            <span>{demoType === "call" ? "Live Call Simulation" : "SMS Thread Simulation"}</span>
                        </div>

                        {/* Waveform for call only */}
                        {demoType === "call" && (
                            <div className={styles.waveform}>
                                {waveHeights.map((h, i) => (
                                    <div key={i} className={styles.waveBar} style={{ height: `${h}px`, opacity: 0.3 + (h / 21) * 0.7 }} />
                                ))}
                            </div>
                        )}

                        {/* Chat steps */}
                        <div className={styles.chatArea}>
                            {(demoType === "call" ? CALL_STEPS : SMS_STEPS).map((step, i) => (
                                step.text && (
                                    <div
                                        key={i}
                                        className={`${styles.bubble} ${styles[step.type]} ${activeSteps.includes(i) ? styles.visible : ""}`}
                                    >
                                        {step.text}
                                    </div>
                                )
                            ))}
                        </div>

                        <button onClick={() => setDemoType(null)} className={styles.backBtn}>← Try another demo</button>
                    </div>
                )}
            </div>
        </div>
    );
}
