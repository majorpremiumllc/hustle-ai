"use client";
import { useState, useEffect, useRef } from "react";
import { SITE_CONFIG } from "../../lib/siteConfig";
import styles from "./RevenueCounter.module.css";

/* ═══════════════════════════════════════════════
   Revenue Mission Control — Cinematic Sales Hook
   ─────────────────────────────────────────────
   3-stat live dashboard strip with neural 
   connection lines and dramatic count-up.
   ═══════════════════════════════════════════════ */

const STATS = [
    { label: "Calls Answered Today", prefix: "", suffix: "", baseValue: 12847, tick: [3, 12], interval: 2800 },
    { label: "Revenue Recovered", prefix: "$", suffix: "", baseValue: 2437650, tick: [45, 320], interval: 3200 },
    { label: "Avg Response Time", prefix: "", suffix: "s", baseValue: 1.2, tick: null, interval: null },
];

function animateValue(from, to, duration, callback) {
    const start = performance.now();
    const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        callback(from + (to - from) * eased);
        if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

function formatNumber(value, prefix = "", suffix = "") {
    if (suffix === "s") return `${prefix}${value.toFixed(1)}${suffix}`;
    return `${prefix}${Math.floor(value).toLocaleString("en-US")}${suffix}`;
}

export default function RevenueCounter() {
    const containerRef = useRef(null);
    const [hasAnimated, setHasAnimated] = useState(false);
    const [values, setValues] = useState(STATS.map(() => 0));
    const valuesRef = useRef(STATS.map((s) => s.baseValue));

    /* Count-up on first view */
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    setHasAnimated(true);
                    STATS.forEach((stat, i) => {
                        const delay = i * 200;
                        setTimeout(() => {
                            animateValue(0, stat.baseValue, 2200, (v) => {
                                setValues((prev) => {
                                    const next = [...prev];
                                    next[i] = v;
                                    return next;
                                });
                            });
                        }, delay);
                    });
                }
            },
            { threshold: 0.3 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [hasAnimated]);

    /* Live ticking for stats that tick */
    useEffect(() => {
        if (!hasAnimated) return;
        const intervals = STATS.map((stat, i) => {
            if (!stat.tick) return null;
            return setInterval(() => {
                const [min, max] = stat.tick;
                const delta = Math.floor(Math.random() * (max - min + 1)) + min;
                valuesRef.current[i] += delta;
                setValues((prev) => {
                    const next = [...prev];
                    next[i] = valuesRef.current[i];
                    return next;
                });
            }, stat.interval);
        });
        return () => intervals.forEach((id) => id && clearInterval(id));
    }, [hasAnimated]);

    return (
        <section ref={containerRef} className={styles.section}>
            <div className="container">
                <div className={styles.strip}>
                    {/* Neural connection SVG behind */}
                    <svg className={styles.neuralBg} viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <line x1="200" y1="60" x2="500" y2="60" stroke="rgba(0,210,255,0.08)" strokeWidth="1" strokeDasharray="6 4" />
                        <line x1="700" y1="60" x2="1000" y2="60" stroke="rgba(108,92,231,0.08)" strokeWidth="1" strokeDasharray="6 4" />
                        {/* Traveling pulse dots */}
                        <circle r="3" fill="#00D2FF" opacity="0">
                            <animateMotion dur="3s" repeatCount="indefinite" path="M 200,60 L 500,60" />
                            <animate attributeName="opacity" values="0;0.6;0" dur="3s" repeatCount="indefinite" />
                        </circle>
                        <circle r="3" fill="#6C5CE7" opacity="0">
                            <animateMotion dur="3.5s" repeatCount="indefinite" path="M 700,60 L 1000,60" begin="0.5s" />
                            <animate attributeName="opacity" values="0;0.6;0" dur="3.5s" repeatCount="indefinite" begin="0.5s" />
                        </circle>
                        {/* Neural nodes at intersections */}
                        {[200, 500, 700, 1000].map((cx, i) => (
                            <g key={i}>
                                <circle cx={cx} cy="60" r="4" fill="rgba(0,210,255,0.15)">
                                    <animate attributeName="r" values="3;5;3" dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
                                </circle>
                                <circle cx={cx} cy="60" r="2" fill="rgba(0,210,255,0.4)">
                                    <animate attributeName="opacity" values="0.3;0.8;0.3" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
                                </circle>
                            </g>
                        ))}
                    </svg>

                    {/* Stat cards */}
                    {STATS.map((stat, i) => (
                        <div key={i} className={`${styles.statCard} ${hasAnimated ? styles.visible : ""}`}
                            style={{ transitionDelay: `${i * 0.15}s` }}
                        >
                            <div className={styles.statLabel}>
                                <span className={styles.statDot} />
                                {stat.label}
                            </div>
                            <div className={styles.statValue}>
                                {formatNumber(values[i], stat.prefix, stat.suffix)}
                            </div>
                        </div>
                    ))}

                    {/* Scan line */}
                    <div className={styles.scanLine} />
                </div>
            </div>
        </section>
    );
}
