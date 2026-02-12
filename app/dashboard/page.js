import styles from "./dashboard.module.css";

export default function DashboardPage() {
    // In production, this data comes from DB via server component
    const stats = [
        { label: "Total Leads", value: "0", change: "+0 today", positive: true },
        { label: "Calls Answered", value: "0", change: "AI Dispatcher active", positive: true },
        { label: "Messages Sent", value: "0", change: "SMS auto-responder", positive: true },
        { label: "Conversion Rate", value: "—", change: "Start getting leads", positive: true },
    ];

    return (
        <div>
            <div className={styles.pageHeader}>
                <h1>Dashboard</h1>
                <p>Welcome to HustleAI. Your AI business growth overview.</p>
            </div>

            <div className={styles.statsGrid}>
                {stats.map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-label">{s.label}</div>
                        <div className="stat-value">{s.value}</div>
                        <div className={`stat-change ${s.positive ? "positive" : "negative"}`}>
                            {s.change}
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.recentSection}>
                <h3>Recent Activity</h3>
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
            </div>
        </div>
    );
}
