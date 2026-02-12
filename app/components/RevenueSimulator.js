"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./RevenueSimulator.module.css";

function useDebounce(value, delay) {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return debounced;
}

function AnimatedNumber({ value, prefix = "", duration = 800 }) {
    const [display, setDisplay] = useState(0);
    const ref = useRef(null);

    useEffect(() => {
        const start = display;
        const diff = value - start;
        if (diff === 0) return;
        const startTime = performance.now();
        const tick = (now) => {
            const p = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.round(start + diff * eased));
            if (p < 1) ref.current = requestAnimationFrame(tick);
        };
        ref.current = requestAnimationFrame(tick);
        return () => { if (ref.current) cancelAnimationFrame(ref.current); };
    }, [value, duration]);

    return <>{prefix}{display.toLocaleString()}</>;
}

export default function RevenueSimulator() {
    const sectionRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [jobs, setJobs] = useState(40);
    const [jobValue, setJobValue] = useState(350);
    const [missedRate, setMissedRate] = useState(20);
    const [analyzing, setAnalyzing] = useState(false);

    const debouncedJobs = useDebounce(jobs, 200);
    const debouncedValue = useDebounce(jobValue, 200);
    const debouncedRate = useDebounce(missedRate, 100);

    const monthlyRevenue = debouncedJobs * debouncedValue;
    const monthlyLoss = Math.round(monthlyRevenue * (debouncedRate / 100));
    const annualLoss = monthlyLoss * 12;
    const recoverable = Math.round(annualLoss * 0.8);

    // "AI analyzing..." flash on input change
    const prevLoss = useRef(monthlyLoss);
    useEffect(() => {
        if (monthlyLoss !== prevLoss.current) {
            setAnalyzing(true);
            const t = setTimeout(() => setAnalyzing(false), 400);
            prevLoss.current = monthlyLoss;
            return () => clearTimeout(t);
        }
    }, [monthlyLoss]);

    // Visibility observer
    useEffect(() => {
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) setIsVisible(true); },
            { threshold: 0.15 }
        );
        if (sectionRef.current) obs.observe(sectionRef.current);
        return () => obs.disconnect();
    }, []);

    // Glow intensity based on loss amount
    const glowIntensity = Math.min(annualLoss / 100000, 1);

    return (
        <section ref={sectionRef} className={`${styles.section} ${isVisible ? styles.visible : ""}`}>
            <div className={`container ${styles.inner}`}>

                {/* Left: Inputs */}
                <div className={styles.inputCol}>
                    <div className={styles.sectionTag}>Revenue Calculator</div>
                    <h2 className={styles.heading}>
                        How Much Revenue Are You <span className={styles.lossGrad}>Losing Right Now?</span>
                    </h2>
                    <p className={styles.subtitle}>
                        Most service businesses lose 15–35% of inbound revenue from missed calls and slow responses.
                    </p>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label}>
                            Average Jobs Per Month
                            <div className={styles.inputWrap}>
                                <input
                                    type="number"
                                    min="1"
                                    max="500"
                                    value={jobs}
                                    onChange={(e) => setJobs(Math.max(1, parseInt(e.target.value) || 1))}
                                    className={styles.numberInput}
                                />
                                <span className={styles.inputUnit}>jobs</span>
                            </div>
                        </label>

                        <label className={styles.label}>
                            Average Job Value
                            <div className={styles.inputWrap}>
                                <span className={styles.inputPrefix}>$</span>
                                <input
                                    type="number"
                                    min="10"
                                    max="50000"
                                    value={jobValue}
                                    onChange={(e) => setJobValue(Math.max(10, parseInt(e.target.value) || 10))}
                                    className={styles.numberInput}
                                    style={{ paddingLeft: "28px" }}
                                />
                            </div>
                        </label>

                        <label className={styles.label}>
                            Missed Call Rate
                            <div className={styles.sliderRow}>
                                <input
                                    type="range"
                                    min="5"
                                    max="40"
                                    value={missedRate}
                                    onChange={(e) => setMissedRate(parseInt(e.target.value))}
                                    className={styles.slider}
                                    style={{ "--slider-pct": `${((missedRate - 5) / 35) * 100}%` }}
                                />
                                <div
                                    className={styles.sliderBubble}
                                    style={{ left: `calc(${((missedRate - 5) / 35) * 100}% - 18px)` }}
                                >
                                    {missedRate}%
                                </div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Right: Results */}
                <div className={styles.resultsCol}>
                    <div className={styles.resultsPanel} style={{
                        "--glow-opacity": glowIntensity * 0.12,
                    }}>
                        <div className={styles.resultsPulse} />

                        {/* Analyzing shimmer */}
                        <div className={`${styles.analyzingBar} ${analyzing ? styles.analyzingActive : ""}`}>
                            <span>AI analyzing…</span>
                        </div>

                        <div className={styles.resultBlock}>
                            <div className={styles.resultLabel}>Estimated Monthly Revenue Lost</div>
                            <div className={styles.resultValue}>
                                <AnimatedNumber value={monthlyLoss} prefix="$" />
                            </div>
                        </div>

                        <div className={styles.resultDivider} />

                        <div className={styles.resultBlock}>
                            <div className={styles.resultLabel}>Estimated Annual Revenue Lost</div>
                            <div className={`${styles.resultValue} ${styles.resultBig}`}>
                                <AnimatedNumber value={annualLoss} prefix="$" />
                            </div>
                        </div>

                        <p className={styles.resultMicro}>
                            This is revenue currently going to competitors.
                        </p>

                        <div className={styles.recoveryLine}>
                            <span className={styles.recoveryIcon}>⚡</span>
                            <span>With HustleAI → Up to <strong>${recoverable.toLocaleString()}</strong> recovered annually.</span>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className={styles.ctaRow}>
                        <a href="/signup" className="btn btn-accent btn-lg">Stop Losing Revenue</a>
                        <a href="/signup" className="btn btn-secondary">Start Free Trial</a>
                    </div>
                    <div className={styles.ctaMicro}>Go live in minutes. No sales calls required.</div>
                </div>
            </div>
        </section>
    );
}
