"use client";
import { useState, useEffect, useRef } from "react";
import styles from "./AIActivityFeed.module.css";

const EVENTS = [
    { icon: "📞", text: "Incoming call from Mike R...", color: "#00D2FF" },
    { icon: "🤖", text: "AI answering — qualifying lead...", color: "#A29BFE" },
    { icon: "✅", text: "Lead qualified — HVAC repair", color: "#00B894" },
    { icon: "📅", text: "Appointment booked for 2:30 PM", color: "#FDCB6E" },
    { icon: "💰", text: "Revenue updated: +$450", color: "#6C5CE7" },
];

export default function AIActivityFeed() {
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
            setCurrentIndex((prev) => (prev + 1) % EVENTS.length);
        }, 3000);
        return () => clearInterval(timer);
    }, [isVisible]);

    return (
        <div ref={containerRef} className={styles.feed}>
            <div className={styles.feedHeader}>
                <span className={styles.feedDot} />
                <span className={styles.feedLabel}>Live AI Activity</span>
            </div>
            <div className={styles.feedWindow}>
                {EVENTS.map((event, i) => (
                    <div
                        key={i}
                        className={`${styles.feedItem} ${i === currentIndex ? styles.active : ""} ${i < currentIndex || (currentIndex === 0 && i === EVENTS.length - 1 && i !== 0)
                                ? styles.past
                                : ""
                            }`}
                        style={{ "--accent": event.color }}
                    >
                        <span className={styles.feedIcon}>{event.icon}</span>
                        <span className={styles.feedText}>{event.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
