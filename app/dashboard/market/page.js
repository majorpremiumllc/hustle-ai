"use client";

import styles from "../dashboard.module.css";

/* ── Demo Market Data ── */
const MARKET_OPPORTUNITIES = [
    {
        business: "Valley Plumbing LLC",
        location: "Las Vegas, NV",
        source: "Google",
        issues: ["No website", "2.1★ rating", "No online booking"],
        potential: "High",
        industry: "Plumbing",
    },
    {
        business: "Quick Fix Electric",
        location: "Phoenix, AZ",
        source: "Yelp",
        issues: ["Slow response (48h+)", "No SMS", "Missing reviews"],
        potential: "High",
        industry: "Electrical",
    },
    {
        business: "Desert Cool HVAC",
        location: "Henderson, NV",
        source: "Thumbtack",
        issues: ["No auto-reply", "3.2★ rating", "No call answering"],
        potential: "Medium",
        industry: "HVAC",
    },
    {
        business: "Fresh Cuts Landscaping",
        location: "Denver, CO",
        source: "Google",
        issues: ["Outdated website", "No mobile optimization", "No reviews in 6mo"],
        potential: "Medium",
        industry: "Landscaping",
    },
    {
        business: "Joe's Auto Care",
        location: "Los Angeles, CA",
        source: "Yelp",
        issues: ["1.8★ rating", "Multiple complaints", "No follow-up system"],
        potential: "Critical",
        industry: "Auto Repair",
    },
    {
        business: "Sparkle Clean Co",
        location: "San Diego, CA",
        source: "Google",
        issues: ["No Google Business Profile", "No online presence", "Phone only"],
        potential: "High",
        industry: "Cleaning",
    },
];

const INDUSTRY_STATS = [
    { industry: "Plumbing", found: 234, withGaps: 89, opportunity: "$45K/yr" },
    { industry: "HVAC", found: 178, withGaps: 67, opportunity: "$38K/yr" },
    { industry: "Electrical", found: 156, withGaps: 52, opportunity: "$31K/yr" },
    { industry: "Landscaping", found: 298, withGaps: 124, opportunity: "$52K/yr" },
    { industry: "Auto Repair", found: 189, withGaps: 78, opportunity: "$41K/yr" },
    { industry: "Cleaning", found: 312, withGaps: 145, opportunity: "$48K/yr" },
];

const PotentialBadge = ({ level }) => {
    const cls = { Critical: "badge-error", High: "badge-warning", Medium: "badge-primary" };
    return <span className={`badge ${cls[level] || "badge-secondary"}`}>{level}</span>;
};

const SourceBadge = ({ source }) => {
    const cls = { Google: "badge-primary", Yelp: "badge-error", Thumbtack: "badge-success" };
    return <span className={`badge ${cls[source] || "badge-secondary"}`}>{source}</span>;
};

export default function MarketPage() {
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
                    <span className="stat-value">1,367</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">With Gaps Found</span>
                    <span className="stat-value">555</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Revenue Potential</span>
                    <span className="stat-value">$255K</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Already Contacted</span>
                    <span className="stat-value">316</span>
                </div>
            </div>

            {/* Industry Breakdown */}
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
                                <th>Est. Revenue Opportunity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {INDUSTRY_STATS.map((s, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600, color: "var(--text-white)" }}>{s.industry}</td>
                                    <td>{s.found}</td>
                                    <td style={{ color: "var(--warning)" }}>{s.withGaps}</td>
                                    <td>{Math.round((s.withGaps / s.found) * 100)}%</td>
                                    <td style={{ color: "var(--success)", fontWeight: 600 }}>{s.opportunity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Opportunities */}
            <div className={styles.recentSection} style={{ marginTop: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3>Top Opportunities</h3>
                    <button className="btn btn-primary btn-sm">Run New Scan</button>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                    {MARKET_OPPORTUNITIES.map((opp, i) => (
                        <div
                            key={i}
                            className="card-flat"
                            style={{ padding: 20 }}
                        >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                                <div>
                                    <h4 style={{ color: "var(--text-white)", marginBottom: 4, fontSize: "1rem" }}>{opp.business}</h4>
                                    <p style={{ fontSize: "0.82rem", margin: 0 }}>{opp.location} • {opp.industry}</p>
                                </div>
                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <SourceBadge source={opp.source} />
                                    <PotentialBadge level={opp.potential} />
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {opp.issues.map((issue, j) => (
                                    <span
                                        key={j}
                                        style={{
                                            fontSize: "0.78rem",
                                            padding: "4px 10px",
                                            borderRadius: 20,
                                            background: "rgba(255, 107, 107, 0.1)",
                                            color: "var(--error, #ff6b6b)",
                                            border: "1px solid rgba(255, 107, 107, 0.2)",
                                        }}
                                    >
                                        {issue}
                                    </span>
                                ))}
                            </div>
                            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                                <button className="btn btn-primary btn-sm">Start Outreach</button>
                                <button className="btn btn-secondary btn-sm">View Details</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
