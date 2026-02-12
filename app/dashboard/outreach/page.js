"use client";

import styles from "../dashboard.module.css";

/* ── Demo Data ── */
const OUTREACH_CAMPAIGNS = [
    {
        id: 1,
        name: "HVAC Companies — Phoenix, AZ",
        status: "active",
        sent: 142,
        opened: 89,
        replied: 23,
        converted: 7,
        channel: "Email + SMS",
    },
    {
        id: 2,
        name: "Plumbing Services — Las Vegas, NV",
        status: "active",
        sent: 98,
        opened: 61,
        replied: 15,
        converted: 4,
        channel: "Email",
    },
    {
        id: 3,
        name: "Landscaping — Denver, CO",
        status: "paused",
        sent: 76,
        opened: 45,
        replied: 11,
        converted: 3,
        channel: "SMS",
    },
    {
        id: 4,
        name: "Auto Repair — Los Angeles, CA",
        status: "draft",
        sent: 0,
        opened: 0,
        replied: 0,
        converted: 0,
        channel: "Email + Call",
    },
];

const RECENT_CONTACTS = [
    { name: "Johnson Plumbing", phone: "+1 (702) 555-0142", status: "replied", lastMsg: "Interested in automation" },
    { name: "Cool Air HVAC", phone: "+1 (602) 555-0198", status: "opened", lastMsg: "—" },
    { name: "GreenStar Landscaping", phone: "+1 (303) 555-0167", status: "converted", lastMsg: "Signed up for trial" },
    { name: "Mike's Electric", phone: "+1 (213) 555-0134", status: "sent", lastMsg: "—" },
    { name: "CleanPro Services", phone: "+1 (415) 555-0189", status: "replied", lastMsg: "Send me pricing info" },
];

const StatusBadge = ({ status }) => {
    const colors = {
        active: "badge-success",
        paused: "badge-warning",
        draft: "badge-secondary",
        sent: "badge-secondary",
        opened: "badge-primary",
        replied: "badge-warning",
        converted: "badge-success",
    };
    return <span className={`badge ${colors[status] || "badge-secondary"}`}>{status}</span>;
};

export default function OutreachPage() {
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
                    <span className="stat-value">316</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Open Rate</span>
                    <span className="stat-value">61.7%</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Reply Rate</span>
                    <span className="stat-value">15.5%</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Conversions</span>
                    <span className="stat-value">14</span>
                </div>
            </div>

            {/* Campaigns */}
            <div className={styles.recentSection}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h3>Campaigns</h3>
                    <button className="btn btn-primary btn-sm">+ New Campaign</button>
                </div>

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
                            </tr>
                        </thead>
                        <tbody>
                            {OUTREACH_CAMPAIGNS.map((c) => (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: 600, color: "var(--text-white)" }}>{c.name}</td>
                                    <td>{c.channel}</td>
                                    <td>{c.sent}</td>
                                    <td>{c.opened}</td>
                                    <td>{c.replied}</td>
                                    <td style={{ color: "var(--success)", fontWeight: 600 }}>{c.converted}</td>
                                    <td><StatusBadge status={c.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Contacts */}
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
                            {RECENT_CONTACTS.map((c, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600, color: "var(--text-white)" }}>{c.name}</td>
                                    <td>{c.phone}</td>
                                    <td>{c.lastMsg}</td>
                                    <td><StatusBadge status={c.status} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
