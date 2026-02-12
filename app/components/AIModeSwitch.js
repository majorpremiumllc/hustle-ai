"use client";
import { useState, useEffect, useCallback } from "react";
import styles from "./AIModeSwitch.module.css";

/**
 * AIModeSwitch — Stealth/Boost toggle.
 * Dispatches a custom event "aiModeChange" for other components to react to.
 * Persists choice in localStorage.
 */
export default function AIModeSwitch() {
    const [mode, setMode] = useState("boost");

    useEffect(() => {
        const saved = localStorage.getItem("hustleai-mode");
        if (saved === "stealth" || saved === "boost") {
            setMode(saved);
            window.dispatchEvent(new CustomEvent("aiModeChange", { detail: saved }));
        }
    }, []);

    const toggle = useCallback(() => {
        const next = mode === "boost" ? "stealth" : "boost";
        setMode(next);
        localStorage.setItem("hustleai-mode", next);
        window.dispatchEvent(new CustomEvent("aiModeChange", { detail: next }));
    }, [mode]);

    return (
        <button
            className={`${styles.modeSwitch} ${mode === "boost" ? styles.boost : styles.stealth}`}
            onClick={toggle}
            aria-label={`AI Mode: ${mode}. Click to switch.`}
            title={`AI Mode: ${mode === "boost" ? "Boost" : "Stealth"}`}
        >
            <span className={styles.modeDot} />
            <span className={styles.modeLabel}>
                {mode === "boost" ? "Boost" : "Stealth"}
            </span>
        </button>
    );
}
