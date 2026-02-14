"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./dashboard.module.css";

/* ── Icons ───────────────────────────── */
const SvgIcon = ({ children, ...props }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18" {...props}>{children}</svg>
);
const IconPhone = () => <SvgIcon><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.11 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></SvgIcon>;
const IconMessage = () => <SvgIcon><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></SvgIcon>;
const IconBot = () => <SvgIcon><circle cx="12" cy="8" r="3" /><path d="M12 2v3" /><rect x="3" y="13" width="18" height="8" rx="2" /><path d="M7 17h.01M12 17h.01M17 17h.01" /></SvgIcon>;

export default function DashboardPage() {
    const [stats, setStats] = useState(null);
    const [agents, setAgents] = useState(null);
    const [loading, setLoading] = useState(true);
    const [runningAgent, setRunningAgent] = useState(null);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch("/api/dashboard/stats");
            const data = await res.json();
            setStats(data);
        } catch { /* ignore */ } finally { setLoading(false); }
    }, []);

    const fetchAgents = useCallback(async () => {
        try {
            const res = await fetch("/api/agents");
            const data = await res.json();
            setAgents(data);
        } catch { /* ignore */ }
    }, []);

    // Activate autonomous scheduler on first load
    useEffect(() => {
        fetchStats(); fetchAgents();
        fetch("/api/agents/autostart").catch(() => { });
    }, [fetchStats, fetchAgents]);

    const triggerAgent = async (agentId) => {
        setRunningAgent(agentId);
        try {
            const res = await fetch("/api/agents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ agent: agentId }),
            });
            await res.json();
            // Refresh agents after run
            fetchAgents();
        } catch { /* ignore */ }
        setRunningAgent(null);
    };

    const timeAgo = (iso) => {
        if (!iso) return "Never";
        const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
        if (mins < 1) return "now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const statCards = stats ? [
        { label: "Total Leads", value: String(stats.totalLeads), change: `${stats.totalLeads} captured`, positive: true },
        { label: "Calls Answered", value: String(stats.callsAnswered), change: "AI Dispatcher active", positive: true },
        { label: "Messages Sent", value: String(stats.messagesSent), change: "SMS auto-responder", positive: true },
        { label: "Conversion Rate", value: stats.conversionRate > 0 ? `${stats.conversionRate}%` : "—", change: stats.conversionRate > 0 ? "Booked jobs" : "Start getting leads", positive: true },
    ] : [
        { label: "Total Leads", value: "—", change: "Loading...", positive: true },
        { label: "Calls Answered", value: "—", change: "Loading...", positive: true },
        { label: "Messages Sent", value: "—", change: "Loading...", positive: true },
        { label: "Conversion Rate", value: "—", change: "Loading...", positive: true },
    ];

    const STATUS_COLORS = {
        success: "#00ff88",
        running: "#00d2ff",
        failed: "#ff4b4b",
    };

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1>Dashboard</h1>
                <p>Welcome to HustleAI. Your AI business growth overview.</p>
            </div>

            <div className={styles.statsGrid}>
                {statCards.map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-label">{s.label}</div>
                        <div className="stat-value">{s.value}</div>
                        <div className={`stat-change ${s.positive ? "positive" : "negative"}`}>
                            {s.change}
                        </div>
                    </div>
                ))}
            </div>

            {/* Plan Usage Bar */}
            {stats && (
                <div className="card-flat" style={{ padding: "16px 20px", marginBottom: "var(--space-lg)", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                        <strong style={{ color: "var(--text-white)" }}>{stats.planName || "Starter"}</strong> plan
                    </span>
                    <div style={{ flex: 1, minWidth: 120 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Leads this month</span>
                            <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>
                                {stats.leadsUsed || 0}/{stats.leadsLimit === "unlimited" ? "∞" : stats.leadsLimit || 100}
                            </span>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: "var(--bg-input)", overflow: "hidden" }}>
                            <div style={{
                                height: "100%", borderRadius: 3,
                                background: "linear-gradient(90deg, var(--accent), #00ff88)",
                                width: `${Math.min(100, ((stats.leadsUsed || 0) / (typeof stats.leadsLimit === "number" ? stats.leadsLimit : 100)) * 100)}%`,
                                transition: "width 0.5s ease",
                            }} />
                        </div>
                    </div>
                    <a href="/dashboard/billing" style={{ fontSize: "0.82rem", color: "var(--accent)", textDecoration: "none", whiteSpace: "nowrap" }}>
                        Upgrade →
                    </a>
                </div>
            )}

            {/* ── AI Agents Section ── */}
            <div className={styles.recentSection} style={{ marginBottom: "var(--space-lg)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <IconBot /> AI Agents
                    </h3>
                    {agents?.stats && (
                        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            {agents.stats.totalRunsToday} runs today · {agents.stats.emailsToday} emails sent
                        </span>
                    )}
                </div>

                <div className={styles.agentsGrid}>
                    {(agents?.agents || []).map((agent) => {
                        const isRunning = runningAgent === agent.id;
                        const statusColor = agent.lastRun ? STATUS_COLORS[agent.lastRun.status] || "var(--text-muted)" : "var(--text-muted)";
                        return (
                            <div key={agent.id} className="card-flat" style={{ padding: "16px", position: "relative", overflow: "hidden" }}>
                                {/* Status dot */}
                                <div style={{
                                    position: "absolute", top: 12, right: 12,
                                    width: 8, height: 8, borderRadius: "50%",
                                    background: agent.lastRun?.status === "running" ? "#00d2ff" : statusColor,
                                    boxShadow: agent.lastRun?.status === "running" ? "0 0 8px #00d2ff" : "none",
                                    animation: agent.lastRun?.status === "running" ? "pulse 1.5s infinite" : "none",
                                }} />

                                <div style={{ fontSize: "1.2rem", marginBottom: 4 }}>{agent.icon}</div>
                                <div style={{ fontWeight: 600, fontSize: "0.88rem", marginBottom: 2 }}>{agent.name}</div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 8 }}>{agent.description}</div>

                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 8 }}>
                                    <span>Last: {timeAgo(agent.lastRun?.startedAt)}</span>
                                    <span>{agent.runsToday}x today</span>
                                </div>

                                {/* Success rate bar */}
                                {agent.successRate > 0 && (
                                    <div style={{ height: 3, borderRadius: 2, background: "var(--bg-input)", marginBottom: 8 }}>
                                        <div style={{
                                            height: "100%", borderRadius: 2,
                                            background: agent.successRate > 80 ? "#00ff88" : agent.successRate > 50 ? "#ffbb00" : "#ff4b4b",
                                            width: `${agent.successRate}%`,
                                        }} />
                                    </div>
                                )}

                                <button
                                    onClick={() => triggerAgent(agent.id)}
                                    disabled={isRunning}
                                    className="btn btn-sm"
                                    style={{
                                        width: "100%", padding: "6px 12px", fontSize: "0.75rem",
                                        background: isRunning ? "var(--bg-input)" : "rgba(0, 210, 255, 0.1)",
                                        color: isRunning ? "var(--text-muted)" : "var(--accent)",
                                        border: "1px solid rgba(0, 210, 255, 0.15)",
                                        borderRadius: 6, cursor: isRunning ? "wait" : "pointer",
                                    }}
                                >
                                    {isRunning ? "Running..." : agent.interval === "manual" ? "Run Now" : `Run (${agent.interval})`}
                                </button>
                            </div>
                        );
                    })}

                    {!agents && (
                        <div className="card-flat" style={{ padding: "32px", textAlign: "center", gridColumn: "1 / -1" }}>
                            <p style={{ color: "var(--text-muted)" }}>Loading agents...</p>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.recentSection}>
                <h3>Recent Activity</h3>
                {loading ? (
                    <div className="card-flat" style={{ padding: "48px", textAlign: "center" }}>
                        <p style={{ color: "var(--text-muted)" }}>Loading activity...</p>
                    </div>
                ) : stats?.recentActivity?.length > 0 ? (
                    <div className={styles.activityList}>
                        {stats.recentActivity.map((item, i) => (
                            <a
                                key={i}
                                href={item.type === "call" ? "/dashboard/calls" : "/dashboard/messages"}
                                className={styles.activityItem}
                            >
                                <div
                                    className={styles.activityIcon}
                                    style={{
                                        background: item.type === "call"
                                            ? "rgba(108, 92, 231, 0.12)"
                                            : "rgba(0, 210, 255, 0.12)",
                                    }}
                                >
                                    {item.type === "call" ? <IconPhone /> : <IconMessage />}
                                </div>
                                <div className={styles.activityInfo}>
                                    <div className={styles.activityTitle}>{item.title}</div>
                                    <div className={styles.activityMeta}>{item.meta}</div>
                                </div>
                                <div className={styles.activityTime}>{timeAgo(item.time)}</div>
                            </a>
                        ))}
                    </div>
                ) : (
                    <div className="card-flat" style={{ padding: "48px", textAlign: "center" }}>
                        <div style={{ marginBottom: "16px" }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="48" height="48"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 3 0 3 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-3 0-3" /></svg>
                        </div>
                        <h4>Complete your setup</h4>
                        <p style={{ maxWidth: "400px", margin: "8px auto 24px", fontSize: "0.9rem" }}>
                            Finish the onboarding wizard to connect your phone, Yelp, Thumbtack, and Google accounts.
                        </p>
                        <a href="/dashboard/onboarding" className="btn btn-primary">
                            Start Setup Wizard →
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
