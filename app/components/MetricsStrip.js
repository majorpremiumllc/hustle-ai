"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./MetricsStrip.module.css";

function AnimatedNumber({ target, prefix = "", suffix = "", duration = 1800 }) {
    const [value, setValue] = useState(0);
    const ref = useRef(null);
    const started = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true;
                    const start = performance.now();
                    const animate = (now) => {
                        const progress = Math.min((now - start) / duration, 1);
                        const eased = 1 - Math.pow(1 - progress, 3);
                        setValue(Math.floor(eased * target));
                        if (progress < 1) requestAnimationFrame(animate);
                    };
                    requestAnimationFrame(animate);
                }
            },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target, duration]);

    return (
        <span ref={ref} className={styles.metricValue}>
            {prefix}{value.toLocaleString()}{suffix}
        </span>
    );
}

export default function MetricsStrip() {
    return (
        <section className={styles.strip}>
            <div className={styles.inner}>
                <div className={styles.metric}>
                    <AnimatedNumber target={3} prefix="< " suffix="s" />
                    <span className={styles.metricLabel}>Avg Response Time</span>
                </div>
                <div className={styles.divider} />
                <div className={styles.metric}>
                    <AnimatedNumber target={2847} suffix="+" />
                    <span className={styles.metricLabel}>Missed Calls Recovered</span>
                </div>
                <div className={styles.divider} />
                <div className={styles.metric}>
                    <AnimatedNumber target={2500} suffix="+" />
                    <span className={styles.metricLabel}>Businesses Onboarded</span>
                </div>
                <div className={styles.divider} />
                <div className={styles.metric}>
                    <span className={styles.metricValue}>99.9%</span>
                    <span className={styles.metricLabel}>Uptime Guaranteed</span>
                </div>
            </div>
        </section>
    );
}
