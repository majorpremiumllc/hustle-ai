"use client";
import { useState, useEffect } from "react";
import styles from "./StickyTrialCTA.module.css";

export default function StickyTrialCTA() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setVisible(window.scrollY > 800);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className={`${styles.sticky} ${visible ? styles.visible : ""}`}>
            <div className={styles.inner}>
                <div className={styles.text}>
                    <strong>Ready to stop losing revenue?</strong>
                    <span>3-day free trial · No credit card</span>
                </div>
                <a href="/signup" className={styles.btn}>
                    Start Free Trial
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </a>
            </div>
        </div>
    );
}
