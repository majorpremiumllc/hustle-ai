"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./VoiceDemo.module.css";

const DEMO_STEPS = [
    { type: "incoming", text: "📞 Incoming Call — Mike Rodriguez", delay: 0 },
    { type: "status", text: "AI Answering...", delay: 1500 },
    { type: "ai", text: "Thanks for calling Rodriguez Plumbing! How can I help you today?", delay: 3000 },
    { type: "caller", text: "Hi, I have a leaking pipe in my kitchen...", delay: 5000 },
    { type: "ai", text: "I can get a technician to you today. How does 2:30 PM work?", delay: 6500 },
    { type: "notification", text: "✅ Appointment Confirmed — 2:30 PM", delay: 8000 },
];

const LOOP_DURATION = 10000;

export default function VoiceDemo() {
    const [activeSteps, setActiveSteps] = useState([]);
    const [wavePhase, setWavePhase] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef(null);
    const cycleRef = useRef(0);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0.2 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Wave animation
    useEffect(() => {
        if (!isVisible) return;
        let raf;
        const animate = () => {
            setWavePhase((p) => p + 0.08);
            raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [isVisible]);

    // Demo loop
    useEffect(() => {
        if (!isVisible) return;
        const timers = [];

        const runCycle = () => {
            const cycle = cycleRef.current;
            setActiveSteps([]);

            DEMO_STEPS.forEach((step, i) => {
                const t = setTimeout(() => {
                    if (cycleRef.current !== cycle) return;
                    setActiveSteps((prev) => [...prev, i]);
                }, step.delay);
                timers.push(t);
            });

            const resetTimer = setTimeout(() => {
                cycleRef.current++;
                runCycle();
            }, LOOP_DURATION);
            timers.push(resetTimer);
        };

        runCycle();
        return () => {
            cycleRef.current++;
            timers.forEach(clearTimeout);
        };
    }, [isVisible]);

    const waveHeights = Array.from({ length: 32 }, (_, i) =>
        Math.abs(Math.sin(wavePhase + i * 0.3)) * 20 + 3
    );

    return (
        <section ref={containerRef} className={styles.demoSection}>
            <div className="container">
                <div className="text-center reveal">
                    <span className={styles.sectionTag}>See AI in Action</span>
                    <h2>Watch Your AI <span className="text-gradient">Handle a Real Call</span></h2>
                    <p className={styles.sectionSub}>Every call is answered, every lead is captured — automatically.</p>
                </div>

                <div className={`${styles.demoCard} reveal-scale`}>
                    {/* Voice waveform */}
                    <div className={styles.waveform}>
                        {waveHeights.map((h, i) => (
                            <div
                                key={i}
                                className={styles.waveBar}
                                style={{ height: `${h}px`, opacity: 0.3 + (h / 23) * 0.7 }}
                            />
                        ))}
                    </div>

                    {/* Chat simulation */}
                    <div className={styles.chatArea}>
                        {DEMO_STEPS.map((step, i) => (
                            <div
                                key={i}
                                className={`${styles.chatBubble} ${styles[step.type]} ${activeSteps.includes(i) ? styles.visible : ""
                                    }`}
                            >
                                {step.text}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
