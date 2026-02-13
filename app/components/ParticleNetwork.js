"use client";
import { useEffect, useRef, useCallback } from "react";

/**
 * NeuralParticleNetwork — Dense, flowing neural network animation.
 * Creates a stunning web of interconnected neurons with:
 *  - 200+ particles with varied sizes and glow intensities
 *  - Flowing signal pulses along connection lines
 *  - Mouse-reactive repulsion field
 *  - Gradient connections (purple → cyan)
 *  - Multiple particle layers for depth
 */

const MOBILE_BREAKPOINT = 768;

/* ── Signal Pulse ─────────────────────────── */
class SignalPulse {
    constructor(fromX, fromY, toX, toY) {
        this.fromX = fromX;
        this.fromY = fromY;
        this.toX = toX;
        this.toY = toY;
        this.progress = 0;
        this.speed = 0.008 + Math.random() * 0.012;
        this.size = 1.5 + Math.random() * 2;
        this.alpha = 0.6 + Math.random() * 0.4;
    }
    update() { this.progress += this.speed; return this.progress < 1; }
    get x() { return this.fromX + (this.toX - this.fromX) * this.progress; }
    get y() { return this.fromY + (this.toY - this.fromY) * this.progress; }
}

export default function ParticleNetwork() {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const particlesRef = useRef([]);
    const pulsesRef = useRef([]);
    const mouseRef = useRef({ x: -1000, y: -1000 });
    const highlightRef = useRef(null);  /* { x, y, w, h } screen coords */
    const dimensionsRef = useRef({ w: 0, h: 0 });
    const timeRef = useRef(0);

    const initParticles = useCallback((w, h) => {
        /* Optimized particle field — balanced density for performance */
        const area = w * h;
        const baseDensity = Math.floor(area / 9000);
        const count = Math.min(Math.max(baseDensity, 60), 180);
        const particles = [];

        for (let i = 0; i < count; i++) {
            const layer = Math.random(); // 0 = far, 1 = near
            const speed = 0.15 + layer * 0.35;
            const size = 0.5 + layer * 2.5;

            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                vx: (Math.random() - 0.5) * speed,
                vy: (Math.random() - 0.5) * speed,
                radius: size,
                layer,
                baseAlpha: 0.2 + layer * 0.5,
                pulsePhase: Math.random() * Math.PI * 2,
                hue: Math.random() > 0.6 ? 270 : 190, // purple or cyan
            });
        }
        particlesRef.current = particles;
        pulsesRef.current = [];
    }, []);

    /* ── Listen for highlight events from AIGreeter tour ── */
    useEffect(() => {
        const onHighlight = (e) => {
            highlightRef.current = e.detail; /* { x, y, w, h } or null */
        };
        window.addEventListener("hustleai-highlight", onHighlight);
        return () => window.removeEventListener("hustleai-highlight", onHighlight);
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
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            dimensionsRef.current = { w, h };
            initParticles(w, h);
        };

        const handleMouse = (e) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        const handleMouseLeave = () => {
            mouseRef.current = { x: -1000, y: -1000 };
        };

        /* ── Render loop (throttled to ~30fps for perf) ── */
        let frameCount = 0;
        const draw = () => {
            frameCount++;
            /* Skip every other frame for ~30fps render */
            if (frameCount % 2 !== 0) {
                animationRef.current = requestAnimationFrame(draw);
                return;
            }

            const { w, h } = dimensionsRef.current;
            const particles = particlesRef.current;
            const mouse = mouseRef.current;
            const t = timeRef.current++;
            const hlZone = highlightRef.current;

            ctx.clearRect(0, 0, w, h);

            /* Helper: proximity multiplier to highlight zone */
            const hlBoost = (px, py) => {
                if (!hlZone) return 1;
                /* Distance from point to highlight rect center */
                const cx = hlZone.x + hlZone.w / 2;
                const cy = hlZone.y + hlZone.h / 2;
                const rx = hlZone.w / 2 + 120; /* padding around zone */
                const ry = hlZone.h / 2 + 120;
                const dx = Math.abs(px - cx) / rx;
                const dy = Math.abs(py - cy) / ry;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d > 1) return 1;
                /* Smooth pulse that breathes */
                const pulse = 0.7 + 0.3 * Math.sin(t * 0.04);
                return 1 + (1 - d) * 3 * pulse; /* up to 4× boost */
            };

            /* ── Update particles ─────────── */
            for (const p of particles) {
                p.x += p.vx;
                p.y += p.vy;

                // Wrap around edges smoothly
                if (p.x < -20) p.x = w + 20;
                else if (p.x > w + 20) p.x = -20;
                if (p.y < -20) p.y = h + 20;
                else if (p.y > h + 20) p.y = -20;

                // Mouse repulsion
                const mdx = p.x - mouse.x;
                const mdy = p.y - mouse.y;
                const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
                if (mDist < 180 && mDist > 0) {
                    const force = (180 - mDist) / 180 * 0.3;
                    p.vx += (mdx / mDist) * force;
                    p.vy += (mdy / mDist) * force;
                }

                // Speed damping
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                const maxSpeed = 0.5 + p.layer * 0.5;
                if (speed > maxSpeed) {
                    p.vx *= maxSpeed / speed;
                    p.vy *= maxSpeed / speed;
                }
                p.vx *= 0.998;
                p.vy *= 0.998;
            }

            /* ── Draw connections (use squared dist to avoid sqrt) ── */
            const connDist = 120;
            const connDistSq = connDist * connDist;
            for (let i = 0; i < particles.length; i++) {
                const a = particles[i];
                for (let j = i + 1; j < particles.length; j++) {
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < connDistSq) {
                        const dist = Math.sqrt(distSq);
                        const bst = Math.max(hlBoost(a.x, a.y), hlBoost(b.x, b.y));
                        const alpha = (1 - dist / connDist) * 0.18 * Math.min(a.layer + b.layer, 1.2) * bst;

                        // Gradient line: cyan → purple (hue shifts toward cyan when highlighted)
                        const hueA = bst > 1.5 ? 190 : a.hue;
                        const hueB = bst > 1.5 ? 190 : b.hue;
                        const lum = bst > 1.5 ? 75 : 65;
                        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
                        grad.addColorStop(0, `hsla(${hueA}, 80%, ${lum}%, ${Math.min(alpha, 0.7)})`);
                        grad.addColorStop(1, `hsla(${hueB}, 80%, ${lum}%, ${Math.min(alpha, 0.7)})`);

                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.strokeStyle = grad;
                        ctx.lineWidth = (0.4 + Math.min(a.layer, b.layer) * 0.6) * (bst > 1.5 ? 1.5 : 1);
                        ctx.stroke();

                        // Randomly spawn signal pulses
                        if (Math.random() < 0.0004 && pulsesRef.current.length < 25) {
                            pulsesRef.current.push(new SignalPulse(a.x, a.y, b.x, b.y));
                        }
                    }
                }
            }

            /* ── Draw signal pulses ───────── */
            pulsesRef.current = pulsesRef.current.filter((pulse) => {
                const alive = pulse.update();
                if (alive) {
                    const fadeIn = Math.min(pulse.progress * 4, 1);
                    const fadeOut = Math.min((1 - pulse.progress) * 4, 1);
                    const a = pulse.alpha * fadeIn * fadeOut;

                    // Bright dot
                    ctx.beginPath();
                    ctx.arc(pulse.x, pulse.y, pulse.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(0, 210, 255, ${a})`;
                    ctx.fill();

                    // Glow halo
                    ctx.beginPath();
                    ctx.arc(pulse.x, pulse.y, pulse.size * 3, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(108, 92, 231, ${a * 0.2})`;
                    ctx.fill();
                }
                return alive;
            });

            /* ── Draw particles ───────────── */
            for (const p of particles) {
                const bst = hlBoost(p.x, p.y);
                const pulse = Math.sin(t * 0.02 + p.pulsePhase) * 0.3 + 0.7;
                const alpha = Math.min(p.baseAlpha * pulse * bst, 1);
                const r = p.radius * (0.8 + pulse * 0.2) * (bst > 1.5 ? 1.4 : 1);
                const hue = bst > 1.5 ? 190 : p.hue;
                const lum = bst > 1.5 ? 80 : 70;

                // Core dot
                ctx.beginPath();
                ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${hue}, 85%, ${lum}%, ${alpha})`;
                ctx.fill();

                // Outer glow (bigger particles or highlighted)
                if (p.radius > 1.5 || bst > 1.5) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, r * 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = `hsla(${hue}, 70%, 55%, ${alpha * (bst > 1.5 ? 0.2 : 0.08)})`;
                    ctx.fill();
                }
            }

            /* ── Draw highlight zone ambient glow ── */
            if (hlZone) {
                const cx = hlZone.x + hlZone.w / 2;
                const cy = hlZone.y + hlZone.h / 2;
                const rx = hlZone.w / 2 + 80;
                const ry = hlZone.h / 2 + 80;
                const pulse = 0.5 + 0.5 * Math.sin(t * 0.03);

                ctx.save();
                ctx.globalCompositeOperation = "screen";
                const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
                glow.addColorStop(0, `rgba(0, 210, 255, ${0.04 * pulse})`);
                glow.addColorStop(0.5, `rgba(108, 92, 231, ${0.02 * pulse})`);
                glow.addColorStop(1, "rgba(0, 0, 0, 0)");
                ctx.fillStyle = glow;
                ctx.fillRect(cx - Math.max(rx, ry), cy - Math.max(rx, ry), Math.max(rx, ry) * 2, Math.max(rx, ry) * 2);
                ctx.restore();
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        resize();
        window.addEventListener("resize", resize);
        window.addEventListener("mousemove", handleMouse, { passive: true });
        window.addEventListener("mouseleave", handleMouseLeave);
        animationRef.current = requestAnimationFrame(draw);

        return () => {
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouse);
            window.removeEventListener("mouseleave", handleMouseLeave);
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
                opacity: 0.7,
            }}
            aria-hidden="true"
        />
    );
}
