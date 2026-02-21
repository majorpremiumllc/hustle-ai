"use client";

import { useState, useEffect, useCallback } from "react";

export default function CEOCommandCenter() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [overrideLoading, setOverrideLoading] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/ceo", {
                headers: { "X-Api-Key": localStorage.getItem("admin_key") || "" },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            setData(json);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // refresh every 15s
        return () => clearInterval(interval);
    }, [fetchData]);

    const applyOverride = async (action, companyId, value) => {
        setOverrideLoading(action + companyId);
        try {
            await fetch("/api/admin/ceo", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-Api-Key": localStorage.getItem("admin_key") || "",
                },
                body: JSON.stringify({ action, companyId, value }),
            });
            await fetchData();
        } catch (err) {
            alert(`Override failed: ${err.message}`);
        } finally {
            setOverrideLoading(null);
        }
    };

    if (loading) return <LoadingScreen />;
    if (error) return <ErrorScreen error={error} />;

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <h1 style={styles.title}>CEO Command Center</h1>
                    <span style={styles.badge}>LIVE</span>
                </div>
                <div style={styles.headerRight}>
                    <span style={styles.timestamp}>{new Date().toLocaleTimeString()}</span>
                    <button onClick={fetchData} style={styles.refreshBtn}>↻ Refresh</button>
                </div>
            </header>

            <nav style={styles.nav}>
                {["overview", "clients", "feed", "risks", "overrides"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            ...styles.navBtn,
                            ...(activeTab === tab ? styles.navBtnActive : {}),
                        }}
                    >
                        {tab === "overview" && "📊 Overview"}
                        {tab === "clients" && "👥 Clients"}
                        {tab === "feed" && "📡 Live Feed"}
                        {tab === "risks" && `⚠️ Risks ${data.riskMonitor.alerts.length > 0 ? `(${data.riskMonitor.alerts.length})` : ""}`}
                        {tab === "overrides" && "🎛 Overrides"}
                    </button>
                ))}
            </nav>

            <main style={styles.main}>
                {activeTab === "overview" && <OverviewSection data={data} />}
                {activeTab === "clients" && <ClientGrid clients={data.clientGrid} onOverride={applyOverride} overrideLoading={overrideLoading} />}
                {activeTab === "feed" && <LiveFeed feed={data.liveFeed} />}
                {activeTab === "risks" && <RiskMonitor monitor={data.riskMonitor} />}
                {activeTab === "overrides" && <OverridePanel overrides={data.overrides} clients={data.clientGrid} onOverride={applyOverride} overrideLoading={overrideLoading} />}
            </main>
        </div>
    );
}

