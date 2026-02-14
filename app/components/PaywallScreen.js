"use client";

import { useState } from "react";

/* ─────────────────────────────────────────────
   Paywall Screen
   Shown to new users who don't have an active subscription.
   They must choose a plan to proceed.
   ───────────────────────────────────────────── */

const PLANS = [
    {
        id: "invoice",
        name: "AI Invoice",
        price: "$29",
        leads: "—",
        features: ["Unlimited AI invoices", "4 premium templates", "AI auto-fill", "Client payment portal", "2.9% processing fee"],
    },
    {
        id: "starter",
        name: "Starter",
        price: "$49",
        leads: "50",
        features: ["AI Voice Receptionist", "SMS Auto-Responder", "Lead Dashboard", "1 AI phone number", "Basic Analytics"],
    },
    {
        id: "professional",
        name: "Professional",
        price: "$99",
        leads: "250",
        popular: true,
        features: ["Everything in Starter", "Custom AI Scripts", "All integrations", "2 Phone Numbers", "5 Team Members", "AI Invoicing"],
    },
    {
        id: "business",
        name: "Business",
        price: "$199",
        leads: "Unlimited",
        features: ["Everything in Professional", "Voice Cloning", "White-Label", "API Access", "Unlimited Team"],
    },
];

export default function PaywallScreen() {
    const [loading, setLoading] = useState(null);

    const handleSelectPlan = async (plan) => {
        setLoading(plan.id);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planName: plan.id, interval: "month" }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert(data.error || "Payment error. Please try again.");
                setLoading(null);
            }
        } catch {
            alert("Connection error. Please try again.");
            setLoading(null);
        }
    };

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 9998,
            background: "linear-gradient(180deg, #0a0a1a 0%, #12122a 100%)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "24px 16px",
            overflowY: "auto",
        }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "32px", maxWidth: "480px" }}>
                <div style={{
                    width: "56px", height: "56px", borderRadius: "16px",
                    background: "linear-gradient(135deg, #6C5CE7, #00d2ff)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px",
                }}>
                    <img src="/app-icon.png" alt="" style={{ width: 36, height: 36, borderRadius: 8 }} />
                </div>
                <h1 style={{
                    fontSize: "1.6rem", fontWeight: 800, color: "#fff",
                    marginBottom: "8px",
                }}>
                    Choose Your Plan
                </h1>
                <p style={{ fontSize: "0.9rem", color: "#a0a0b8", lineHeight: 1.5 }}>
                    Start your <strong style={{ color: "#00d2ff" }}>3-day free trial</strong> — no credit card required.
                    Cancel anytime.
                </p>
            </div>

            {/* Plans */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
                width: "100%",
                maxWidth: "1000px",
            }}>
                {PLANS.map((plan) => (
                    <div key={plan.id} style={{
                        background: plan.popular
                            ? "linear-gradient(135deg, rgba(108, 92, 231, 0.15), rgba(0, 210, 255, 0.08))"
                            : "rgba(255,255,255,0.03)",
                        border: `1px solid ${plan.popular ? "rgba(108, 92, 231, 0.4)" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: "16px",
                        padding: "24px 20px",
                        position: "relative",
                        transition: "transform 0.2s ease, border-color 0.2s ease",
                    }}>
                        {plan.popular && (
                            <span style={{
                                position: "absolute", top: "-10px", right: "16px",
                                background: "linear-gradient(135deg, #6C5CE7, #00d2ff)",
                                color: "#fff", fontSize: "0.7rem", fontWeight: 700,
                                padding: "3px 12px", borderRadius: "99px",
                            }}>
                                Most Popular
                            </span>
                        )}

                        <h3 style={{ color: "#fff", fontSize: "1.05rem", fontWeight: 700, marginBottom: "4px" }}>
                            {plan.name}
                        </h3>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "4px" }}>
                            <span style={{
                                fontSize: "1.8rem", fontWeight: 800,
                                color: plan.popular ? "#00d2ff" : "#fff",
                            }}>
                                {plan.price}
                            </span>
                            <span style={{ fontSize: "0.85rem", color: "#6b6b80" }}>/month</span>
                        </div>
                        {plan.leads !== "—" && (
                            <p style={{ fontSize: "0.8rem", color: "#6b6b80", marginBottom: "14px" }}>
                                {plan.leads} leads/mo
                            </p>
                        )}
                        {plan.leads === "—" && (
                            <p style={{ fontSize: "0.8rem", color: "#6b6b80", marginBottom: "14px" }}>
                                Invoicing only
                            </p>
                        )}

                        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px 0" }}>
                            {plan.features.map((f, i) => (
                                <li key={i} style={{
                                    fontSize: "0.82rem", color: "#c0c0d0",
                                    padding: "4px 0", display: "flex", alignItems: "center", gap: "8px",
                                }}>
                                    <span style={{ color: "#00d2ff", fontSize: "0.75rem" }}>✓</span>
                                    {f}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleSelectPlan(plan)}
                            disabled={loading === plan.id}
                            style={{
                                width: "100%", padding: "12px",
                                borderRadius: "10px", border: "none",
                                fontWeight: 700, fontSize: "0.88rem",
                                cursor: loading ? "wait" : "pointer",
                                background: plan.popular
                                    ? "linear-gradient(135deg, #6C5CE7, #7C3AED)"
                                    : "rgba(255,255,255,0.08)",
                                color: plan.popular ? "#fff" : "#c0c0d0",
                                transition: "all 0.2s ease",
                            }}
                        >
                            {loading === plan.id ? "Redirecting..." : "Start 3-Day Free Trial"}
                        </button>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <p style={{
                marginTop: "24px", fontSize: "0.75rem",
                color: "#6b6b80", textAlign: "center",
            }}>
                No credit card required · Cancel anytime · Secure checkout via Stripe
            </p>
        </div>
    );
}
