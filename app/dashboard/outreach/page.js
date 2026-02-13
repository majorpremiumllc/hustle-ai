"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../dashboard.module.css";

const StatusBadge = ({ status }) => {
    const colors = {
        active: "badge-success", paused: "badge-warning", draft: "badge-secondary", completed: "badge-primary",
        sent: "badge-secondary", opened: "badge-primary", replied: "badge-warning", converted: "badge-success",
    };
    return <span className={`badge ${colors[status] || "badge-secondary"}`}>{status}</span>;
};

export default function OutreachPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [newChannel, setNewChannel] = useState("Email + SMS");

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/api/outreach");
            const json = await res.json();
            setData(json);
        } catch { /* ignore */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setCreating(true);
        try {
            await fetch("/api/outreach", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName, channel: newChannel }),
            });
            setNewName("");
            fetchData();
        } catch (err) { console.error(err); }
        finally { setCreating(false); }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await fetch("/api/outreach", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus }),
            });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this campaign?")) return;
        try {
            await fetch(`/api/outreach?id=${id}`, { method: "DELETE" });
            fetchData();
        } catch (err) { console.error(err); }
    };

    if (loading) {
        return (
            <div>
                <div className={styles.pageHeader}>
                    <h1>AI Outreach</h1>
                    <p>Automated campaigns to find and convert new customers.</p>
                </div>
                <div className="card-flat" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading campaigns...</div>
            </div>
        );
    }

    const stats = data?.stats || {};
    const campaigns = data?.campaigns || [];
    const contacts = data?.recentContacts || [];

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1>AI Outreach</h1>
                <p>Automated campaigns to find and convert new customers.</p>
            </div>

            {/* Stats */}
            <div className={styles.statsGrid}>
                <div className="stat-card">
                    <span className="stat-label">Total Sent</span>
                    <span className="stat-value">{stats.totalSent || 0}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Open Rate</span>
                    <span className="stat-value">{stats.openRate || 0}%</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Reply Rate</span>
                    <span className="stat-value">{stats.replyRate || 0}%</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Conversions</span>
                    <span className="stat-value">{stats.totalConverted || 0}</span>
                </div>
            </div>

            {/* Campaigns */}
            <div className={styles.recentSection}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3>Campaigns</h3>
                </div>

                {/* New Campaign Form */}
                <div className="card-flat" style={{ padding: 16, marginBottom: 16, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <input
                        className="input"
                        placeholder="Campaign name, e.g. 'Plumbers – Chicago, IL'"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        style={{ flex: 1, minWidth: 200 }}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                    />
                    <select
                        className="input"
                        value={newChannel}
                        onChange={(e) => setNewChannel(e.target.value)}
                        style={{ width: 160 }}
                    >
                        <option>Email + SMS</option>
                        <option>Email</option>
                        <option>SMS</option>
                        <option>Email + Call</option>
                    </select>
                    <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={creating || !newName.trim()}>
                        {creating ? "Creating..." : "+ New Campaign"}
                    </button>
                </div>

                {campaigns.length === 0 ? (
                    <div className="card-flat" style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
                        No campaigns yet. Create one above to start outreach.
                    </div>
                ) : (
                    <div className="card-flat" style={{ overflow: "auto" }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Campaign</th>
                                    <th>Channel</th>
                                    <th>Sent</th>
                                    <th>Opened</th>
                                    <th>Replied</th>
                                    <th>Converted</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map((c) => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 600, color: "var(--text-white)" }}>{c.name}</td>
                                        <td>{c.channel}</td>
                                        <td>{c.sent}</td>
                                        <td>{c.opened}</td>
                                        <td>{c.replied}</td>
                                        <td style={{ color: "var(--success)", fontWeight: 600 }}>{c.converted}</td>
                                        <td><StatusBadge status={c.status} /></td>
                                        <td>
                                            <div style={{ display: "flex", gap: 6 }}>
                                                {c.status === "draft" && (
                                                    <button className="btn btn-primary btn-sm" style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                                                        onClick={() => handleStatusChange(c.id, "active")}>Start</button>
                                                )}
                                                {c.status === "active" && (
                                                    <button className="btn btn-secondary btn-sm" style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                                                        onClick={() => handleStatusChange(c.id, "paused")}>Pause</button>
                                                )}
                                                {c.status === "paused" && (
                                                    <button className="btn btn-primary btn-sm" style={{ fontSize: "0.72rem", padding: "3px 8px" }}
                                                        onClick={() => handleStatusChange(c.id, "active")}>Resume</button>
                                                )}
                                                <button className="btn btn-secondary btn-sm" style={{ fontSize: "0.72rem", padding: "3px 8px", color: "var(--error, #ef4444)" }}
                                                    onClick={() => handleDelete(c.id)}>×</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Recent Contacts */}
            {contacts.length > 0 && (
                <div className={styles.recentSection} style={{ marginTop: 24 }}>
                    <h3>Recent Contacts</h3>
                    <div className="card-flat" style={{ overflow: "auto" }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Business</th>
                                    <th>Phone</th>
                                    <th>Last Message</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contacts.map((c) => (
                                    <tr key={c.id}>
                                        <td style={{ fontWeight: 600, color: "var(--text-white)" }}>{c.name}</td>
                                        <td>{c.phone || c.email || "—"}</td>
                                        <td>{c.lastMsg || "—"}</td>
                                        <td><StatusBadge status={c.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
