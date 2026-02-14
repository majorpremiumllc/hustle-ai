"use client";
import { useState, useEffect, useRef } from "react";

/* ── Hooks ─── */
function useInView(t = 0.15) {
    const ref = useRef(null);
    const [v, setV] = useState(false);
    useEffect(() => { const el = ref.current; if (!el) return; const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: t }); o.observe(el); return () => o.disconnect(); }, [t]);
    return [ref, v];
}
function useCount(end, dur = 2000, go = false) {
    const [v, setV] = useState(0);
    useEffect(() => { if (!go) return; let s = null; const step = (ts) => { if (!s) s = ts; const p = Math.min((ts - s) / dur, 1); setV(Math.floor(p * end)); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }, [go, end, dur]);
    return v;
}

/* ── Icons ─── */
const Bolt = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
const Check = ({ c = "#00B894" }) => <svg viewBox="0 0 20 20" fill={c} style={{ width: 18, height: 18, flexShrink: 0 }}><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const X = () => <svg viewBox="0 0 20 20" fill="#E17055" style={{ width: 18, height: 18, flexShrink: 0 }}><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const Arrow = () => <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 18, height: 18 }}><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;
const Star = () => <svg viewBox="0 0 20 20" fill="#FDCB6E" style={{ width: 16, height: 16 }}><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
const Chev = ({ open }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20, transition: "transform .3s", transform: open ? "rotate(180deg)" : "rotate(0)" }}><polyline points="6 9 12 15 18 9" /></svg>;

