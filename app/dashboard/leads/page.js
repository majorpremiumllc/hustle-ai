"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../dashboard.module.css";

/* ── Source badge colors ─────────────────── */
const SOURCE_COLORS = {
    Thumbtack: { bg: "rgba(34, 197, 94, 0.12)", color: "#22c55e" },
    Yelp: { bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444" },
    SMS: { bg: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" },
    Manual: { bg: "rgba(168, 85, 247, 0.12)", color: "#a855f7" },
};

const STATUS_MAP = {
    new: { label: "New", cls: "badge-warning" },
    contacted: { label: "Contacted", cls: "badge-info" },
    booked: { label: "Booked", cls: "badge-success" },
    completed: { label: "Completed", cls: "badge-primary" },
    closed: { label: "Closed", cls: "badge-secondary" },
};

const STATUSES = ["new", "contacted", "booked", "completed", "closed"];

/* ── Icons ────────────────────────────────── */
const IconSparkle = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18M3 12h18M5.636 5.636l12.728 12.728M18.364 5.636L5.636 18.364" />
    </svg>
);

const IconCopy = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
);

const IconPlus = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const IconPhone = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.11 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
);

export default function LeadsPage() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [generatingId, setGeneratingId] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [newLead, setNewLead] = useState({
        customerName: "", customerPhone: "", jobType: "", description: "", source: "SMS", urgency: "Flexible",
    });

    /* ── Fetch leads ───────────────────────── */
    const fetchLeads = useCallback(async () => {
        try {
            const res = await fetch("/api/leads/ingest");
            const data = await res.json();
            setLeads(data.leads || []);
        } catch (err) {
            console.error("Failed to fetch leads:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchLeads(); }, [fetchLeads]);

    /* ── Generate AI reply ─────────────────── */
    const generateReply = async (lead) => {
        setGeneratingId(lead.id);
        try {
            const res = await fetch("/api/leads/ai-reply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName: lead.customerName,
                    jobType: lead.jobType,
                    description: lead.description,
                    urgency: lead.urgency,
                    source: lead.source,
                }),
            });
            const data = await res.json();
            if (data.reply) {
                // Update in-memory store
                await fetch("/api/leads/ingest", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: lead.id, aiReply: data.reply }),
                });
                setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, aiReply: data.reply } : l));
            }
        } catch (err) {
            console.error("AI reply error:", err);
        } finally {
            setGeneratingId(null);
        }
    };

    /* ── Update status ─────────────────────── */
    const updateStatus = async (id, status) => {
        await fetch("/api/leads/ingest", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status }),
        });
        setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
    };

    /* ── Add lead ──────────────────────────── */
    const addLead = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/leads/ingest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newLead),
            });
            const data = await res.json();
            if (data.lead) {
                setLeads((prev) => [data.lead, ...prev]);
                setShowAddForm(false);
                setNewLead({ customerName: "", customerPhone: "", jobType: "", description: "", source: "SMS", urgency: "Flexible" });
            }
        } catch (err) {
            console.error("Add lead error:", err);
        }
    };

    /* ── Copy to clipboard ─────────────────── */
    const copyReply = (id, text) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    /* ── Time ago ──────────────────────────── */
    const timeAgo = (iso) => {
        const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
        if (mins < 1) return "just now";
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    /* ── Filtered leads ────────────────────── */
    const filtered = filter === "all" ? leads : leads.filter((l) => l.source === filter);
    const newCount = leads.filter((l) => l.status === "new").length;

    /* ── Render ─────────────────────────────── */
    return (
        <div>
            <div className={styles.pageHeader}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <h1>Leads {newCount > 0 && <span style={{ fontSize: "0.6em", background: "var(--accent)", color: "white", padding: "2px 8px", borderRadius: 20, verticalAlign: "middle", marginLeft: 8 }}>{newCount} new</span>}</h1>
                        <p>Incoming leads from Thumbtack, Yelp, and SMS.</p>
                    </div>
                    <button className="btn btn-accent btn-sm" onClick={() => setShowAddForm(!showAddForm)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <IconPlus /> Add Lead
                    </button>
                </div>
            </div>

            {/* ── Add Lead Form ────────────── */}
            {showAddForm && (
                <div className="card-flat" style={{ padding: 20, marginBottom: 20 }}>
                    <h4 style={{ color: "var(--text-white)", marginBottom: 12 }}>New Lead</h4>
                    <form onSubmit={addLead} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <input placeholder="Customer Name *" required value={newLead.customerName} onChange={(e) => setNewLead({ ...newLead, customerName: e.target.value })} className="input" />
                        <input placeholder="Phone" value={newLead.customerPhone} onChange={(e) => setNewLead({ ...newLead, customerPhone: e.target.value })} className="input" />
                        <input placeholder="Job Type (e.g. TV Mounting)" value={newLead.jobType} onChange={(e) => setNewLead({ ...newLead, jobType: e.target.value })} className="input" />
                        <select value={newLead.source} onChange={(e) => setNewLead({ ...newLead, source: e.target.value })} className="input">
                            <option value="SMS">SMS</option>
                            <option value="Thumbtack">Thumbtack</option>
                            <option value="Yelp">Yelp</option>
                            <option value="Manual">Manual</option>
                        </select>
                        <textarea placeholder="Job description *" required value={newLead.description} onChange={(e) => setNewLead({ ...newLead, description: e.target.value })} className="input" style={{ gridColumn: "1 / -1", minHeight: 80, resize: "vertical" }} />
                        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(false)}>Cancel</button>
                            <button type="submit" className="btn btn-accent btn-sm">Save Lead</button>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Filter tabs ─────────────── */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {["all", "Thumbtack", "Yelp", "SMS"].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            border: "1px solid " + (filter === f ? "var(--primary)" : "var(--glass-border)"),
                            background: filter === f ? "rgba(108,92,231,0.15)" : "var(--glass-bg)",
                            color: filter === f ? "var(--primary-light)" : "var(--text-muted)",
                            cursor: "pointer",
                            fontSize: "0.82rem",
                            fontWeight: 500,
                            transition: "all 0.2s",
                        }}
                    >
                        {f === "all" ? `All (${leads.length})` : `${f} (${leads.filter((l) => l.source === f).length})`}
                    </button>
                ))}
            </div>

            {/* ── Lead cards ──────────────── */}
            {loading ? (
                <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Loading leads...</div>
            ) : filtered.length === 0 ? (
                <div className="card-flat" style={{ textAlign: "center", padding: 60 }}>
                    <p style={{ color: "var(--text-muted)" }}>No leads yet. Click "Add Lead" to create one.</p>
                </div>
            ) : (
                <div style={{ display: "grid", gap: 16 }}>
                    {filtered.map((lead) => (
                        <div key={lead.id} className="card-flat" style={{ padding: 20, transition: "border-color 0.2s", borderColor: lead.status === "new" ? "var(--primary)" : undefined }}>
                            {/* Header */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                                    <span style={{
                                        padding: "3px 10px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600,
                                        background: (SOURCE_COLORS[lead.source] || SOURCE_COLORS.Manual).bg,
                                        color: (SOURCE_COLORS[lead.source] || SOURCE_COLORS.Manual).color,
                                    }}>{lead.source}</span>
                                    <span className={`badge ${STATUS_MAP[lead.status]?.cls || "badge-secondary"}`}>
                                        {STATUS_MAP[lead.status]?.label || lead.status}
                                    </span>
                                    <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{timeAgo(lead.createdAt)}</span>
                                </div>
                                <select
                                    value={lead.status}
                                    onChange={(e) => updateStatus(lead.id, e.target.value)}
                                    style={{
                                        padding: "4px 8px", borderRadius: 6, border: "1px solid var(--glass-border)",
                                        background: "var(--glass-bg)", color: "var(--text-primary)", fontSize: "0.78rem", cursor: "pointer",
                                    }}
                                >
                                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_MAP[s].label}</option>)}
                                </select>
                            </div>

                            {/* Customer info */}
                            <div style={{ marginBottom: 10 }}>
                                <div style={{ fontWeight: 700, color: "var(--text-white)", fontSize: "1.05rem" }}>{lead.customerName}</div>
                                <div style={{ display: "flex", gap: 16, marginTop: 4, flexWrap: "wrap" }}>
                                    {lead.customerPhone && (
                                        <a href={`tel:${lead.customerPhone}`} style={{ color: "var(--primary-light)", fontSize: "0.82rem", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                                            <IconPhone /> {lead.customerPhone}
                                        </a>
                                    )}
                                    {lead.jobType && <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{lead.jobType}</span>}
                                </div>
                            </div>

                            {/* Description */}
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.5, margin: "0 0 14px", padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.03)", borderLeft: "3px solid var(--glass-border)" }}>
                                &ldquo;{lead.description}&rdquo;
                            </p>

                            {/* AI Reply */}
                            {lead.aiReply ? (
                                <div style={{ padding: 14, borderRadius: 10, background: "rgba(108,92,231,0.06)", border: "1px solid rgba(108,92,231,0.15)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--primary-light)", display: "flex", alignItems: "center", gap: 4 }}>
                                            <IconSparkle /> AI Suggested Reply
                                        </span>
                                        <button
                                            onClick={() => copyReply(lead.id, lead.aiReply)}
                                            className="btn btn-secondary btn-sm"
                                            style={{ padding: "3px 10px", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: 4 }}
                                        >
                                            <IconCopy /> {copiedId === lead.id ? "Copied!" : "Copy"}
                                        </button>
                                    </div>
                                    <p style={{ color: "var(--text-primary)", fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>{lead.aiReply}</p>
                                </div>
                            ) : (
                                <button
                                    onClick={() => generateReply(lead)}
                                    disabled={generatingId !== null}
                                    className="btn btn-accent btn-sm"
                                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                                >
                                    <IconSparkle />
                                    {generatingId === lead.id ? "Generating..." : "Generate AI Reply"}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
