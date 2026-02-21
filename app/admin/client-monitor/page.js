"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * HustleAI — Admin Client Monitor
 * Minimal live feed of messages, AI replies, delivery status, and leads.
 * No styling needed — functional monitoring only.
 */
export default function ClientMonitor() {
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [monitorData, setMonitorData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Load client list
    const loadClients = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/monitor");
            if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
            const data = await res.json();
            setClients(data.clients || []);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    }, []);

    // Load specific client monitor data
    const loadMonitor = useCallback(async (clientId) => {
        try {
            const res = await fetch(`/api/admin/monitor?clientId=${clientId}`);
            if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
            const data = await res.json();
            setMonitorData(data);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    useEffect(() => {
        loadClients();
    }, [loadClients]);

    // Auto-refresh every 10 seconds
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => {
            if (selectedClient) {
                loadMonitor(selectedClient);
            } else {
                loadClients();
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [autoRefresh, selectedClient, loadMonitor, loadClients]);

    if (loading) return <div style={{ padding: 40, fontFamily: "monospace" }}>Loading...</div>;
    if (error) return <div style={{ padding: 40, fontFamily: "monospace", color: "red" }}>Error: {error}</div>;

    // ── Client List View ──
    if (!selectedClient) {
        return (
            <div style={{ padding: 20, fontFamily: "monospace", fontSize: 13, maxWidth: 1000, margin: "0 auto" }}>
                <h1 style={{ borderBottom: "2px solid #333", paddingBottom: 8 }}>
                    🖥️ Client Monitor — {clients.length} Clients
                </h1>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                    <button onClick={loadClients} style={btnStyle}>⟳ Refresh</button>
                    <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
                        Auto-refresh (10s)
                    </label>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid #ccc", textAlign: "left" }}>
                            <th style={thStyle}>Client</th>
                            <th style={thStyle}>Phone</th>
                            <th style={thStyle}>Plan</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}>10DLC</th>
                            <th style={thStyle}>Leads</th>
                            <th style={thStyle}>Convos</th>
                            <th style={thStyle}>Calls</th>
                            <th style={thStyle}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clients.map((c) => (
                            <tr key={c.id} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={tdStyle}><strong>{c.name}</strong><br /><small>{c.industry}</small></td>
                                <td style={tdStyle}>{c.phone || "—"}</td>
                                <td style={tdStyle}>{c.plan}</td>
                                <td style={tdStyle}>{statusBadge(c.status)}</td>
                                <td style={tdStyle}>{dlcBadge(c.tenDlc)}</td>
                                <td style={tdStyle}>{c.stats?.leads || 0}</td>
                                <td style={tdStyle}>{c.stats?.conversations || 0}</td>
                                <td style={tdStyle}>{c.stats?.callLogs || 0}</td>
                                <td style={tdStyle}>
                                    <button onClick={() => { setSelectedClient(c.id); loadMonitor(c.id); }} style={btnStyle}>
                                        Monitor →
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    // ── Client Detail Monitor ──
    if (!monitorData) return <div style={{ padding: 40, fontFamily: "monospace" }}>Loading monitor data...</div>;

    const { client, feed, leads, calls, complianceLogs, metrics } = monitorData;

    return (
        <div style={{ padding: 20, fontFamily: "monospace", fontSize: 13, maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #333", paddingBottom: 8 }}>
                <h1>🔍 {client.name} — Live Monitor</h1>
                <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => loadMonitor(selectedClient)} style={btnStyle}>⟳ Refresh</button>
                    <button onClick={() => { setSelectedClient(null); setMonitorData(null); }} style={btnStyle}>← Back</button>
                </div>
            </div>

            {/* Metrics Bar */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, margin: "16px 0", padding: 12, background: "#f5f5f5", borderRadius: 6 }}>
                <MetricBox label="Plan" value={client.plan} />
                <MetricBox label="Status" value={client.status} />
                <MetricBox label="Trial Expires" value={client.trialExpires ? new Date(client.trialExpires).toLocaleDateString() : "—"} />
                <MetricBox label="Compliance" value={`${metrics.complianceScore}/100`} />
                <MetricBox label="Delivery Rate" value={`${metrics.telecomHealth?.deliveryRate || 100}%`} />
                <MetricBox label="Spam Risk" value={metrics.telecomHealth?.spamRiskScore || 0} />
            </div>

            {/* Alerts */}
            {metrics.alerts?.length > 0 && (
                <div style={{ background: "#fff3cd", padding: 12, borderRadius: 6, marginBottom: 16 }}>
                    <strong>⚠️ Alerts:</strong>
                    {metrics.alerts.map((a, i) => (
                        <div key={i} style={{ color: a.level === "critical" ? "red" : "#856404" }}>{a.message}</div>
                    ))}
                </div>
            )}

            {/* Two-column layout */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                {/* Message Feed */}
                <div>
                    <h3>📨 Message Feed ({feed.length})</h3>
                    <div style={{ maxHeight: 500, overflow: "auto", border: "1px solid #ddd", borderRadius: 6 }}>
                        {feed.map((msg, i) => (
                            <div key={i} style={{ padding: 8, borderBottom: "1px solid #eee", background: msg.direction === "inbound" ? "#f0f8ff" : "#f0fff0" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                    <strong>{msg.direction === "inbound" ? "📥 Customer" : "🤖 AI"} → {msg.phone}</strong>
                                    <small>{new Date(msg.timestamp).toLocaleString()}</small>
                                </div>
                                <div style={{ marginTop: 4 }}>{msg.content}</div>
                            </div>
                        ))}
                        {feed.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#999" }}>No messages yet</div>}
                    </div>
                </div>

                {/* Right sidebar */}
                <div>
                    {/* Leads */}
                    <h3>🎯 Leads ({leads.length})</h3>
                    <div style={{ maxHeight: 200, overflow: "auto", border: "1px solid #ddd", borderRadius: 6, marginBottom: 16 }}>
                        {leads.map((l, i) => (
                            <div key={i} style={{ padding: 6, borderBottom: "1px solid #eee", fontSize: 12 }}>
                                <strong>{l.name}</strong> — {l.status} — {l.source}
                                {l.notes && <div style={{ color: "#666", marginTop: 2 }}>{l.notes.slice(0, 80)}</div>}
                            </div>
                        ))}
                    </div>

                    {/* Calls */}
                    <h3>📞 Calls ({calls.length})</h3>
                    <div style={{ maxHeight: 200, overflow: "auto", border: "1px solid #ddd", borderRadius: 6, marginBottom: 16 }}>
                        {calls.map((c, i) => (
                            <div key={i} style={{ padding: 6, borderBottom: "1px solid #eee", fontSize: 12 }}>
                                {c.from} — {c.status} — {c.duration}s
                                <small style={{ float: "right" }}>{new Date(c.timestamp).toLocaleTimeString()}</small>
                            </div>
                        ))}
                    </div>

                    {/* Compliance Events */}
                    <h3>📋 Compliance (24h)</h3>
                    <div style={{ maxHeight: 150, overflow: "auto", border: "1px solid #ddd", borderRadius: 6 }}>
                        {complianceLogs.map((l, i) => (
                            <div key={i} style={{ padding: 6, borderBottom: "1px solid #eee", fontSize: 12 }}>
                                <strong>{l.event}</strong> — {l.phone || "system"}
                                <small style={{ float: "right" }}>{new Date(l.timestamp).toLocaleTimeString()}</small>
                            </div>
                        ))}
                        {complianceLogs.length === 0 && <div style={{ padding: 10, textAlign: "center", color: "#999", fontSize: 12 }}>No events</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricBox({ label, value }) {
    return (
        <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#666" }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: "bold" }}>{value}</div>
        </div>
    );
}

function statusBadge(status) {
    const colors = { active: "#28a745", trialing: "#17a2b8", canceled: "#dc3545", past_due: "#ffc107" };
    return <span style={{ color: colors[status] || "#666", fontWeight: "bold" }}>{status || "—"}</span>;
}

function dlcBadge(status) {
    const colors = { approved: "#28a745", pending: "#ffc107", "in-review": "#17a2b8", "not-registered": "#dc3545", rejected: "#dc3545" };
    return <span style={{ color: colors[status] || "#666" }}>{status}</span>;
}

const btnStyle = { padding: "4px 12px", border: "1px solid #ccc", borderRadius: 4, background: "#fff", cursor: "pointer", fontSize: 12 };
const thStyle = { padding: "6px 8px", fontSize: 12 };
const tdStyle = { padding: "6px 8px" };
