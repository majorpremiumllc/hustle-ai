"use client";

import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────
   Neural Splash Screen — Pure Canvas Only
   No images, no branding text. Just the neural
   network animation with a minimal progress bar.
   ───────────────────────────────────────────── */

export default function NeuralSplash({ onFinish }) {
    const [progress, setProgress] = useState(0);
    const [fadeOut, setFadeOut] = useState(false);
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const progressRef = useRef(0);

    useEffect(() => { progressRef.current = progress; }, [progress]);

    /* ── Pure canvas neural head animation ──── */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        const W = window.innerWidth;
        const H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + "px";
        canvas.style.height = H + "px";
        ctx.scale(dpr, dpr);

        const CX = W / 2;
        const CY = H * 0.42;
        const SCALE = Math.min(W, H) * 0.0022;

        // Head outline points (skull shape)
        const headPoints = [];
        const headShape = [
            // Skull outline
            [0, -85], [-15, -88], [-30, -85], [-42, -78], [-52, -65],
            [-58, -48], [-60, -30], [-58, -10], [-55, 5], [-52, 18],
            [-48, 30], [-42, 40], [-35, 48], [-30, 52], [-25, 55],
            [-20, 56], [-12, 55], [-5, 52], [0, 50],
            [5, 52], [12, 55], [20, 56], [25, 55],
            [30, 52], [35, 48], [42, 40], [48, 30],
            [52, 18], [55, 5], [58, -10], [60, -30],
            [58, -48], [52, -65], [42, -78], [30, -85], [15, -88],
            // Neck
            [-18, 56], [-15, 68], [-12, 78], [-10, 85],
            [10, 85], [12, 78], [15, 68], [18, 56],
            // Brain folds (interior)
            [-35, -65], [-20, -72], [-5, -68], [5, -72], [20, -68], [35, -65],
            [-40, -55], [-25, -60], [-10, -55], [10, -55], [25, -60], [40, -55],
            [-30, -45], [-15, -50], [0, -45], [15, -50], [30, -45],
            [-22, -38], [0, -35], [22, -38],
            // Eye sockets
            [-25, -15], [-18, -20], [-12, -15], [-18, -10],
            [12, -15], [18, -20], [25, -15], [18, -10],
            // Nose bridge
            [0, -10], [-5, 0], [0, 8], [5, 0],
            // Jaw line
            [-35, 25], [-20, 35], [0, 38], [20, 35], [35, 25],
            // Cheek nodes
            [-40, 5], [-38, 18], [40, 5], [38, 18],
            // Forehead nodes
            [-20, -75], [0, -80], [20, -75],
            // Temple nodes
            [-50, -35], [50, -35],
            // Extra brain detail
            [-28, -62], [-8, -65], [8, -65], [28, -62],
            [-35, -50], [-18, -55], [0, -52], [18, -55], [35, -50],
            [-25, -42], [0, -40], [25, -42],
        ];

        headShape.forEach(([x, y], i) => {
            headPoints.push({
                x: CX + x * SCALE,
                y: CY + y * SCALE,
                baseX: CX + x * SCALE,
                baseY: CY + y * SCALE,
                size: 1.2 + Math.random() * 2.2,
                opacity: 0,
                targetOpacity: 0.4 + Math.random() * 0.6,
                activateAt: (i / headShape.length) * 1600 + Math.random() * 400,
                pulseSpeed: 0.015 + Math.random() * 0.025,
                pulseOffset: Math.random() * Math.PI * 2,
                color: Math.random() > 0.4
                    ? `0, 210, 255`
                    : Math.random() > 0.5
                        ? `108, 92, 231`
                        : `160, 120, 255`,
                region: y < -40 ? "brain" : y < 10 ? "face" : "jaw",
            });
        });

        // Ambient floating particles
        const ambientParticles = [];
        for (let i = 0; i < 60; i++) {
            ambientParticles.push({
                x: Math.random() * W,
                y: Math.random() * H,
                size: 0.4 + Math.random() * 1.2,
                speed: 0.1 + Math.random() * 0.3,
                opacity: 0.08 + Math.random() * 0.15,
                drift: Math.random() * Math.PI * 2,
            });
        }

        // Pre-compute connections
        const connections = [];
        for (let i = 0; i < headPoints.length; i++) {
            for (let j = i + 1; j < headPoints.length; j++) {
                const dx = headPoints[i].baseX - headPoints[j].baseX;
                const dy = headPoints[i].baseY - headPoints[j].baseY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const maxDist = 50 * SCALE;
                if (dist < maxDist && Math.random() > 0.25) {
                    connections.push({ i, j, dist, maxDist });
                }
            }
        }

        // Synaptic pulses
        const pulses = [];
        let pulseTimer = 0;
        const startTime = Date.now();

        function draw() {
            const elapsed = Date.now() - startTime;
            const t = elapsed / 1000;
            const prog = progressRef.current;

            ctx.clearRect(0, 0, W, H);

            // Deep background glow
            const bgGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, Math.min(W, H) * 0.55);
            const intensity = 0.05 + Math.sin(t * 0.8) * 0.02;
            bgGrad.addColorStop(0, `rgba(108, 92, 231, ${intensity})`);
            bgGrad.addColorStop(0.3, `rgba(0, 210, 255, ${intensity * 0.4})`);
            bgGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            // Ambient particles
            ambientParticles.forEach(p => {
                p.y -= p.speed;
                p.x += Math.sin(t + p.drift) * 0.15;
                if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
                ctx.fillStyle = `rgba(0, 210, 255, ${p.opacity * (0.5 + Math.sin(t * 2 + p.drift) * 0.5)})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw connections
            connections.forEach(c => {
                const a = headPoints[c.i];
                const b = headPoints[c.j];
                const alpha = Math.min(a.opacity, b.opacity) * 0.35;
                if (alpha > 0.02) {
                    const pulse = 0.4 + Math.sin(t * 2 + c.dist * 0.02) * 0.6;
                    ctx.strokeStyle = `rgba(0, 210, 255, ${alpha * pulse * 0.5})`;
                    ctx.lineWidth = 0.6;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                }
            });

            // Synaptic pulse spawner
            pulseTimer++;
            if (pulseTimer > 6 && connections.length > 0 && prog > 5) {
                pulseTimer = 0;
                const c = connections[Math.floor(Math.random() * connections.length)];
                const a = headPoints[c.i];
                const b = headPoints[c.j];
                if (a.opacity > 0.15 && b.opacity > 0.15) {
                    pulses.push({
                        x: a.x, y: a.y,
                        tx: b.x, ty: b.y,
                        progress: 0,
                        speed: 0.025 + Math.random() * 0.035,
                        size: 1.5 + Math.random() * 1.5,
                    });
                }
            }

            // Draw synaptic pulses
            for (let i = pulses.length - 1; i >= 0; i--) {
                const p = pulses[i];
                p.progress += p.speed;
                if (p.progress >= 1) { pulses.splice(i, 1); continue; }
                const px = p.x + (p.tx - p.x) * p.progress;
                const py = p.y + (p.ty - p.y) * p.progress;
                const alpha = Math.sin(p.progress * Math.PI) * 0.9;
                const grad = ctx.createRadialGradient(px, py, 0, px, py, p.size * 6);
                grad.addColorStop(0, `rgba(0, 210, 255, ${alpha})`);
                grad.addColorStop(0.3, `rgba(108, 92, 231, ${alpha * 0.5})`);
                grad.addColorStop(1, "rgba(0, 0, 0, 0)");
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(px, py, p.size * 6, 0, Math.PI * 2);
                ctx.fill();
                // Bright center
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
                ctx.beginPath();
                ctx.arc(px, py, p.size * 0.7, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw head nodes
            headPoints.forEach(p => {
                if (elapsed > p.activateAt && p.opacity < p.targetOpacity) {
                    p.opacity = Math.min(p.targetOpacity, p.opacity + 0.012);
                }

                const breathe = Math.sin(t * p.pulseSpeed * 30 + p.pulseOffset);
                p.x = p.baseX + breathe * 1.5;
                p.y = p.baseY + Math.cos(t * p.pulseSpeed * 25 + p.pulseOffset) * 1.5;

                const pulse = 0.6 + Math.sin(t * 3 + p.pulseOffset) * 0.4;
                const nodeOpacity = p.opacity * pulse;

                // Outer glow
                const glowSize = p.size * (p.region === "brain" ? 8 : 5);
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
                grad.addColorStop(0, `rgba(${p.color}, ${nodeOpacity * 0.5})`);
                grad.addColorStop(0.4, `rgba(${p.color}, ${nodeOpacity * 0.15})`);
                grad.addColorStop(1, `rgba(${p.color}, 0)`);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
                ctx.fill();

                // Core
                ctx.fillStyle = `rgba(${p.color}, ${nodeOpacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();

                // Bright center
                if (p.size > 1.8) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${nodeOpacity * 0.6})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            // Electric arcs
            if (Math.random() > 0.93 && elapsed > 500) {
                const pi = Math.floor(Math.random() * headPoints.length);
                const pj = Math.floor(Math.random() * headPoints.length);
                if (pi !== pj) {
                    const a = headPoints[pi];
                    const b = headPoints[pj];
                    const dx = Math.abs(a.baseX - b.baseX);
                    const dy = Math.abs(a.baseY - b.baseY);
                    if (dx < 70 * SCALE && dy < 70 * SCALE && a.opacity > 0.3 && b.opacity > 0.3) {
                        ctx.strokeStyle = `rgba(180, 200, 255, ${0.12 + Math.random() * 0.2})`;
                        ctx.lineWidth = 0.8;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        const mx = (a.x + b.x) / 2 + (Math.random() - 0.5) * 20 * SCALE;
                        const my = (a.y + b.y) / 2 + (Math.random() - 0.5) * 20 * SCALE;
                        ctx.quadraticCurveTo(mx, my, b.x, b.y);
                        ctx.stroke();
                    }
                }
            }

            animRef.current = requestAnimationFrame(draw);
        }

        draw();
        return () => cancelAnimationFrame(animRef.current);
    }, []);

    /* ── Progress ───────────────────────── */
    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) { clearInterval(interval); return 100; }
                const inc = prev < 60 ? 3 + Math.random() * 4 : prev < 90 ? 1 + Math.random() * 2 : 0.5;
                return Math.min(100, prev + inc);
            });
        }, 60);
        return () => clearInterval(interval);
    }, []);

    /* ── Finish ─────────────────────────── */
    useEffect(() => {
        if (progress >= 100) {
            const t = setTimeout(() => {
                setFadeOut(true);
                setTimeout(() => onFinish?.(), 600);
            }, 400);
            return () => clearTimeout(t);
        }
    }, [progress, onFinish]);

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "radial-gradient(ellipse at 50% 40%, #0d0d2b 0%, #07071a 40%, #020210 100%)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "flex-end",
            paddingBottom: "8vh",
            opacity: fadeOut ? 0 : 1,
            transition: "opacity 0.6s ease",
        }}>
            {/* Full-screen canvas — neural head + particles */}
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0 }} />

            {/* Only a thin progress bar at the bottom */}
            <div style={{
                position: "relative", zIndex: 2,
                width: 140, maxWidth: "60vw",
            }}>
                <div style={{
                    width: "100%", height: 2,
                    borderRadius: 1,
                    background: "rgba(255,255,255,0.04)",
                    overflow: "hidden",
                }}>
                    <div style={{
                        height: "100%", borderRadius: 1,
                        background: "linear-gradient(90deg, #6C5CE7, #00D2FF)",
                        width: `${progress}%`,
                        transition: "width 0.15s ease",
                        boxShadow: "0 0 10px rgba(0, 210, 255, 0.5)",
                    }} />
                </div>
            </div>
        </div>
    );
}
