"use client";
import { useEffect, useRef } from "react";
import styles from "./CustomCursor.module.css";

export default function CustomCursor() {
    const dotRef = useRef(null);
    const trailRef = useRef(null);
    const pos = useRef({ x: -100, y: -100 });
    const trailPos = useRef({ x: -100, y: -100 });
    const visible = useRef(false);
    const hovering = useRef(false);

    useEffect(() => {
        if (window.innerWidth < 768 || "ontouchstart" in window) return;

        const dot = dotRef.current;
        const trail = trailRef.current;
        if (!dot || !trail) return;

        const move = (e) => {
            pos.current = { x: e.clientX, y: e.clientY };
            if (!visible.current) {
                visible.current = true;
                dot.style.opacity = "1";
                trail.style.opacity = "1";
            }
        };

        const leave = () => {
            visible.current = false;
            dot.style.opacity = "0";
            trail.style.opacity = "0";
        };

        const checkHover = (e) => {
            const target = e.target;
            const isInteractive =
                target.closest("a, button, [role='button'], input, textarea, select, .btn");
            if (isInteractive && !hovering.current) {
                hovering.current = true;
                dot.classList.add(styles.expanded);
                trail.classList.add(styles.expanded);
            } else if (!isInteractive && hovering.current) {
                hovering.current = false;
                dot.classList.remove(styles.expanded);
                trail.classList.remove(styles.expanded);
            }
        };

        let raf;
        const animate = () => {
            // Smooth trail follow
            trailPos.current.x += (pos.current.x - trailPos.current.x) * 0.15;
            trailPos.current.y += (pos.current.y - trailPos.current.y) * 0.15;

            dot.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%)`;
            trail.style.transform = `translate(${trailPos.current.x}px, ${trailPos.current.y}px) translate(-50%, -50%)`;

            raf = requestAnimationFrame(animate);
        };

        window.addEventListener("mousemove", move, { passive: true });
        window.addEventListener("mousemove", checkHover, { passive: true });
        document.addEventListener("mouseleave", leave);
        raf = requestAnimationFrame(animate);

        // Hide default cursor
        document.documentElement.style.cursor = "none";

        return () => {
            window.removeEventListener("mousemove", move);
            window.removeEventListener("mousemove", checkHover);
            document.removeEventListener("mouseleave", leave);
            cancelAnimationFrame(raf);
            document.documentElement.style.cursor = "";
        };
    }, []);

    return (
        <>
            <div ref={trailRef} className={styles.trail} aria-hidden="true" />
            <div ref={dotRef} className={styles.dot} aria-hidden="true" />
        </>
    );
}