const fmt = n => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ── Invoice Template Component ─── */
function InvoicePreview({ template, active }) {
    const themes = {
        executive: { bg: "linear-gradient(135deg, #1a1a2e, #16213e)", accent: "#6C5CE7", header: "#6C5CE7", text: "#fff", sub: "rgba(255,255,255,0.6)", name: "Executive", tagline: "Premium dark theme for high-value contracts" },
        corporate: { bg: "#ffffff", accent: "#2D3436", header: "#2D3436", text: "#2D3436", sub: "#636E72", name: "Corporate", tagline: "Classic professional for established businesses" },
        modern: { bg: "#ffffff", accent: "#0984E3", header: "linear-gradient(135deg, #0984E3, #00D2FF)", text: "#2D3436", sub: "#636E72", name: "Modern", tagline: "Clean gradients for tech-savvy brands" },
        warm: { bg: "#ffffff", accent: "#E17055", header: "linear-gradient(135deg, #E17055, #FDCB6E)", text: "#2D3436", sub: "#636E72", name: "Warm", tagline: "Friendly tones for creative professionals" },
    };
    const t = themes[template] || themes.executive;
    const isDark = template === "executive";
    const items = [
        { desc: "Full bathroom demolition & debris removal", qty: 1, unit: "job", rate: 1850 },
        { desc: "Custom walk-in shower — frameless glass enclosure", qty: 1, unit: "unit", rate: 4200 },
        { desc: "Porcelain floor tile (12×24) — supply & install", qty: 85, unit: "sq ft", rate: 18 },
        { desc: "Double vanity w/ quartz top — installed", qty: 1, unit: "unit", rate: 3400 },
        { desc: "Plumbing rough-in & fixture connection", qty: 1, unit: "job", rate: 2200 },
        { desc: "LED recessed lighting (6 fixtures)", qty: 6, unit: "pcs", rate: 185 },
    ];
    const sub = items.reduce((s, i) => s + i.qty * i.rate, 0);
    const tax = sub * 0.0875;
    const total = sub + tax;

    return (
        <div style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#fff", borderRadius: 16, overflow: "hidden", boxShadow: active ? `0 30px 80px rgba(0,0,0,${isDark ? 0.5 : 0.15}), 0 0 0 2px ${t.accent}30` : `0 10px 40px rgba(0,0,0,${isDark ? 0.3 : 0.08})`, transition: "all 0.5s ease", transform: active ? "scale(1)" : "scale(0.97)", maxWidth: 520, width: "100%" }}>
            {/* Header */}
            <div style={{ background: typeof t.header === "string" && !t.header.includes("gradient") ? t.header : t.header, padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>INVOICE</div>
                    <div style={{ color: "#fff", fontWeight: 900, fontSize: "1.3rem", letterSpacing: "-0.02em" }}>Thompson Renovations</div>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 2 }}>License #CA-78291 · Bonded & Insured</div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>#INV-2026-0284</div>
                    <div style={{
                        color: "rgba(255,255,255,0.5)", fontSize: 11
                    }}>Feb 13, 2026</div>
                    <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700, color: "#fff", marginTop: 6, display: "inline-block" }}>NET 30</div>
                </div>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px", background: isDark ? "#0d1117" : "#fff", color: isDark ? "#e0e0e0" : "#2D3436" }}>
                {/* Client info */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20, fontSize: 12 }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: t.accent, marginBottom: 4 }}>Bill To</div>
                        <div style={{ fontWeight: 700 }}>Robert & Sarah Mitchell</div>
                        <div style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#636E72", lineHeight: 1.5 }}>4521 Oakwood Drive<br />San Francisco, CA 94102</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 800, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: t.accent, marginBottom: 4 }}>Project</div>
                        <div style={{ fontWeight: 700 }}>Master Bathroom Remodel</div>
                        <div style={{ color: isDark ? "rgba(255,255,255,0.5)" : "#636E72", lineHeight: 1.5 }}>Scope: Full gut renovation<br />Timeline: 3–4 weeks</div>
                    </div>
                </div>

                {/* Table */}
                <div style={{ borderTop: `2px solid ${t.accent}`, paddingTop: 12 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "2.5fr 0.5fr 0.8fr 0.8fr", gap: 4, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: isDark ? "rgba(255,255,255,0.35)" : "#999", paddingBottom: 8 }}>
                        <span>Description</span><span style={{ textAlign: "center" }}>Qty</span><span style={{ textAlign: "right" }}>Rate</span><span style={{ textAlign: "right" }}>Amount</span>
                    </div>
                    {items.map((item, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "2.5fr 0.5fr 0.8fr 0.8fr", gap: 4, fontSize: 12, padding: "8px 0", borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "#f0f0f0"}` }}>
                            <span style={{ fontWeight: 500 }}>{item.desc}</span>
                            <span style={{ textAlign: "center", color: isDark ? "rgba(255,255,255,0.5)" : "#999" }}>{item.qty}</span>
                            <span style={{ textAlign: "right", color: isDark ? "rgba(255,255,255,0.5)" : "#999" }}>{fmt(item.rate)}</span>
                            <span style={{ textAlign: "right", fontWeight: 700 }}>{fmt(item.qty * item.rate)}</span>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ width: 220 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", color: isDark ? "rgba(255,255,255,0.5)" : "#999" }}>
                            <span>Subtotal</span><span style={{ fontWeight: 600, color: isDark ? "#fff" : "#333" }}>{fmt(sub)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "4px 0", color: isDark ? "rgba(255,255,255,0.5)" : "#999" }}>
                            <span>Tax (8.75%)</span><span style={{ fontWeight: 600, color: isDark ? "#fff" : "#333" }}>{fmt(tax)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, padding: "10px 0 0", borderTop: `2px solid ${t.accent}`, marginTop: 6 }}>
                            <span style={{ fontWeight: 800 }}>Total Due</span>
                            <span style={{ fontWeight: 900, color: t.accent }}>{fmt(total)}</span>
                        </div>
                    </div>
                </div>

                {/* Payment button */}
                <div style={{ marginTop: 20, padding: "14px", background: t.accent, borderRadius: 10, textAlign: "center", color: "#fff", fontWeight: 800, fontSize: 13, letterSpacing: "0.03em" }}>
                    💳 Pay Now — Secure Online Payment
                </div>
                <div style={{ textAlign: "center", marginTop: 8, fontSize: 10, color: isDark ? "rgba(255,255,255,0.3)" : "#bbb" }}>
                    Payments processed securely via Stripe · Visa, Mastercard, Amex, ACH
                </div>
            </div>
        </div >
    );
}

/* ── Testimonials ─── */
const REVIEWS = [
    { name: "Mike T.", role: "General Contractor, Phoenix AZ", text: "I used to spend 2 hours every night writing invoices. Now I describe the job in 30 seconds and AI does the rest. My clients say the invoices look more professional than firms 10x my size.", stars: 5 },
    { name: "Sarah K.", role: "Interior Designer, LA", text: "The template quality blew me away. I switched from QuickBooks because these invoices actually match my brand. The AI auto-fill is scary accurate — it even knows material pricing.", stars: 5 },
    { name: "Carlos R.", role: "Plumbing Company Owner, Miami", text: "First month I collected $12K faster because clients could pay online instantly. The 2.9% fee pays for itself 100x over. Best $29 I spend every month.", stars: 5 },
];

const FAQ = [
    { q: "How accurate is the AI pricing?", a: "Our AI is trained on millions of real-world job estimates across 200+ trade categories. It considers your location, materials, and scope to generate market-rate pricing. You can always adjust any line item before sending." },
    { q: "What's included in the 2.9% fee?", a: "Payment processing (credit card, debit, ACH), fraud protection, automated receipt generation, payment tracking, and automatic reminders for overdue invoices. No hidden fees, no monthly minimums." },
    { q: "Can I add my logo and branding?", a: "Absolutely. Upload your logo, set your brand colors, and choose from our 4 premium templates. Every invoice goes out looking like it came from a Fortune 500 company." },
    { q: "How do clients pay?", a: "Clients receive a professional email with a secure payment link. They can pay via credit card, debit card, or ACH bank transfer. You get instant notification when payment is received." },
    { q: "Is there a contract?", a: "Zero contracts, zero commitments. Cancel anytime with one click. Your invoices and data are always exportable." },
];

/* ── Before/After Data ─── */
const COMPARE = [
    { label: "Time to create invoice", before: "45–90 minutes", after: "30 seconds" },
    { label: "Professional appearance", before: "Generic PDF / handwritten", after: "Premium branded templates" },
    { label: "Payment speed", before: "2–4 weeks (checks/cash)", after: "Same-day online payment" },
    { label: "Accuracy", before: "Manual math errors", after: "AI-verified calculations" },
    { label: "Client experience", before: "Emailed PDF attachment", after: "Interactive payment portal" },
    { label: "Tracking", before: "Spreadsheet / memory", after: "Auto status + reminders" },
];

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export default function AIInvoicePage() {
    const [tpl, setTpl] = useState("executive");
    const [faq, setFaq] = useState(null);
    const [heroRef, heroV] = useInView(0.1);
    const [painRef, painV] = useInView();
    const [compRef, compV] = useInView();
    const [tplRef, tplV] = useInView();
    const [proofRef, proofV] = useInView();
    const [statsRef, statsV] = useInView();
    const inv = useCount(14200, 2200, statsV);
    const rev = useCount(4800000, 2500, statsV);
    const avg = useCount(47, 2000, statsV);

    const templates = ["executive", "corporate", "modern", "warm"];
    const tplNames = { executive: "Executive Dark", corporate: "Corporate Classic", modern: "Modern Gradient", warm: "Warm Creative" };
    const tplDescs = { executive: "Premium dark theme — perfect for high-value contracts and luxury services", corporate: "Timeless black & white — trusted by established businesses nationwide", modern: "Clean blue gradients — ideal for tech, design, and modern trades", warm: "Friendly warm tones — great for creative pros and client-facing work" };
    const tplAccents = { executive: "#6C5CE7", corporate: "#2D3436", modern: "#0984E3", warm: "#E17055" };

    const S = { page: { background: "#06061a", color: "#e0e0e0", minHeight: "100vh", fontFamily: "'Inter',-apple-system,sans-serif" } };

    return (
        <div style={S.page}>
            {/* NAV */}
            <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(6,6,26,0.88)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "14px 0" }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#fff", fontWeight: 800, fontSize: "1.15rem" }}><Bolt /> Hustle<span style={{ background: "linear-gradient(135deg,#6C5CE7,#00D2FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span></a>
                    <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                        <a href="/#pricing" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "0.85rem" }}>All Plans</a>
                        <a href="/login" style={{ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: "0.85rem" }}>Sign In</a>
                        <a href="/signup" style={{ background: "linear-gradient(135deg,#6C5CE7,#00D2FF)", color: "#fff", padding: "10px 24px", borderRadius: 12, textDecoration: "none", fontWeight: 700, fontSize: "0.85rem", boxShadow: "0 4px 20px rgba(108,92,231,0.3)" }}>Get Started</a>
                    </div>
                </div>
            </nav>

            {/* ═══ HERO ═══ */}
            <section ref={heroRef} style={{ position: "relative", overflow: "hidden", paddingTop: 130, paddingBottom: 80 }}>
                <div style={{ position: "absolute", top: "15%", left: "5%", width: 700, height: 700, background: "radial-gradient(circle, rgba(108,92,231,0.12) 0%, transparent 65%)", filter: "blur(80px)", pointerEvents: "none" }} />
                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 48, alignItems: "center", position: "relative", zIndex: 2 }}>
                    <div style={{ opacity: heroV ? 1 : 0, transform: heroV ? "translateY(0)" : "translateY(40px)", transition: "all .8s cubic-bezier(.22,1,.36,1)" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,184,148,0.1)", border: "1px solid rgba(0,184,148,0.2)", borderRadius: 100, padding: "5px 14px", marginBottom: 20 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#00B894" }}>⚡ Used by 2,400+ service pros</span>
                        </div>
                        <h1 style={{ fontSize: "clamp(2.2rem,4.5vw,3.4rem)", fontWeight: 900, lineHeight: 1.08, marginBottom: 18, letterSpacing: "-0.03em" }}>
                            Stop Losing Money on<br />
                            <span style={{ background: "linear-gradient(135deg,#6C5CE7 0%,#00D2FF 50%,#A78BFA 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Ugly, Slow Invoices</span>
                        </h1>
                        <p style={{ fontSize: "1.1rem", lineHeight: 1.7, color: "rgba(255,255,255,0.55)", marginBottom: 28, maxWidth: 500 }}>
                            <strong style={{ color: "#fff" }}>67% of contractors</strong> lose clients because their invoices look unprofessional. Our AI creates stunning, branded invoices in 30 seconds — and your clients can pay online <strong style={{ color: "#fff" }}>instantly</strong>.
                        </p>
                        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
                            <a href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg,#6C5CE7,#7C3AED)", color: "#fff", padding: "15px 32px", borderRadius: 14, textDecoration: "none", fontWeight: 800, fontSize: "1rem", boxShadow: "0 8px 30px rgba(108,92,231,0.4)" }}>
                                Get Started Now <Arrow />
                            </a>
                            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
                                <span style={{ fontWeight: 800, fontSize: "1.3rem", color: "#fff" }}>$29</span>/mo · Cancel anytime
                            </span>
                        </div>
                        <div style={{ display: "flex", gap: 16 }}>
                            {["30-second invoices", "Online payments", "4 pro templates"].map(t => (
                                <span key={t} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.78rem", color: "rgba(255,255,255,0.45)" }}><Check /> {t}</span>
                            ))}
                        </div>
                    </div>

                    {/* Invoice preview */}
                    <div style={{ opacity: heroV ? 1 : 0, transform: heroV ? "rotate(-1deg)" : "translateY(50px) rotate(2deg)", transition: "all 1s cubic-bezier(.22,1,.36,1) .2s" }}>
                        <InvoicePreview template="executive" active={true} />
                    </div>
                </div>
            </section>

            {/* ═══ PAIN POINTS ═══ */}
            <section ref={painRef} style={{ padding: "80px 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
                    <h2 style={{ fontSize: "clamp(1.6rem,3.5vw,2.2rem)", fontWeight: 900, marginBottom: 40 }}>
                        Your Invoices Are <span style={{ color: "#E17055" }}>Costing You Money</span>
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                        {[
                            { val: "67%", text: "of clients judge your business by your invoice quality" },
                            { val: "23 days", text: "average time to get paid with paper/PDF invoices" },
                            { val: "$4,200", text: "lost per year from invoicing errors & delayed payments" },
                        ].map((s, i) => (
                            <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24, opacity: painV ? 1 : 0, transform: painV ? "translateY(0)" : "translateY(20px)", transition: `all .6s ease ${i * .15}s` }}>
                                <div style={{ fontSize: "2rem", fontWeight: 900, color: "#E17055", marginBottom: 6 }}>{s.val}</div>
                                <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{s.text}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ BEFORE / AFTER ═══ */}
            <section ref={compRef} style={{ padding: "80px 0" }}>
                <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
                    <h2 style={{ textAlign: "center", fontSize: "clamp(1.6rem,3.5vw,2.2rem)", fontWeight: 900, marginBottom: 40 }}>
                        Before vs <span style={{ background: "linear-gradient(135deg,#6C5CE7,#00D2FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>After HustleAI</span>
                    </h2>
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", padding: "14px 20px", background: "rgba(255,255,255,0.03)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)" }}>
                            <span></span><span style={{ textAlign: "center", color: "#E17055" }}>❌ Without AI</span><span style={{ textAlign: "center", color: "#00B894" }}>✅ With HustleAI</span>
                        </div>
                        {COMPARE.map((r, i) => (
                            <div key={i} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.04)", opacity: compV ? 1 : 0, transform: compV ? "translateX(0)" : "translateX(-15px)", transition: `all .5s ease ${i * .1}s` }}>
                                <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>{r.label}</span>
                                <span style={{ textAlign: "center", fontSize: "0.82rem", color: "rgba(255,255,255,0.4)" }}>{r.before}</span>
                                <span style={{ textAlign: "center", fontSize: "0.82rem", color: "#00B894", fontWeight: 600 }}>{r.after}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ TEMPLATE GALLERY ═══ */}
            <section ref={tplRef} style={{ padding: "80px 0", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
                    <div style={{ textAlign: "center", marginBottom: 48 }}>
                        <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#00B894", background: "rgba(0,184,148,0.08)", border: "1px solid rgba(0,184,148,0.15)", padding: "4px 14px", borderRadius: 100, marginBottom: 14 }}>Premium Templates</span>
                        <h2 style={{ fontSize: "clamp(1.6rem,3.5vw,2.4rem)", fontWeight: 900, marginBottom: 10 }}>
                            Invoices That Make Clients Say <span style={{ background: "linear-gradient(135deg,#6C5CE7,#00D2FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>"Wow"</span>
                        </h2>
                        <p style={{ color: "rgba(255,255,255,0.45)", maxWidth: 550, margin: "0 auto" }}>Each template is designed by professionals to build trust and get you paid faster.</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 40, alignItems: "start" }}>
                        {/* Selector */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "sticky", top: 80 }}>
                            {templates.map(id => (
                                <button key={id} onClick={() => setTpl(id)} style={{
                                    display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12,
                                    border: tpl === id ? `2px solid ${tplAccents[id]}` : "2px solid rgba(255,255,255,0.06)",
                                    background: tpl === id ? `${tplAccents[id]}10` : "rgba(255,255,255,0.02)",
                                    cursor: "pointer", transition: "all .3s", width: "100%", textAlign: "left"
                                }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: id === "executive" ? "linear-gradient(135deg,#1a1a2e,#6C5CE7)" : id === "corporate" ? "#2D3436" : id === "modern" ? "linear-gradient(135deg,#0984E3,#00D2FF)" : "linear-gradient(135deg,#E17055,#FDCB6E)", flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontWeight: 700, color: "#fff", fontSize: "0.88rem" }}>{tplNames[id]}</div>
                                        <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.4, marginTop: 2 }}>{tplDescs[id]}</div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Preview */}
                        <div style={{ display: "flex", justifyContent: "center" }}>
                            <InvoicePreview template={tpl} active={true} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ STATS ═══ */}
            <section ref={statsRef} style={{ padding: "60px 0", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, textAlign: "center" }}>
                    {[
                        { v: inv.toLocaleString() + "+", l: "Invoices Generated", s: "this month alone" },
                        { v: "$" + (rev / 100).toLocaleString(), l: "Revenue Collected", s: "through AI invoices" },
                        { v: avg + " sec", l: "Average Creation Time", s: "vs 45 min manually" },
                    ].map((s, i) => (
                        <div key={i} style={{ opacity: statsV ? 1 : 0, transition: `all .5s ease ${i * .1}s` }}>
                            <div style={{ fontSize: "2.2rem", fontWeight: 900, background: "linear-gradient(135deg,#00D2FF,#6C5CE7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.v}</div>
                            <div style={{ fontWeight: 700, color: "#fff", marginTop: 6, fontSize: "0.9rem" }}>{s.l}</div>
                            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem" }}>{s.s}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══ TESTIMONIALS ═══ */}
            <section ref={proofRef} style={{ padding: "80px 0" }}>
                <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
                    <h2 style={{ textAlign: "center", fontSize: "clamp(1.6rem,3.5vw,2.2rem)", fontWeight: 900, marginBottom: 40 }}>
                        Trusted by <span style={{ background: "linear-gradient(135deg,#FDCB6E,#E17055)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Real Professionals</span>
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                        {REVIEWS.map((r, i) => (
                            <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24, opacity: proofV ? 1 : 0, transform: proofV ? "translateY(0)" : "translateY(20px)", transition: `all .6s ease ${i * .15}s` }}>
                                <div style={{ display: "flex", gap: 2, marginBottom: 12 }}>{Array(r.stars).fill(0).map((_, j) => <Star key={j} />)}</div>
                                <p style={{ fontSize: "0.88rem", lineHeight: 1.65, color: "rgba(255,255,255,0.7)", marginBottom: 16, fontStyle: "italic" }}>"{r.text}"</p>
                                <div><strong style={{ color: "#fff", fontSize: "0.85rem" }}>{r.name}</strong></div>
                                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>{r.role}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ PRICING CTA ═══ */}
            <section style={{ padding: "80px 0", background: "rgba(108,92,231,0.04)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ maxWidth: 650, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
                    <h2 style={{ fontSize: "clamp(1.8rem,4vw,2.4rem)", fontWeight: 900, marginBottom: 10 }}>
                        Start Getting Paid <span style={{ background: "linear-gradient(135deg,#6C5CE7,#00D2FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Like a Pro</span>
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.45)", marginBottom: 36 }}>Join 2,400+ service pros who stopped losing money on unprofessional invoices.</p>

                    <div style={{ background: "rgba(255,255,255,0.04)", border: "2px solid rgba(108,92,231,0.3)", borderRadius: 20, padding: "36px 32px", maxWidth: 400, margin: "0 auto", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#6C5CE7,#00D2FF)" }} />
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#A78BFA", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>AI Invoice Plan</div>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, marginBottom: 6 }}>
                            <span style={{ fontSize: "3rem", fontWeight: 900, color: "#fff" }}>$29</span>
                            <span style={{ color: "rgba(255,255,255,0.4)" }}>/mo</span>
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", marginBottom: 24 }}>+ 2.9% per invoice · pays for itself instantly</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24, textAlign: "left" }}>
                            {["Unlimited AI invoices", "4 premium templates", "AI auto-fill from descriptions", "Online payments + tracking", "Automated reminders", "Cancel anytime"].map(f => (
                                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.88rem" }}>
                                    <Check /> <span style={{ color: "rgba(255,255,255,0.75)" }}>{f}</span>
                                </div>
                            ))}
                        </div>
                        <a href="/signup" style={{ display: "block", background: "linear-gradient(135deg,#6C5CE7,#7C3AED)", color: "#fff", padding: "15px", borderRadius: 12, textDecoration: "none", fontWeight: 800, textAlign: "center", boxShadow: "0 8px 30px rgba(108,92,231,0.4)" }}>
                            Get Started Now
                        </a>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 10 }}>Cancel anytime · No contracts</p>
                    </div>
                </div>
            </section>

            {/* ═══ FAQ ═══ */}
            <section style={{ padding: "80px 0" }}>
                <div style={{ maxWidth: 650, margin: "0 auto", padding: "0 24px" }}>
                    <h2 style={{ textAlign: "center", fontSize: "clamp(1.5rem,3vw,2rem)", fontWeight: 900, marginBottom: 36 }}>
                        Questions? <span style={{ background: "linear-gradient(135deg,#6C5CE7,#00D2FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Answers.</span>
                    </h2>
                    {FAQ.map((item, i) => (
                        <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${faq === i ? "rgba(108,92,231,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: 12, marginBottom: 8, transition: "border-color .3s" }}>
                            <button onClick={() => setFaq(faq === i ? null : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", background: "none", border: "none", cursor: "pointer", color: "#fff", fontWeight: 600, fontSize: "0.9rem", textAlign: "left", gap: 14 }}>
                                {item.q} <Chev open={faq === i} />
                            </button>
                            <div style={{ display: "grid", gridTemplateRows: faq === i ? "1fr" : "0fr", transition: "grid-template-rows .4s cubic-bezier(.22,1,.36,1)" }}>
                                <div style={{ overflow: "hidden" }}>
                                    <p style={{ padding: "0 18px 16px", fontSize: "0.85rem", lineHeight: 1.7, color: "rgba(255,255,255,0.5)", margin: 0 }}>{item.a}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══ FOOTER ═══ */}
            <footer style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "32px 0", textAlign: "center" }}>
                <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#fff", fontWeight: 800, fontSize: "1.05rem", marginBottom: 8 }}><Bolt /> Hustle<span style={{ background: "linear-gradient(135deg,#6C5CE7,#00D2FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span></a>
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.25)" }}>© 2026 HustleAI. All rights reserved.</p>
                <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 12 }}>
                    {[["/#pricing", "All Plans"], ["/privacy", "Privacy"], ["/terms", "Terms"]].map(([h, l]) => <a key={h} href={h} style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none", fontSize: "0.78rem" }}>{l}</a>)}
                </div>
            </footer>

            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @media (max-width: 768px) {
          section > div { grid-template-columns: 1fr !important; }
          section > div > div[style*="gridTemplateColumns"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
        </div>
    );
}
