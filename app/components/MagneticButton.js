"use client";
import { useRef, useCallback } from "react";
import styles from "./MagneticButton.module.css";

export default function MagneticButton({ children, className = "", href, onClick, ...props }) {
    const buttonRef = useRef(null);

    const handleMove = useCallback((e) => {
        const btn = buttonRef.current;
        if (!btn || window.innerWidth < 768) return;
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    }, []);

    const handleLeave = useCallback(() => {
        const btn = buttonRef.current;
        if (btn) btn.style.transform = "";
    }, []);

    const handleClick = useCallback((e) => {
        const btn = buttonRef.current;
        if (!btn) return;

        // Ripple effect
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement("span");
        ripple.className = styles.ripple;
        ripple.style.left = `${e.clientX - rect.left}px`;
        ripple.style.top = `${e.clientY - rect.top}px`;
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);

        if (onClick) onClick(e);
    }, [onClick]);

    const Tag = href ? "a" : "button";

    return (
        <Tag
            ref={buttonRef}
            className={`${styles.magnetic} ${className}`}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            onClick={handleClick}
            href={href}
            {...props}
        >
            {children}
        </Tag>
    );
}
