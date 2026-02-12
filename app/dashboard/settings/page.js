import styles from "../dashboard.module.css";

export default function SettingsPage() {
    return (
        <div>
            <div className={styles.pageHeader}>
                <h1>Settings</h1>
                <p>Configure your company, AI dispatcher, and integrations.</p>
            </div>

            <div style={{ display: "grid", gap: "var(--space-lg)" }}>
                {/* Company Info */}
                <div className="card-flat">
                    <h4 style={{ marginBottom: "var(--space-lg)" }}>Company Information</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
                        <div className="input-group">
                            <label>Company Name</label>
                            <input className="input" placeholder="Your company name" defaultValue="" />
                        </div>
                        <div className="input-group">
                            <label>Service Area</label>
                            <input className="input" placeholder="e.g. Las Vegas & nearby areas" defaultValue="" />
                        </div>
                        <div className="input-group">
                            <label>Phone</label>
                            <input className="input" placeholder="+1 (702) 555-0100" defaultValue="" />
                        </div>
                        <div className="input-group">
                            <label>Email</label>
                            <input className="input" placeholder="contact@company.com" defaultValue="" />
                        </div>
                    </div>
                    <button className="btn btn-primary" style={{ marginTop: "var(--space-lg)" }}>
                        Save Changes
                    </button>
                </div>

                {/* AI Configuration */}
                <div className="card-flat">
                    <h4 style={{ marginBottom: "var(--space-lg)" }}>AI Dispatcher Settings</h4>
                    <div className="input-group" style={{ marginBottom: "var(--space-md)" }}>
                        <label>Greeting Message (Phone)</label>
                        <textarea
                            className="input"
                            placeholder="Hi! Thank you for calling [Company]. I can help you schedule service or get a quote..."
                            defaultValue=""
                        />
                    </div>
                    <div className="input-group" style={{ marginBottom: "var(--space-md)" }}>
                        <label>Greeting Message (SMS)</label>
                        <textarea
                            className="input"
                            placeholder="Hi! Thanks for reaching out to [Company]. I can help you with pricing and availability."
                            defaultValue=""
                        />
                    </div>
                    <div className="input-group" style={{ marginBottom: "var(--space-md)" }}>
                        <label>AI Tone</label>
                        <select className="input" defaultValue="friendly">
                            <option value="friendly">Friendly & Professional</option>
                            <option value="formal">Formal & Corporate</option>
                            <option value="casual">Casual & Relaxed</option>
                        </select>
                    </div>
                    <button className="btn btn-primary">Save AI Settings</button>
                </div>

                {/* Integrations */}
                <div className="card-flat">
                    <h4 style={{ marginBottom: "var(--space-lg)" }}>Integrations</h4>
                    <div style={{ display: "grid", gap: "var(--space-md)" }}>
                        {[
                            { name: "Twilio", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>, desc: "Phone & SMS", status: "Not connected" },
                            { name: "Yelp", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>, desc: "Lead auto-responder", status: "Not connected" },
                            { name: "Thumbtack", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>, desc: "Lead auto-responder", status: "Not connected" },
                            { name: "Google Business", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>, desc: "Business Profile leads", status: "Not connected" },
                        ].map((int, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "14px 16px",
                                    background: "var(--bg-input)",
                                    borderRadius: "var(--radius-md)",
                                    border: "1px solid var(--border)",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <span style={{ display: "flex", alignItems: "center" }}>{int.icon}</span>
                                    <div>
                                        <strong style={{ color: "var(--text-white)", fontSize: "0.9rem" }}>{int.name}</strong>
                                        <p style={{ fontSize: "0.8rem", margin: 0 }}>{int.desc}</p>
                                    </div>
                                </div>
                                <span className="badge badge-warning">{int.status}</span>
                            </div>
                        ))}
                    </div>
                    <a href="/dashboard/onboarding" className="btn btn-secondary" style={{ marginTop: "var(--space-lg)" }}>
                        Run Setup Wizard →
                    </a>
                </div>

                {/* Billing */}
                <div className="card-flat">
                    <h4 style={{ marginBottom: "var(--space-lg)" }}>Subscription & Billing</h4>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                            <span className="badge badge-primary" style={{ marginBottom: "8px", display: "inline-block" }}>
                                Starter Plan
                            </span>
                            <p style={{ fontSize: "0.9rem", margin: 0 }}>$19.99/month • 7-day free trial</p>
                        </div>
                        <button className="btn btn-secondary btn-sm">Upgrade Plan</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
