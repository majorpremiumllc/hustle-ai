"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "../dashboard.module.css";

const PotentialBadge = ({ level }) => {
    const cls = { Critical: "badge-error", High: "badge-warning", Medium: "badge-primary", Low: "badge-secondary" };
    return <span className={`badge ${cls[level] || "badge-secondary"}`}>{level}</span>;
};

const SourceBadge = ({ source }) => {
    const cls = { Google: "badge-primary", Yelp: "badge-error", Thumbtack: "badge-success" };
    return <span className={`badge ${cls[source] || "badge-secondary"}`}>{source}</span>;
};

export default function MarketPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/api/market");
            const json = await res.json();
            setData(json);
        } catch { /* ignore */ } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleContact = async (id) => {
        try {
            await fetch("/api/market", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, contacted: true }),
            });
            fetchData();
        } catch (err) { console.error(err); }
    };

    if (loading) {
        return (
            <div>
                <div className={styles.pageHeader}>
                    <h1>Market Analysis</h1>
                    <p>AI-powered scan of businesses with automation gaps — your next customers.</p>
                </div>
                <div className="card-flat" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Scanning market...</div>
            </div>
        );
    }

    const stats = data?.stats || {};
    const opps = data?.opportunities || [];
    const industryStats = data?.industryStats || [];

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1>Market Analysis</h1>
                <p>AI-powered scan of businesses with automation gaps — your next customers.</p>
            </div>

            {/* Summary Stats */}
            <div className={styles.statsGrid}>
                <div className="stat-card">
                    <span className="stat-label">Businesses Scanned</span>
                    <span className="stat-value">{stats.totalScanned || 0}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">With Gaps Found</span>
                    <span className="stat-value">{stats.withGaps || 0}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Gap Rate</span>
                    <span className="stat-value">
                        {stats.totalScanned > 0 ? Math.round((stats.withGaps / stats.totalScanned) * 100) : 0}%
                    </span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Already Contacted</span>
                    <span className="stat-value">{stats.contacted || 0}</span>
                </div>
            </div>

            {/* Industry Breakdown */}
            {industryStats.length > 0 && (
                <div className={styles.recentSection}>
                    <h3>Industry Breakdown</h3>
                    <div className="card-flat" style={{ overflow: "auto" }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Industry</th>
                                    <th>Businesses Found</th>
                                    <th>With Gaps</th>
                                    <th>Gap Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {industryStats.map((s, i) => (
                                    <tr key={i}>
                                        <td style={{ fontWeight: 600, color: "var(--text-white)" }}>{s.industry}</td>
                                        <td>{s.found}</td>
                                        <td style={{ color: "var(--warning)" }}>{s.withGaps}</td>
                                        <td>{s.found > 0 ? Math.round((s.withGaps / s.found) * 100) : 0}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Opportunities */}
            <div className={styles.recentSection} style={{ marginTop: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3>Top Opportunities</h3>
                </div>

                {opps.length === 0 ? (
                    <div className="card-flat" style={{ padding: 32, textAlign: "center", color: "var(--text-muted)" }}>
                        No market data yet. Run a scan to discover opportunities.
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: 12 }}>
                        {opps.map((opp) => (
                            <div key={opp.id} className="card-flat" style={{ padding: 20 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                    <div>
                                        <h4 style={{ color: "var(--text-white)", marginBottom: 4, fontSize: "1rem" }}>{opp.business}</h4>
                                        <p style={{ fontSize: "0.82rem", margin: 0 }}>{opp.location} • {opp.industry}</p>
                                    </div>
                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <SourceBadge source={opp.source} />
                                        <PotentialBadge level={opp.potential} />
                                        {opp.contacted && <span className="badge badge-success">Contacted</span>}
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    {(opp.issues || []).map((issue, j) => (
                                        <span key={j} style={{
                                            fontSize: "0.78rem", padding: "4px 10px", borderRadius: 20,
                                            background: "rgba(255, 107, 107, 0.1)", color: "var(--error, #ff6b6b)",
                                            border: "1px solid rgba(255, 107, 107, 0.2)",
                                        }}>{issue}</span>
                                    ))}
                                </div>
                                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                                    {!opp.contacted ? (
                                        <button className="btn btn-primary btn-sm" onClick={() => handleContact(opp.id)}>
                                            Start Outreach
                                        </button>
                                    ) : (
                                        <button className="btn btn-secondary btn-sm" disabled style={{ opacity: 0.5 }}>
                                            ✓ Contacted
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
