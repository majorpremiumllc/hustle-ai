"use client";
import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import styles from "./StepStation.module.css";

/**
 * StepStation — A single "station" on the Lightning Journey.
 * Features a glowing node on the spine and an animated card.
 */

/* Mini animated mocks inside each step card */
const SignupMock = () => (
    <div className={styles.miniMock}>
        <div className={styles.mockField}>
            <div className={styles.mockLabel}>Email</div>
            <div className={styles.mockInput}>
                <span className={styles.mockCaret} />
            </div>
        </div>
        <div className={styles.mockField}>
            <div className={styles.mockLabel}>Password</div>
            <div className={styles.mockInput} />
        </div>
        <div className={styles.mockBtn}>Create Account</div>
    </div>
);

const PhoneMock = () => (
    <div className={styles.miniMock}>
        <div className={styles.mockPhoneList}>
            <div className={styles.mockPhone}>(555) 123-4567</div>
            <div className={`${styles.mockPhone} ${styles.mockPhoneActive}`}>(555) 987-6543 <span className={styles.pulseChip}>✓</span></div>
            <div className={styles.mockPhone}>(555) 321-0987</div>
        </div>
    </div>
);

const SettingsMock = () => (
    <div className={styles.miniMock}>
        <div className={styles.mockToggleRow}>
            <span>Greeting</span>
            <div className={`${styles.mockToggle} ${styles.on}`}><div className={styles.mockToggleKnob} /></div>
        </div>
        <div className={styles.mockToggleRow}>
            <span>Services</span>
            <div className={`${styles.mockToggle} ${styles.on}`}><div className={styles.mockToggleKnob} /></div>
        </div>
        <div className={styles.mockToggleRow}>
            <span>Friendly Tone</span>
            <div className={`${styles.mockToggle} ${styles.on}`}><div className={styles.mockToggleKnob} /></div>
        </div>
    </div>
);

const LiveMock = () => (
    <div className={styles.miniMock}>
        <div className={styles.mockLiveCall}>
            <div className={styles.mockWaveRow}>
                {[...Array(12)].map((_, i) => (
                    <div key={i} className={styles.mockWaveBar} style={{
                        animationDelay: `${i * 0.1}s`,
                        height: `${8 + Math.sin(i * 0.8) * 8}px`
                    }} />
                ))}
            </div>
            <div className={styles.mockCallLabel}>AI Answering Call...</div>
        </div>
        <div className={styles.mockConfirm}>✅ Appointment Booked</div>
    </div>
);

const MOCKS = [<SignupMock key="s" />, <PhoneMock key="p" />, <SettingsMock key="set" />, <LiveMock key="l" />];

export default function StepStation({ step, index, isActive }) {
    const cardRef = useRef(null);
    const isInView = useInView(cardRef, { once: true, margin: "0px 0px -80px 0px" });
    const isRight = index % 2 === 0; // Alternate sides on desktop

    return (
        <div className={`${styles.station} ${isActive ? styles.active : ""}`} ref={cardRef}>
            {/* Node */}
            <div className={`${styles.node} ${isActive ? styles.nodeActive : ""}`}>
                <div className={styles.nodeRing} />
                <span className={styles.nodeNum}>{step.num}</span>
            </div>

            {/* Card */}
            <motion.div
                className={`${styles.card} ${isRight ? styles.cardRight : styles.cardLeft}`}
                initial={{ opacity: 0, x: isRight ? 30 : -30, filter: "blur(8px)" }}
                animate={isInView ? { opacity: 1, x: 0, filter: "blur(0px)" } : {}}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className={styles.cardTitle}>{step.title}</div>
                <p className={styles.cardDesc}>{step.desc}</p>
                {MOCKS[index]}
            </motion.div>
        </div>
    );
}
