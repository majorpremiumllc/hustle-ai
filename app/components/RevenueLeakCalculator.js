"use client";
import { useState } from "react";
import styles from "./RevenueLeakCalculator.module.css";

export default function RevenueLeakCalculator() {
    const [missedCalls, setMissedCalls] = useState(5);
    const [avgTicket, setAvgTicket] = useState(500);
    const [closeRate, setCloseRate] = useState(30);
    const [showResult, setShowResult] = useState(false);

    const monthlyLoss = Math.round(missedCalls * 22 * avgTicket * (closeRate / 100));

    const handleCalculate = () => {
        setShowResult(true);
        // Event tracking
        if (typeof window !== "undefined" && window.__hustleTrack) {
            window.__hustleTrack("calculator_submit", { missedCalls, avgTicket, closeRate, monthlyLoss });
        }
    };

    return (
        <section id="calculator" className={styles.section}>
            <div className={styles.container}>
                <div className={styles.left}>
                    <span className={styles.tag}>Revenue Leak Calculator</span>
                    <h2 className={styles.title}>
                        How Much Revenue Are You <span className={styles.gradient}>Losing Right Now?</span>
                    </h2>
                    <p className={styles.subtitle}>
                        Every missed call is a missed sale. Most service businesses lose $3,000–$15,000/month
                        to unanswered calls alone. Calculate your actual loss.
                    </p>
                </div>

                <div className={styles.calculator}>
                    <div className={styles.sliderGroup}>
                        <label className={styles.label}>
                            <span>Missed calls per day</span>
                            <strong className={styles.sliderValue}>{missedCalls}</strong>
                        </label>
                        <input
                            type="range" min="1" max="30" value={missedCalls}
                            onChange={(e) => { setMissedCalls(+e.target.value); setShowResult(false); }}
                            className={styles.slider}
                        />
                        <div className={styles.sliderRange}><span>1</span><span>30</span></div>
                    </div>

                    <div className={styles.sliderGroup}>
                        <label className={styles.label}>
                            <span>Average job ticket ($)</span>
                            <strong className={styles.sliderValue}>${avgTicket}</strong>
                        </label>
                        <input
                            type="range" min="100" max="5000" step="50" value={avgTicket}
                            onChange={(e) => { setAvgTicket(+e.target.value); setShowResult(false); }}
                            className={styles.slider}
                        />
                        <div className={styles.sliderRange}><span>$100</span><span>$5,000</span></div>
                    </div>

                    <div className={styles.sliderGroup}>
                        <label className={styles.label}>
                            <span>Close rate (%)</span>
                            <strong className={styles.sliderValue}>{closeRate}%</strong>
                        </label>
                        <input
                            type="range" min="5" max="80" value={closeRate}
                            onChange={(e) => { setCloseRate(+e.target.value); setShowResult(false); }}
                            className={styles.slider}
                        />
                        <div className={styles.sliderRange}><span>5%</span><span>80%</span></div>
                    </div>

                    {!showResult ? (
                        <button onClick={handleCalculate} className={styles.calcBtn}>
                            Calculate My Loss
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </button>
                    ) : (
                        <div className={styles.result}>
                            <div className={styles.resultLabel}>You're losing approximately</div>
                            <div className={styles.resultValue}>
                                ${monthlyLoss.toLocaleString()}<span>/month</span>
                            </div>
                            <div className={styles.resultSub}>
                                That's ${(monthlyLoss * 12).toLocaleString()}/year in revenue walking to your competitors.
                            </div>
                            <a href="/signup" className={styles.resultCta}>
                                Stop the Leak — Start Free Trial
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </a>
                            <div className={styles.resultNote}>
                                HustleAI costs less than 1 missed call. ROI in 3-7 days.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
