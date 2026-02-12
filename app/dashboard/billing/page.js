"use client";

import { useState } from "react";
import styles from "../dashboard.module.css";

export default function BillingPage() {
    const [loading, setLoading] = useState(null);

    // Demo subscription data — will be fetched from DB in production
    const subscription = {
        plan: "Professional",
        status: "trialing",
        interval: "month",
        price: "$29.99",
        trialEnd: "Feb 17, 2026",
        nextBilling: "$29.99 on Feb 17, 2026",
    };

    const handleUpgrade = async (planName) => {
        setLoading(planName);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planName, interval: "month" }),
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch (err) {
            console.error("Upgrade error:", err);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1>Billing & Subscription</h1>
                <p>Manage your plan, payment method, and invoices.</p>
            </div>

            {/* Current Plan */}
            <div style={{ display: "grid", gap: 24 }}>
                <div className="card-flat" style={{ padding: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                                <h3 style={{ margin: 0, color: "var(--text-white)" }}>{subscription.plan} Plan</h3>
                                <span className={`badge ${subscription.status === "active" ? "badge-success" : "badge-warning"}`}>
                                    {subscription.status === "trialing" ? "Trial" : subscription.status}
                                </span>
                            </div>
                            <p style={{ color: "var(--text-muted)", margin: 0 }}>
                                {subscription.price}/mo · {subscription.status === "trialing"
                                    ? `Free trial ends ${subscription.trialEnd}`
                                    : `Next billing: ${subscription.nextBilling}`
                                }
                            </p>
                        </div>
                    </div>
                </div>

                {/* Plan Comparison */}
                <div className="card-flat" style={{ padding: 24 }}>
                    <h3 style={{ color: "var(--text-white)", marginBottom: 16 }}>Available Plans</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                        {[
                            { name: "Starter", price: "$19.99", features: ["50 leads/mo", "SMS auto-responder", "1 AI phone number", "Basic dashboard"] },
                            { name: "Professional", price: "$29.99", popular: true, features: ["300 leads/mo", "SMS + Voice AI", "All integrations", "Custom AI scripts", "3 team members"] },
                            { name: "Business", price: "$49.99", features: ["Unlimited leads", "3 phone numbers", "API access", "White-label", "Unlimited team"] },
                        ].map((plan) => (
                            <div key={plan.name} style={{
                                padding: 20,
                                borderRadius: 12,
                                border: plan.popular ? "1px solid var(--primary)" : "1px solid var(--glass-border)",
                                background: plan.popular ? "rgba(108, 92, 231, 0.08)" : "var(--glass-bg)",
                                position: "relative",
                            }}>
                                {plan.popular && (
                                    <div style={{
                                        position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                                        background: "var(--primary)", color: "white", fontSize: "0.7rem",
                                        padding: "2px 10px", borderRadius: 20, fontWeight: 600,
                                    }}>Current</div>
                                )}
                                <div style={{ fontWeight: 700, color: "var(--text-white)", marginBottom: 4 }}>{plan.name}</div>
                                <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--primary-light)", marginBottom: 12 }}>
                                    {plan.price}<span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>/mo</span>
                                </div>
                                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 16px", display: "grid", gap: 6 }}>
                                    {plan.features.map((f, i) => (
                                        <li key={i} style={{ fontSize: "0.82rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                {plan.name === subscription.plan ? (
                                    <button className="btn btn-secondary btn-sm" style={{ width: "100%", opacity: 0.5 }} disabled>
                                        Current Plan
                                    </button>
                                ) : (
                                    <button
                                        className={`btn ${plan.name === "Business" ? "btn-accent" : "btn-secondary"} btn-sm`}
                                        style={{ width: "100%" }}
                                        onClick={() => handleUpgrade(plan.name)}
                                        disabled={loading !== null}
                                    >
                                        {loading === plan.name ? "Loading..." : "Switch Plan"}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment Method */}
                <div className="card-flat" style={{ padding: 24 }}>
                    <h3 style={{ color: "var(--text-white)", marginBottom: 16 }}>Payment Method</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: 10, background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
                        <svg width="40" height="26" viewBox="0 0 40 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="40" height="26" rx="4" fill="#1A1F36" />
                            <rect x="4" y="8" width="12" height="9" rx="1.5" fill="#6C5CE7" opacity="0.7" />
                            <rect x="12" y="8" width="12" height="9" rx="1.5" fill="#A855F7" opacity="0.5" />
                        </svg>
                        <div>
                            <div style={{ color: "var(--text-white)", fontWeight: 600, fontSize: "0.9rem" }}>
                                No card on file
                            </div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                                Card will be saved after trial ends
                            </div>
                        </div>
                    </div>
                </div>

                {/* Invoice History */}
                <div className="card-flat" style={{ padding: 24 }}>
                    <h3 style={{ color: "var(--text-white)", marginBottom: 16 }}>Invoice History</h3>
                    <div style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: 8 }}>
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" />
                        </svg>
                        <p style={{ margin: 0 }}>No invoices yet — your free trial is active.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
