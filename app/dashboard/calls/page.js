"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../dashboard.module.css";

/* ── Status styles ─────────────────────── */
const STATUS_STYLES = {
    completed: { bg: "rgba(34,197,94,0.12)", color: "#22c55e", label: "Completed" },
    "in-progress": { bg: "rgba(59,130,246,0.12)", color: "#3b82f6", label: "In Progress" },
    missed: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", label: "Missed" },
};

export default function CallsPage() {
    const [calls, setCalls] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchCalls = useCallback(async () => {
        try {
            const res = await fetch("/api/twilio/voice");
            const data = await res.json();
            setCalls(data.calls || []);
        } catch { /* ignore */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchCalls(); }, [fetchCalls]);

    const selected = calls.find((c) => c.id === selectedId);

    const timeAgo = (iso) => {
        const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1>Calls</h1>
                <p>AI-handled phone calls — transcripts and outcomes.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16, height: "calc(100vh - 200px)", minHeight: 500 }} className="calls-grid">
                {/* ── Call List ─────────────── */}
                <div className="card-flat" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--glass-border)" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-white)" }}>Call Log ({calls.length})</div>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto" }}>
                        {loading ? (
                            <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
                        ) : calls.length === 0 ? (
                            <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                No calls yet. Connect Twilio to start receiving calls.
                            </div>
                        ) : (
                            calls.map((call) => {
                                const st = STATUS_STYLES[call.status] || STATUS_STYLES.completed;
                                return (
                                    <div
                                        key={call.id}
                                        onClick={() => setSelectedId(call.id)}
                                        style={{
                                            padding: "14px 16px",
                                            cursor: "pointer",
                                            borderBottom: "1px solid var(--glass-border)",
                                            background: selectedId === call.id ? "rgba(108,92,231,0.1)" : "transparent",
                                            borderLeft: selectedId === call.id ? "3px solid var(--primary)" : "3px solid transparent",
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                            <span style={{ fontWeight: 600, color: "var(--text-white)", fontSize: "0.88rem" }}>{call.callerName}</span>
                                            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{timeAgo(call.createdAt)}</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{call.callerPhone}</span>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{call.duration}</span>
                                                <span style={{
                                                    padding: "2px 8px", borderRadius: 6, fontSize: "0.68rem", fontWeight: 600,
                                                    background: st.bg, color: st.color,
                                                }}>{st.label}</span>
                                            </div>
                                        </div>
                                        {call.outcome && (
                                            <div style={{ marginTop: 6, fontSize: "0.76rem", color: "var(--primary-light)", fontStyle: "italic" }}>
                                                {call.outcome}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ── Transcript View ──────── */}
                <div className="card-flat" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    {selected ? (
                        <>
                            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ fontWeight: 700, color: "var(--text-white)" }}>{selected.callerName}</div>
                                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{selected.callerPhone} · {selected.duration}</div>
                                </div>
                                <span className={`badge ${selected.status === "completed" ? "badge-success" : "badge-info"}`} style={{ fontSize: "0.7rem" }}>
                                    {selected.status === "completed" ? "AI Handled" : "In Progress"}
                                </span>
                            </div>

                            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
                                <h4 style={{ color: "var(--text-white)", margin: "0 0 16px", fontSize: "0.9rem" }}>Call Transcript</h4>
                                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                    {selected.transcript.map((t, i) => (
                                        <div key={i} style={{ display: "flex", gap: 10 }}>
                                            <div style={{
                                                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                                                background: t.role === "ai" ? "linear-gradient(135deg, #6C5CE7, #a855f7)" : "rgba(255,255,255,0.08)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: "0.7rem", color: "white", fontWeight: 700,
                                            }}>
                                                {t.role === "ai" ? "AI" : "👤"}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 3, fontWeight: 600 }}>
                                                    {t.role === "ai" ? "AI Assistant" : "Caller"}
                                                </div>
                                                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-primary)", lineHeight: 1.5 }}>{t.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {selected.outcome && (
                                    <div style={{ marginTop: 24, padding: 14, borderRadius: 10, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                                        <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#22c55e", marginBottom: 4 }}>Outcome</div>
                                        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-primary)" }}>{selected.outcome}</p>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                            <div style={{ textAlign: "center" }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: 12 }}>
                                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.11 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                                </svg>
                                <p style={{ margin: 0 }}>Select a call to view its transcript</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
