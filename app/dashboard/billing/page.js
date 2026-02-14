"use client";

import { useState, useEffect } from "react";
import styles from "../dashboard.module.css";

const PLANS = [
    {
        id: "invoice", name: "AI Invoice", price: "$29",
        features: ["Unlimited AI invoices", "4 premium templates", "AI auto-fill", "US-style receipts", "2.9% processing fee"],
    },
    {
        id: "starter", name: "Starter", price: "$49",
        features: ["50 leads/mo", "SMS + Voice AI", "1 AI phone number", "24/7 answering", "Basic analytics"],
    },
    {
        id: "professional", name: "Professional", price: "$99", popular: true,
        features: ["250 leads/mo", "SMS + Voice AI", "All integrations", "Custom AI scripts", "5 team members", "AI Invoicing"],
    },
    {
        id: "business", name: "Business", price: "$199",
        features: ["Unlimited leads", "5 phone numbers", "API access", "White-label branding", "Unlimited team", "AI Invoicing"],
    },
];

export default function BillingPage() {
    const [sub, setSub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [upgrading, setUpgrading] = useState(null);

    useEffect(() => {
        fetch("/api/subscription")
            .then((r) => r.json())
            .then(setSub)
            .catch(() => setSub({ plan: "starter", planName: "Starter", status: "active", price: "$49", leadsUsed: 0, leadsLimit: 100 }))
            .finally(() => setLoading(false));
    }, []);

    const handleUpgrade = async (planId) => {
        setUpgrading(planId);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planName: planId, interval: "month" }),
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
            else alert(data.error || "Failed to create checkout session");
        } catch (err) {
            console.error("Upgrade error:", err);
            alert("Failed to start upgrade. Please try again.");
        } finally {
            setUpgrading(null);
        }
    };

    const handleManageBilling = async () => {
        if (!sub?.stripeCustomerId) {
            alert("No Stripe customer linked yet. Complete a payment first.");
            return;
        }
        try {
            const res = await fetch("/api/stripe/billing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ customerId: sub.stripeCustomerId }),
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch (err) {
            console.error("Billing portal error:", err);
        }
    };

    if (loading) {
        return (
            <div>
                <div className={styles.pageHeader}>
                    <h1>Billing & Subscription</h1>
                    <p>Manage your plan, payment method, and invoices.</p>
                </div>
                <div className="card-flat" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                    Loading subscription...
                </div>
            </div>
        );
    }

    const statusColors = {
        active: "badge-success",
        trialing: "badge-warning",
        past_due: "badge-error",
        canceled: "badge-error",
    };
    const statusLabels = {
        active: "Active",
        trialing: "Trial",
        past_due: "Past Due",
        canceled: "Cancelled",
    };
    const usagePercent = sub?.leadsLimit > 0 ? Math.min(100, Math.round((sub.leadsUsed / sub.leadsLimit) * 100)) : 0;

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1>Billing & Subscription</h1>
                <p>Manage your plan, payment method, and invoices.</p>
            </div>

            <div style={{ display: "grid", gap: 24 }}>
                {/* Current Plan */}
                <div className="card-flat" style={{ padding: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                                <h3 style={{ margin: 0, color: "var(--text-white)" }}>{sub?.planName || "Starter"} Plan</h3>
                                <span className={`badge ${statusColors[sub?.status] || "badge-success"}`}>
                                    {statusLabels[sub?.status] || sub?.status}
                                </span>
                            </div>
                            <p style={{ color: "var(--text-muted)", margin: 0 }}>
                                {sub?.price}/{sub?.interval === "year" ? "yr" : "mo"}
                                {sub?.status === "trialing" && sub?.trialEnd
                                    ? ` · Free trial ends ${new Date(sub.trialEnd).toLocaleDateString()}`
                                    : sub?.currentPeriodEnd
                                        ? ` · Next billing ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
                                        : ""}
                            </p>
                        </div>
                        {sub?.stripeCustomerId && (
                            <button className="btn btn-secondary btn-sm" onClick={handleManageBilling}>
                                Manage Billing →
                            </button>
                        )}
                    </div>

                    {/* Usage Bar */}
                    <div style={{ marginTop: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: 6 }}>
                            <span style={{ color: "var(--text-muted)" }}>Leads this period</span>
                            <span style={{ color: "var(--text-white)", fontWeight: 600 }}>
                                {sub?.leadsUsed || 0}/{sub?.leadsLimit === 999999 ? "∞" : sub?.leadsLimit || 100}
                            </span>
                        </div>
                        <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                            <div style={{
                                height: "100%", borderRadius: 4, transition: "width 0.5s ease",
                                width: `${usagePercent}%`,
                                background: usagePercent > 90
                                    ? "linear-gradient(90deg, #ef4444, #f97316)"
                                    : usagePercent > 70
                                        ? "linear-gradient(90deg, #f59e0b, #eab308)"
                                        : "linear-gradient(90deg, #6C5CE7, #a855f7)",
                            }} />
                        </div>
                    </div>
                </div>

                {/* Plan Comparison */}
                <div className="card-flat" style={{ padding: 24 }}>
                    <h3 style={{ color: "var(--text-white)", marginBottom: 16 }}>Available Plans</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                        {PLANS.map((plan) => {
                            const isCurrent = sub?.plan === plan.id;
                            return (
                                <div key={plan.id} style={{
                                    padding: 20, borderRadius: 12, position: "relative",
                                    border: isCurrent ? "1px solid var(--primary)" : "1px solid var(--glass-border)",
                                    background: isCurrent ? "rgba(108, 92, 231, 0.08)" : "var(--glass-bg)",
                                }}>
                                    {isCurrent && (
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
                                    {isCurrent ? (
                                        <button className="btn btn-secondary btn-sm" style={{ width: "100%", opacity: 0.5 }} disabled>
                                            Current Plan
                                        </button>
                                    ) : (
                                        <button
                                            className={`btn ${plan.id === "business" ? "btn-accent" : "btn-primary"} btn-sm`}
                                            style={{ width: "100%" }}
                                            onClick={() => handleUpgrade(plan.id)}
                                            disabled={upgrading !== null}
                                        >
                                            {upgrading === plan.id ? "Redirecting..." : "Switch Plan"}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Payment Method */}
                <div className="card-flat" style={{ padding: 24 }}>
                    <h3 style={{ color: "var(--text-white)", marginBottom: 16 }}>Payment Method</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: 10, background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}>
                        <svg width="40" height="26" viewBox="0 0 40 26" fill="none">
                            <rect width="40" height="26" rx="4" fill="#1A1F36" />
                            <rect x="4" y="8" width="12" height="9" rx="1.5" fill="#6C5CE7" opacity="0.7" />
                            <rect x="12" y="8" width="12" height="9" rx="1.5" fill="#A855F7" opacity="0.5" />
                        </svg>
                        <div>
                            <div style={{ color: "var(--text-white)", fontWeight: 600, fontSize: "0.9rem" }}>
                                {sub?.stripeCustomerId ? "Card on file via Stripe" : "No card on file"}
                            </div>
                            <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                                {sub?.stripeCustomerId
                                    ? "Manage via billing portal"
                                    : sub?.status === "trialing"
                                        ? "Card will be saved after trial ends"
                                        : "Add a payment method to upgrade"
                                }
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
                        <p style={{ margin: 0 }}>
                            {sub?.status === "trialing"
                                ? "No invoices yet — your free trial is active."
                                : "Invoice history will appear here after your first payment."
                            }
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
