"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../dashboard.module.css";

/* ── Icons ─────────────────────────────── */
const IconSend = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
);

export default function MessagesPage() {
    const [convos, setConvos] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [newMsg, setNewMsg] = useState("");

    const fetchConvos = useCallback(async () => {
        try {
            const res = await fetch("/api/twilio/sms");
            const data = await res.json();
            setConvos(data.conversations || []);
            if (!selectedId && data.conversations?.length) setSelectedId(data.conversations[0].id);
        } catch { /* ignore */ } finally { setLoading(false); }
    }, [selectedId]);

    useEffect(() => { fetchConvos(); }, [fetchConvos]);

    const selected = convos.find((c) => c.id === selectedId);

    const timeStr = (iso) => {
        const d = new Date(iso);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const timeAgo = (iso) => {
        const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
        if (mins < 1) return "now";
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        return `${Math.floor(hrs / 24)}d`;
    };

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1>Messages</h1>
                <p>SMS conversations with customers — powered by AI auto-responder.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, height: "calc(100vh - 200px)", minHeight: 500 }} className="messages-grid">
                {/* ── Conversation List ─────── */}
                <div className="card-flat" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--glass-border)" }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-white)" }}>
                            Conversations ({convos.length})
                        </div>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto" }}>
                        {loading ? (
                            <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
                        ) : convos.length === 0 ? (
                            <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                No conversations yet. Connect Twilio to start receiving SMS.
                            </div>
                        ) : (
                            convos.map((c) => (
                                <div
                                    key={c.id}
                                    onClick={() => setSelectedId(c.id)}
                                    style={{
                                        padding: "12px 16px",
                                        cursor: "pointer",
                                        borderBottom: "1px solid var(--glass-border)",
                                        background: selectedId === c.id ? "rgba(108,92,231,0.1)" : "transparent",
                                        borderLeft: selectedId === c.id ? "3px solid var(--primary)" : "3px solid transparent",
                                        transition: "all 0.15s",
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                        <span style={{ fontWeight: 600, color: "var(--text-white)", fontSize: "0.88rem" }}>{c.customerName}</span>
                                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{timeAgo(c.lastActivity)}</span>
                                    </div>
                                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {c.messages[c.messages.length - 1]?.text || "No messages"}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ── Chat View ─────────────── */}
                <div className="card-flat" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    {selected ? (
                        <>
                            {/* Header */}
                            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div>
                                    <div style={{ fontWeight: 700, color: "var(--text-white)" }}>{selected.customerName}</div>
                                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{selected.customerPhone}</div>
                                </div>
                                <span className="badge badge-success" style={{ fontSize: "0.7rem" }}>AI Active</span>
                            </div>

                            {/* Messages */}
                            <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
                                {selected.messages.map((msg, i) => (
                                    <div key={i} style={{ display: "flex", justifyContent: msg.role === "ai" ? "flex-end" : "flex-start" }}>
                                        <div style={{
                                            maxWidth: "75%",
                                            padding: "10px 14px",
                                            borderRadius: msg.role === "ai" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                                            background: msg.role === "ai" ? "rgba(108,92,231,0.2)" : "rgba(255,255,255,0.06)",
                                            border: `1px solid ${msg.role === "ai" ? "rgba(108,92,231,0.3)" : "var(--glass-border)"}`,
                                        }}>
                                            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-primary)", lineHeight: 1.5 }}>{msg.text}</p>
                                            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                                                {msg.role === "ai" ? "🤖 AI" : "👤 Customer"} · {timeStr(msg.ts)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Input */}
                            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--glass-border)", display: "flex", gap: 8 }}>
                                <input
                                    className="input"
                                    placeholder="Type a message (manual override)..."
                                    value={newMsg}
                                    onChange={(e) => setNewMsg(e.target.value)}
                                    style={{ flex: 1 }}
                                    onKeyDown={(e) => e.key === "Enter" && newMsg.trim() && alert("Manual SMS requires Twilio credentials. AI handles responses automatically.")}
                                />
                                <button
                                    className="btn btn-accent btn-sm"
                                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                                    onClick={() => newMsg.trim() && alert("Manual SMS requires Twilio credentials. AI handles responses automatically.")}
                                >
                                    <IconSend /> Send
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                            <div style={{ textAlign: "center" }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3, marginBottom: 12 }}>
                                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                                </svg>
                                <p style={{ margin: 0 }}>Select a conversation to view messages</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
