"use client";
import { useState, useEffect, useRef } from "react";
import { SITE_CONFIG } from "../../lib/siteConfig";
import styles from "./RevenueCounter.module.css";

export default function RevenueCounter() {
    const cfg = SITE_CONFIG.revenue;
    const [amount, setAmount] = useState(cfg.baseAmount);
    const [hasAnimated, setHasAnimated] = useState(false);
    const [displayValue, setDisplayValue] = useState(0);
    const containerRef = useRef(null);

    // Initial count-up on first view
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    setHasAnimated(true);
                    const duration = 2000;
                    const start = performance.now();
                    const target = cfg.baseAmount;
                    const tick = (now) => {
                        const progress = Math.min((now - start) / duration, 1);
                        const eased = 1 - Math.pow(1 - progress, 4);
                        setDisplayValue(Math.floor(eased * target));
                        if (progress < 1) requestAnimationFrame(tick);
                    };
                    requestAnimationFrame(tick);
                }
            },
            { threshold: 0.4 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [hasAnimated, cfg.baseAmount]);

    // Slow incremental ticks
    useEffect(() => {
        if (!hasAnimated) return;
        const interval = setInterval(() => {
            const [min, max] = cfg.tickAmount;
            const tick = Math.floor(Math.random() * (max - min + 1)) + min;
            setAmount((prev) => prev + tick);
            setDisplayValue((prev) => prev + tick);
        }, cfg.tickInterval);
        return () => clearInterval(interval);
    }, [hasAnimated, cfg.tickAmount, cfg.tickInterval]);

    const formatted = "$" + displayValue.toLocaleString("en-US");

    return (
        <section ref={containerRef} className={styles.revenueSection}>
            <div className="container">
                <div className={`${styles.revenueCard} reveal-scale`}>
                    <div className={styles.revenueLabel}>HustleAI revenue recovered today</div>
                    <div className={styles.revenueAmount}>{formatted}</div>
                    <div className={styles.revenueSub}>
                        From missed calls &amp; follow-ups automated in real time.
                    </div>
                    <div className={styles.revenuePulse} />
                </div>
            </div>
        </section>
    );
}