// ════════════════════════════════════
// SECTION: OVERVIEW METRICS
// ════════════════════════════════════
function OverviewSection({ data }) {
    const { overview, riskMonitor } = data;
    const metrics = [
        { label: "Total Clients", value: overview.clients.total, sub: `${overview.clients.active} active`, color: "#6366f1" },
        { label: "Active Subscriptions", value: overview.subscriptions.active, sub: "paying/trial", color: "#10b981" },
        { label: "Total Leads", value: overview.leads.total, sub: `+${overview.leads.thisWeek} this week`, color: "#f59e0b" },
        { label: "Messages", value: overview.messages.total, sub: `+${overview.messages.thisWeek} this week`, color: "#3b82f6" },
        { label: "Calls", value: overview.calls.total, sub: "all time", color: "#8b5cf6" },
        { label: "Alerts", value: riskMonitor.alerts.length, sub: riskMonitor.alerts.length === 0 ? "all clear" : "action needed", color: riskMonitor.alerts.length > 0 ? "#ef4444" : "#10b981" },
    ];

    return (
        <div>
            <div style={styles.metricsGrid}>
                {metrics.map((m) => (
                    <div key={m.label} style={{ ...styles.metricCard, borderLeft: `4px solid ${m.color}` }}>
                        <div style={styles.metricValue}>{m.value}</div>
                        <div style={styles.metricLabel}>{m.label}</div>
                        <div style={styles.metricSub}>{m.sub}</div>
                    </div>
                ))}
            </div>

            <div style={styles.systemHealth}>
                <h3 style={styles.sectionTitle}>System Health</h3>
                <div style={styles.healthGrid}>
                    {Object.entries(riskMonitor.systemHealth).map(([key, status]) => (
                        <div key={key} style={styles.healthItem}>
                            <span style={{ ...styles.healthDot, background: status === "ok" ? "#10b981" : "#ef4444" }} />
                            <span style={styles.healthLabel}>{key}</span>
                            <span style={styles.healthStatus}>{status}</span>
                        </div>
                    ))}
                    <div style={styles.healthItem}>
                        <span style={{ ...styles.healthDot, background: "#10b981" }} />
                        <span style={styles.healthLabel}>gateway</span>
                        <span style={styles.healthStatus}>{riskMonitor.gateway.projectThrottle.remaining}/{riskMonitor.gateway.projectThrottle.limit} remaining</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ════════════════════════════════════
// SECTION: CLIENT GRID
// ════════════════════════════════════
function ClientGrid({ clients, onOverride, overrideLoading }) {
    if (clients.length === 0) {
        return <div style={styles.emptyState}>No clients onboarded yet.</div>;
    }

    return (
        <div style={styles.tableContainer}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Client</th>
                        <th style={styles.th}>Plan</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Phone</th>
                        <th style={styles.th}>10DLC</th>
                        <th style={styles.th}>Leads</th>
                        <th style={styles.th}>Messages</th>
                        <th style={styles.th}>AI</th>
                        <th style={styles.th}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {clients.map((c) => (
                        <tr key={c.id} style={styles.tr}>
                            <td style={styles.td}>
                                <div style={styles.clientName}>{c.name}</div>
                                <div style={styles.clientIndustry}>{c.industry}</div>
                            </td>
                            <td style={styles.td}>
                                <span style={{ ...styles.planBadge, background: getPlanColor(c.subscription.plan) }}>
                                    {c.subscription.plan}
                                </span>
                            </td>
                            <td style={styles.td}>
                                <span style={{ ...styles.statusBadge, background: getStatusColor(c.subscription.status) }}>
                                    {c.subscription.status}
                                </span>
                            </td>
                            <td style={styles.td}>{c.phone || "—"}</td>
                            <td style={styles.td}>
                                <span style={{ ...styles.dlcBadge, background: getDlcColor(c.health.tenDlc) }}>
                                    {c.health.tenDlc}
                                </span>
                            </td>
                            <td style={{ ...styles.td, ...styles.tdCenter }}>{c.stats.leads}</td>
                            <td style={{ ...styles.td, ...styles.tdCenter }}>{c.stats.messages}</td>
                            <td style={styles.td}>
                                <span style={{ ...styles.healthDot, background: c.health.aiActive ? "#10b981" : "#ef4444" }} />
                            </td>
                            <td style={styles.td}>
                                <div style={styles.actionBtns}>
                                    <button
                                        onClick={() => onOverride("pause_ai", c.id, !c.health.aiActive)}
                                        style={{ ...styles.actionBtn, background: c.health.aiActive ? "#f59e0b33" : "#10b98133" }}
                                        disabled={overrideLoading === "pause_ai" + c.id}
                                    >
                                        {c.health.aiActive ? "⏸" : "▶"}
                                    </button>
                                    <button
                                        onClick={() => onOverride("disable_outbound", c.id, c.health.smsEnabled)}
                                        style={{ ...styles.actionBtn, background: c.health.smsEnabled ? "#ef444433" : "#10b98133" }}
                                        disabled={overrideLoading === "disable_outbound" + c.id}
                                    >
                                        {c.health.smsEnabled ? "📵" : "📱"}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ════════════════════════════════════
// SECTION: LIVE FEED
// ════════════════════════════════════
function LiveFeed({ feed }) {
    return (
        <div style={styles.feedContainer}>
            <div style={styles.feedColumn}>
                <h3 style={styles.sectionTitle}>💬 Recent Messages</h3>
                {feed.messages.length === 0 && <div style={styles.emptyState}>No messages yet</div>}
                {feed.messages.map((m) => (
                    <div key={m.id} style={styles.feedCard}>
                        <div style={styles.feedHeader}>
                            <span style={styles.feedClient}>{m.client}</span>
                            <span style={styles.feedTime}>{timeAgo(m.time)}</span>
                        </div>
                        <div style={styles.feedCustomer}>📱 {m.customer}</div>
                        <div style={styles.feedMessage}>
                            <span style={styles.feedLabel}>In:</span> {m.lastMessage || "—"}
                        </div>
                        {m.aiReply && (
                            <div style={styles.feedReply}>
                                <span style={styles.feedLabel}>AI:</span> {m.aiReply}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div style={styles.feedColumn}>
                <h3 style={styles.sectionTitle}>🎯 Recent Leads</h3>
                {feed.leads.length === 0 && <div style={styles.emptyState}>No leads yet</div>}
                {feed.leads.map((l) => (
                    <div key={l.id} style={styles.feedCard}>
                        <div style={styles.feedHeader}>
                            <span style={styles.feedClient}>{l.client}</span>
                            <span style={styles.feedTime}>{timeAgo(l.time)}</span>
                        </div>
                        <div style={styles.feedCustomer}>{l.name || "Anonymous"} · {l.phone}</div>
                        <div style={styles.feedMessage}>Source: {l.source || "sms"}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ════════════════════════════════════
// SECTION: RISK MONITOR
// ════════════════════════════════════
function RiskMonitor({ monitor }) {
    return (
        <div>
            <h3 style={styles.sectionTitle}>Active Alerts</h3>
            {monitor.alerts.length === 0 && (
                <div style={{ ...styles.emptyState, color: "#10b981" }}>✅ No active alerts — all systems nominal</div>
            )}
            {monitor.alerts.map((alert, i) => (
                <div key={i} style={{ ...styles.alertCard, borderLeft: `4px solid ${alert.level === "critical" ? "#ef4444" : "#f59e0b"}` }}>
                    <span style={styles.alertLevel}>{alert.level === "critical" ? "🔴" : "🟡"} {alert.level.toUpperCase()}</span>
                    <span style={styles.alertType}>{alert.type}</span>
                    <span style={styles.alertMsg}>{alert.message}</span>
                </div>
            ))}

            <h3 style={{ ...styles.sectionTitle, marginTop: 32 }}>Gateway Status</h3>
            <div style={styles.gatewayGrid}>
                <div style={styles.gatewayCard}>
                    <div style={styles.gatewayLabel}>Project Throttle</div>
                    <div style={styles.gatewayBar}>
                        <div style={{
                            ...styles.gatewayFill,
                            width: `${(monitor.gateway.projectThrottle.used / monitor.gateway.projectThrottle.limit) * 100}%`,
                            background: monitor.gateway.projectThrottle.remaining < 10 ? "#ef4444" : "#10b981",
                        }} />
                    </div>
                    <div style={styles.gatewayStat}>{monitor.gateway.projectThrottle.used} / {monitor.gateway.projectThrottle.limit} per minute</div>
                </div>
                <div style={styles.gatewayCard}>
                    <div style={styles.gatewayLabel}>Namespace Cache</div>
                    <div style={styles.gatewayStat}>{monitor.gateway.namespaceCacheSize} numbers cached</div>
                </div>
            </div>

            <h3 style={{ ...styles.sectionTitle, marginTop: 32 }}>System Health</h3>
            <div style={styles.healthGrid}>
                {Object.entries(monitor.systemHealth).map(([key, val]) => (
                    <div key={key} style={styles.healthItem}>
                        <span style={{ ...styles.healthDot, background: val === "ok" ? "#10b981" : "#ef4444" }} />
                        <span style={styles.healthLabel}>{key}</span>
                        <span style={styles.healthStatus}>{val}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ════════════════════════════════════
// SECTION: OVERRIDE PANEL
// ════════════════════════════════════
function OverridePanel({ overrides, clients, onOverride, overrideLoading }) {
    return (
        <div>
            <h3 style={styles.sectionTitle}>Available Overrides</h3>
            <div style={styles.overrideGrid}>
                {overrides.available.map((o) => (
                    <div key={o.action} style={styles.overrideCard}>
                        <div style={styles.overrideAction}>{o.action}</div>
                        <div style={styles.overrideDesc}>{o.description}</div>
                    </div>
                ))}
            </div>

            <h3 style={{ ...styles.sectionTitle, marginTop: 32 }}>Quick Actions</h3>
            {clients.map((c) => (
                <div key={c.id} style={styles.overrideRow}>
                    <span style={styles.overrideClient}>{c.name}</span>
                    <div style={styles.actionBtns}>
                        <button
                            onClick={() => onOverride("pause_ai", c.id)}
                            style={styles.overrideBtn}
                            disabled={overrideLoading}
                        >
                            ⏸ Pause AI
                        </button>
                        <button
                            onClick={() => onOverride("disable_outbound", c.id)}
                            style={{ ...styles.overrideBtn, background: "#ef444422" }}
                            disabled={overrideLoading}
                        >
                            📵 Disable SMS
                        </button>
                        <button
                            onClick={() => onOverride("disable_client", c.id)}
                            style={{ ...styles.overrideBtn, background: "#ef444444" }}
                            disabled={overrideLoading}
                        >
                            ⛔ Disable Client
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ════════════════════════════════════
// HELPERS
// ════════════════════════════════════
function LoadingScreen() {
    return (
        <div style={{ ...styles.container, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
                <div style={{ color: "#a1a1aa", fontSize: 16 }}>Loading Command Center...</div>
            </div>
        </div>
    );
}

function ErrorScreen({ error }) {
    return (
        <div style={{ ...styles.container, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
            <div style={{ textAlign: "center", maxWidth: 400 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
                <h2 style={{ color: "#f4f4f5", marginBottom: 8 }}>Access Denied</h2>
                <p style={{ color: "#a1a1aa", fontSize: 14, marginBottom: 16 }}>{error}</p>
                <p style={{ color: "#71717a", fontSize: 12 }}>Set admin key: <code>localStorage.setItem("admin_key", "your-key")</code></p>
            </div>
        </div>
    );
}

function timeAgo(date) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function getPlanColor(plan) {
    const colors = { starter: "#6366f144", professional: "#3b82f644", business: "#10b98144", none: "#71717a44" };
    return colors[plan] || colors.none;
}

function getStatusColor(status) {
    const colors = { active: "#10b98144", trialing: "#6366f144", past_due: "#f59e0b44", canceled: "#ef444444", none: "#71717a44" };
    return colors[status] || colors.none;
}

function getDlcColor(status) {
    const colors = { approved: "#10b98133", pending: "#f59e0b33", "not-registered": "#ef444433", "no-number": "#71717a33", rejected: "#ef444444", unknown: "#71717a33" };
    return colors[status] || colors.unknown;
}

// ════════════════════════════════════
// STYLES
// ════════════════════════════════════
const styles = {
    container: { background: "#09090b", minHeight: "100vh", color: "#f4f4f5", fontFamily: "'Inter', -apple-system, sans-serif", padding: "24px 32px" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid #27272a", paddingBottom: 20 },
    headerLeft: { display: "flex", alignItems: "center", gap: 12 },
    headerRight: { display: "flex", alignItems: "center", gap: 16 },
    title: { fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.5px" },
    badge: { background: "#10b981", color: "#000", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, letterSpacing: 1 },
    timestamp: { color: "#71717a", fontSize: 13 },
    refreshBtn: { background: "#27272a", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 13 },

    nav: { display: "flex", gap: 4, marginBottom: 28, background: "#18181b", borderRadius: 10, padding: 4 },
    navBtn: { background: "transparent", color: "#a1a1aa", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 14, fontWeight: 500, transition: "all 0.15s" },
    navBtnActive: { background: "#27272a", color: "#f4f4f5" },

    main: { maxWidth: 1400 },

    metricsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 32 },
    metricCard: { background: "#18181b", borderRadius: 12, padding: 20 },
    metricValue: { fontSize: 36, fontWeight: 700, lineHeight: 1 },
    metricLabel: { fontSize: 13, color: "#a1a1aa", marginTop: 8, fontWeight: 500 },
    metricSub: { fontSize: 12, color: "#71717a", marginTop: 4 },

    systemHealth: { background: "#18181b", borderRadius: 12, padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#e4e4e7" },
    healthGrid: { display: "flex", flexWrap: "wrap", gap: 16 },
    healthItem: { display: "flex", alignItems: "center", gap: 8, background: "#09090b", borderRadius: 8, padding: "8px 14px" },
    healthDot: { width: 8, height: 8, borderRadius: "50%", display: "inline-block", flexShrink: 0 },
    healthLabel: { fontSize: 13, color: "#a1a1aa", textTransform: "capitalize" },
    healthStatus: { fontSize: 12, color: "#71717a" },

    tableContainer: { overflowX: "auto" },
    table: { width: "100%", borderCollapse: "collapse" },
    th: { textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#71717a", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #27272a" },
    tr: { borderBottom: "1px solid #1c1c1e" },
    td: { padding: "14px 16px", fontSize: 14 },
    tdCenter: { textAlign: "center" },
    clientName: { fontWeight: 600, color: "#f4f4f5" },
    clientIndustry: { fontSize: 12, color: "#71717a", marginTop: 2 },
    planBadge: { padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, textTransform: "uppercase" },
    statusBadge: { padding: "3px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500 },
    dlcBadge: { padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500 },

    actionBtns: { display: "flex", gap: 6 },
    actionBtn: { border: "1px solid #3f3f46", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 14, color: "#f4f4f5" },

    feedContainer: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
    feedColumn: {},
    feedCard: { background: "#18181b", borderRadius: 10, padding: 16, marginBottom: 10, border: "1px solid #27272a" },
    feedHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    feedClient: { fontWeight: 600, fontSize: 13, color: "#a78bfa" },
    feedTime: { fontSize: 11, color: "#71717a" },
    feedCustomer: { fontSize: 13, color: "#a1a1aa", marginBottom: 6 },
    feedMessage: { fontSize: 13, color: "#d4d4d8", lineHeight: 1.4 },
    feedReply: { fontSize: 13, color: "#6ee7b7", marginTop: 6, lineHeight: 1.4, background: "#10b98110", borderRadius: 6, padding: "6px 10px" },
    feedLabel: { fontWeight: 600, fontSize: 11, marginRight: 4 },

    alertCard: { background: "#18181b", borderRadius: 10, padding: 16, marginBottom: 10, display: "flex", alignItems: "center", gap: 12 },
    alertLevel: { fontSize: 12, fontWeight: 700, minWidth: 80 },
    alertType: { fontSize: 12, color: "#71717a", fontFamily: "monospace", minWidth: 160 },
    alertMsg: { fontSize: 13, color: "#e4e4e7" },

    gatewayGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
    gatewayCard: { background: "#18181b", borderRadius: 10, padding: 16 },
    gatewayLabel: { fontSize: 13, fontWeight: 500, color: "#a1a1aa", marginBottom: 8 },
    gatewayBar: { height: 8, background: "#27272a", borderRadius: 4, overflow: "hidden", marginBottom: 8 },
    gatewayFill: { height: "100%", borderRadius: 4, transition: "width 0.3s" },
    gatewayStat: { fontSize: 12, color: "#71717a" },

    overrideGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginBottom: 16 },
    overrideCard: { background: "#18181b", borderRadius: 10, padding: 16, border: "1px solid #27272a" },
    overrideAction: { fontSize: 14, fontWeight: 600, fontFamily: "monospace", color: "#a78bfa", marginBottom: 6 },
    overrideDesc: { fontSize: 13, color: "#a1a1aa" },
    overrideRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#18181b", borderRadius: 10, marginBottom: 8 },
    overrideClient: { fontWeight: 600, fontSize: 14 },
    overrideBtn: { background: "#27272a", color: "#e4e4e7", border: "1px solid #3f3f46", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 500 },

    emptyState: { textAlign: "center", color: "#71717a", padding: "48px 0", fontSize: 14 },
};
