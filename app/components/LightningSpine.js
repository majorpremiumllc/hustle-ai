"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./LightningSpine.module.css";

/**
 * LightningSpine — The vertical energy beam "spine" of the How-It-Works page.
 * Uses canvas for the animated lightning beam effect.
 * Progress is driven by scroll position.
 */
export default function LightningSpine({ progress = 0, stepsCount = 4 }) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const progressRef = useRef(0);

    useEffect(() => {
        progressRef.current = progress;
    }, [progress]);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (mq.matches) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        const resize = () => {
            const rect = canvas.parentElement.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = rect.width + "px";
            canvas.style.height = rect.height + "px";
            ctx.scale(dpr, dpr);
        };

        resize();
        window.addEventListener("resize", resize);

        const draw = (time) => {
            const w = canvas.width / (window.devicePixelRatio || 1);
            const h = canvas.height / (window.devicePixelRatio || 1);
            const p = progressRef.current;
            ctx.clearRect(0, 0, w, h);

            const centerX = w / 2;
            const beamHeight = h * Math.min(p, 1);

            // Main beam (center glow tube)
            const grad = ctx.createLinearGradient(centerX, 0, centerX, beamHeight);
            grad.addColorStop(0, "rgba(0, 210, 255, 0.0)");
            grad.addColorStop(0.1, "rgba(0, 210, 255, 0.15)");
            grad.addColorStop(0.8, "rgba(108, 92, 231, 0.2)");
            grad.addColorStop(1, "rgba(0, 210, 255, 0.08)");

            ctx.beginPath();
            ctx.moveTo(centerX, 0);
            // Slight wobble for organic feel
            for (let y = 0; y < beamHeight; y += 4) {
                const wobble = Math.sin(y * 0.02 + time * 0.002) * 1.5;
                ctx.lineTo(centerX + wobble, y);
            }
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Wider glow
            ctx.beginPath();
            ctx.moveTo(centerX, 0);
            for (let y = 0; y < beamHeight; y += 4) {
                const wobble = Math.sin(y * 0.02 + time * 0.002) * 1.5;
                ctx.lineTo(centerX + wobble, y);
            }
            ctx.strokeStyle = "rgba(0, 210, 255, 0.04)";
            ctx.lineWidth = 12;
            ctx.stroke();

            // Energy pulse traveling down
            const pulseY = ((time * 0.05) % (beamHeight + 100)) - 50;
            if (pulseY > 0 && pulseY < beamHeight) {
                const pulseGrad = ctx.createRadialGradient(centerX, pulseY, 0, centerX, pulseY, 30);
                pulseGrad.addColorStop(0, "rgba(0, 210, 255, 0.25)");
                pulseGrad.addColorStop(0.5, "rgba(108, 92, 231, 0.08)");
                pulseGrad.addColorStop(1, "transparent");
                ctx.fillStyle = pulseGrad;
                ctx.fillRect(centerX - 30, pulseY - 30, 60, 60);
            }

            // Branching sparks (occasional)
            const sparkPhase = Math.sin(time * 0.003);
            if (sparkPhase > 0.7 && beamHeight > 100) {
                const sparkY = beamHeight * 0.3 + Math.sin(time * 0.001) * beamHeight * 0.3;
                const sparkDir = Math.sin(time * 0.005) > 0 ? 1 : -1;
                ctx.beginPath();
                ctx.moveTo(centerX, sparkY);
                ctx.lineTo(centerX + sparkDir * 15, sparkY + 8);
                ctx.lineTo(centerX + sparkDir * 10, sparkY + 16);
                ctx.strokeStyle = "rgba(0, 210, 255, 0.15)";
                ctx.lineWidth = 0.8;
                ctx.stroke();
            }

            animRef.current = requestAnimationFrame(draw);
        };

        animRef.current = requestAnimationFrame(draw);
        return () => {
            window.removeEventListener("resize", resize);
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, []);

    return (
        <div className={styles.spineContainer}>
            <canvas ref={canvasRef} className={styles.spineCanvas} aria-hidden="true" />
            {/* Static fallback line for reduced motion */}
            <div className={styles.spineFallback} style={{ height: `${progress * 100}%` }} />
        </div>
    );
}
