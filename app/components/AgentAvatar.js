"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import styles from "./AgentAvatar.module.css";

/* Avatar image paths mapped to agent IDs */
const AVATAR_IMAGES = {
    william: "/avatars/william.png",
    sophia: "/avatars/sophia.png",
    jack: "/avatars/jack.png",
    emma: "/avatars/emma.png",
    alex: "/avatars/alex.png",
};

/**
 * Animated Agent Avatar with:
 * - Photo avatars (Pixar-style 3D)
 * - Eyes follow mouse cursor
 * - Wave animation on click/greet
 * - Breathing glow ring
 */
export default function AgentAvatar({ agent, size = "md", greet = false }) {
    const [waving, setWaving] = useState(false);
    const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
    const avatarRef = useRef(null);

    /* Wave on greet */
    useEffect(() => {
        if (greet) {
            setWaving(true);
            const t = setTimeout(() => setWaving(false), 1600);
            return () => clearTimeout(t);
        }
    }, [greet]);

    /* Eye tracking — follow mouse */
    const handleMouseMove = useCallback((e) => {
        if (!avatarRef.current) return;
        const rect = avatarRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxShift = size === "sm" ? 2 : size === "lg" ? 5 : 3;
        const factor = Math.min(dist / 300, 1);
        setEyeOffset({
            x: (dx / (dist || 1)) * maxShift * factor,
            y: (dy / (dist || 1)) * maxShift * factor,
        });
    }, [size]);

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [handleMouseMove]);

    /* Click wave */
    const handleClick = () => {
        setWaving(true);
        setTimeout(() => setWaving(false), 1600);
    };

    const sizeClass = size === "sm" ? styles.sm : size === "lg" ? styles.lg : "";
    const imgSrc = AVATAR_IMAGES[agent.id];

    return (
        <div
            ref={avatarRef}
            className={`${styles.avatarWrap} ${sizeClass} ${waving ? styles.waving : ""}`}
            onClick={handleClick}
        >
            <div
                className={styles.glowRing}
                style={{ background: `linear-gradient(135deg, ${agent.gradient[0]}, ${agent.gradient[1]})` }}
            />
            <div
                className={styles.avatarCircle}
                style={{
                    transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
                    transition: "transform 0.15s ease-out",
                }}
            >
                {imgSrc ? (
                    <img
                        src={imgSrc}
                        alt={agent.name}
                        className={styles.avatarImg}
                        draggable={false}
                    />
                ) : (
                    <span className={styles.initials}>
                        {agent.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                    </span>
                )}
            </div>
            <span className={styles.statusDot} />
        </div>
    );
}
