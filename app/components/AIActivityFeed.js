"use client";
import { useState, useEffect, useRef } from "react";
import { SITE_CONFIG } from "../../lib/siteConfig";
import styles from "./AIActivityFeed.module.css";

export default function AIActivityFeed() {
    const events = SITE_CONFIG.activityEvents;
    const loopDuration = SITE_CONFIG.activityLoopDuration;
    const eventInterval = loopDuration / events.length;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsVisible(entry.isIntersecting),
            { threshold: 0.3 }
        );
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % events.length);
        }, eventInterval);
        return () => clearInterval(timer);
    }, [isVisible, events.length, eventInterval]);

    return (
        <div ref={containerRef} className={styles.feed}>
            <div className={styles.feedHeader}>
                <span className={styles.feedDot} />
                <span className={styles.feedLabel}>Live AI Activity</span>
            </div>
            <div className={styles.feedWindow}>
                {events.map((event, i) => {
                    const isCurrent = i === currentIndex;
                    const isPast = (currentIndex > 0 && i < currentIndex) ||
                        (currentIndex === 0 && i === events.length - 1);
                    return (
                        <div
                            key={i}
                            className={`${styles.feedItem} ${isCurrent ? styles.active : ""} ${isPast ? styles.past : ""}`}
                            style={{ "--accent": event.color }}
                        >
                            <span className={styles.feedIcon}>{event.icon}</span>
                            <span className={styles.feedText}>{event.text}</span>
                            <span className={styles.feedTime}>just now</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
