"use client";
import { useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";
import NeuralCoreBrain from "./NeuralCoreBrain";
import StepStation from "./StepStation";
import styles from "./LightningJourney.module.css";

const LightningSpine = dynamic(() => import("./LightningSpine"), { ssr: false });

const STEPS = [
    { num: "01", title: "Sign Up", desc: "Create your account and pick a plan that fits. Takes about 60 seconds." },
    { num: "02", title: "Get AI Number", desc: "Choose a local phone number — AI is ready instantly. Forward your existing number or use a new one." },
    { num: "03", title: "Customize", desc: "Set your services, pricing, greeting, and tone. The AI learns your business in minutes." },
    { num: "04", title: "Go Live", desc: "AI starts answering calls and booking jobs. You get notified for every lead." },
];

export default function LightningJourney() {
    const containerRef = useRef(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [activeSteps, setActiveSteps] = useState([]);

    useEffect(() => {
        const handleScroll = () => {
            const container = containerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            // Calculate how far into the section we've scrolled
            const totalHeight = rect.height;
            const scrolledPast = windowHeight - rect.top;
            const progress = Math.max(0, Math.min(1, scrolledPast / totalHeight));
            setScrollProgress(progress);

            // Determine which steps are active
            const threshold = 1 / (STEPS.length + 1);
            const active = STEPS.reduce((acc, _, i) => {
                if (progress > threshold * (i + 1)) acc.push(i);
                return acc;
            }, []);
            setActiveSteps(active);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll(); // Initial check
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <section id="how-it-works" className={styles.journey} ref={containerRef}>
            <div className="container">
                <div className={`text-center ${styles.header}`}>
                    <span className={styles.sectionTag}>How It Works</span>
                    <h2>From <span className="text-gradient">Neural Core</span> to Live Calls</h2>
                    <p className={styles.sectionSub}>Watch the AI system boot up, connect, and start handling your business.</p>
                </div>
            </div>

            {/* Neural Brain Core */}
            <NeuralCoreBrain />

            {/* Steps + Spine */}
            <div className={styles.stepsContainer}>
                <div className="container">
                    <div className={styles.stepsInner}>
                        <LightningSpine progress={scrollProgress} stepsCount={STEPS.length} />
                        {STEPS.map((step, i) => (
                            <StepStation
                                key={i}
                                step={step}
                                index={i}
                                isActive={activeSteps.includes(i)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Completion burst after step 4 */}
            <div className={`${styles.completionBurst} ${activeSteps.length >= STEPS.length ? styles.burstActive : ""}`} />
        </section>
    );
}
