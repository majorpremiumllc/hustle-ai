"use client";
import { useEffect, useRef, useCallback } from "react";
import { SITE_CONFIG } from "../../lib/siteConfig";

const MOBILE_BREAKPOINT = 768;

export default function ParticleNetwork() {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const particlesRef = useRef([]);
    const mouseRef = useRef({ x: -1000, y: -1000 });
    const dimensionsRef = useRef({ w: 0, h: 0 });
    const modeRef = useRef(SITE_CONFIG.defaultMode);

    const getMode = () => SITE_CONFIG.modes[modeRef.current] || SITE_CONFIG.modes.boost;

    const initParticles = useCallback((w, h) => {
        const mode = getMode();
        const count = Math.min(Math.floor((w * h) / 18000 * mode.particleCount), 80);
        const particles = [];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * 0.3 * mode.particleSpeed,
                vy: (Math.random() - 0.5) * 0.3 * mode.particleSpeed,
                radius: Math.random() * 2 + 1,
                baseAlpha: (Math.random() * 0.4 + 0.1) * mode.particleAlpha,
                pulseSpeed: Math.random() * 0.002 + 0.001,
                pulseOffset: Math.random() * Math.PI * 2,
            });
        }
        particlesRef.current = particles;
    }, []);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (window.innerWidth < MOBILE_BREAKPOINT || mq.matches) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const w = window.innerWidth;
            const h = window.innerHeight;
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            canvas.style.width = w + "px";
            canvas.style.height = h + "px";
            ctx.scale(dpr, dpr);
            dimensionsRef.current = { w, h };
            initParticles(w, h);
        };

        const handleMouse = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        // Listen for AI mode changes
        const handleModeChange = (e) => {
            modeRef.current = e.detail;
            const { w, h } = dimensionsRef.current;
            initParticles(w, h);
        };

        const draw = (time) => {
            const { w, h } = dimensionsRef.current;
            const particles = particlesRef.current;
            const mouse = mouseRef.current;
            const mode = getMode();

            ctx.clearRect(0, 0, w, h);

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > w) p.vx *= -1;
                if (p.y < 0 || p.y > h) p.vy *= -1;

                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 200 && dist > 0) {
                    p.vx += (dx / dist) * 0.01;
                    p.vy += (dy / dist) * 0.01;
                }
                p.vx *= 0.999;
                p.vy *= 0.999;

                const pulse = Math.sin(time * p.pulseSpeed + p.pulseOffset) * 0.5 + 0.5;
                const alpha = p.baseAlpha + pulse * 0.15 * mode.glowIntensity;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 210, 255, ${alpha})`;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(108, 92, 231, ${alpha * 0.15})`;
                ctx.fill();
            }

            const connDist = mode.connectionDist;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const a = particles[i];
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < connDist) {
                        const alpha = (1 - dist / connDist) * 0.12 * mode.glowIntensity;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = `rgba(0, 210, 255, ${alpha})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        resize();
        window.addEventListener("resize", resize);
        window.addEventListener("mousemove", handleMouse, { passive: true });
        window.addEventListener("aiModeChange", handleModeChange);
        animationRef.current = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouse);
            window.removeEventListener("aiModeChange", handleModeChange);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [initParticles]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: -2,
                pointerEvents: "none",
                opacity: 0.6,
            }}
            aria-hidden="true"
        />
    );
}
