"use client";

import { useState, useEffect } from "react";
import styles from "../dashboard.module.css";

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("company");

    // Company data
    const [company, setCompany] = useState({});
    const [subscription, setSubscription] = useState(null);

    // Team data
    const [members, setMembers] = useState([]);
    const [invites, setInvites] = useState([]);
    const [teamLimit, setTeamLimit] = useState({ limit: 1, used: 0, canInvite: false });
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("member");

    // Phone numbers
    const [phoneNumbers, setPhoneNumbers] = useState([]);
    const [phoneLimit, setPhoneLimit] = useState({ limit: 1, used: 0, canAdd: false });
    const [newNumber, setNewNumber] = useState("");
    const [newNumberLabel, setNewNumberLabel] = useState("Main");

    // Toast
    const [toast, setToast] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [compRes, teamRes, phoneRes] = await Promise.all([
                fetch("/api/company").then((r) => r.json()),
                fetch("/api/team").then((r) => r.json()).catch(() => ({ members: [], invites: [] })),
                fetch("/api/phone-numbers").then((r) => r.json()).catch(() => ({ numbers: [] })),
            ]);

            if (compRes.company) setCompany(compRes.company);
            if (compRes.subscription) setSubscription(compRes.subscription);

            if (teamRes.members) setMembers(teamRes.members);
            if (teamRes.invites) setInvites(teamRes.invites);
            setTeamLimit({ limit: teamRes.limit || 1, used: teamRes.used || 0, canInvite: teamRes.canInvite || false });

            if (phoneRes.numbers) setPhoneNumbers(phoneRes.numbers);
            setPhoneLimit({ limit: phoneRes.limit || 1, used: phoneRes.used || 0, canAdd: phoneRes.canAdd || false });
        } catch (err) {
            console.error("Settings load error:", err);
        }
        setLoading(false);
    }

    function showToast(msg, type = "success") {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    }

    // ── Save handlers ────────────────────────────
    async function saveCompany() {
        setSaving(true);
        try {
            const res = await fetch("/api/company", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: company.name,
                    phone: company.phone,
                    email: company.email,
                    serviceArea: company.serviceArea,
                }),
            });
            if (res.ok) showToast("Company info saved!");
            else showToast("Failed to save", "error");
        } catch (e) { showToast("Error saving", "error"); }
        setSaving(false);
    }

    async function saveAI() {
        setSaving(true);
        try {
            const res = await fetch("/api/company", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    aiGreeting: company.aiGreeting,
                    aiTone: company.aiTone,
                    aiServices: company.aiServices,
                    aiPricingMsg: company.aiPricingMsg,
                    aiEscalationMsg: company.aiEscalationMsg,
                }),
            });
            if (res.ok) showToast("AI settings saved!");
            else showToast("Failed to save", "error");
        } catch (e) { showToast("Error saving", "error"); }
        setSaving(false);
    }

    async function inviteMember() {
        if (!inviteEmail) return;
        try {
            const res = await fetch("/api/team", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
            });
            const data = await res.json();
            if (res.ok) {
                showToast(`Invite sent to ${inviteEmail}`);
                setInviteEmail("");
                loadData();
            } else {
                showToast(data.error || "Failed to invite", "error");
            }
        } catch (e) { showToast("Error sending invite", "error"); }
    }

    async function removeMember(userId) {
        if (!confirm("Remove this team member?")) return;
        try {
            const res = await fetch(`/api/team?userId=${userId}`, { method: "DELETE" });
            if (res.ok) { showToast("Member removed"); loadData(); }
        } catch (e) { showToast("Error removing", "error"); }
    }

    async function cancelInvite(inviteId) {
        try {
            const res = await fetch(`/api/team?inviteId=${inviteId}`, { method: "DELETE" });
            if (res.ok) { showToast("Invite cancelled"); loadData(); }
        } catch (e) { showToast("Error", "error"); }
    }

    async function addPhoneNumber() {
        if (!newNumber) return;
        try {
            const res = await fetch("/api/phone-numbers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ number: newNumber, label: newNumberLabel }),
            });
            const data = await res.json();
            if (res.ok) {
                showToast("Phone number added!");
                setNewNumber("");
                loadData();
            } else {
                showToast(data.error || data.details || "Failed", "error");
            }
        } catch (e) { showToast("Error adding number", "error"); }
    }

    async function removePhoneNumber(id) {
        if (!confirm("Remove this phone number?")) return;
        try {
            const res = await fetch(`/api/phone-numbers?id=${id}`, { method: "DELETE" });
            if (res.ok) { showToast("Number removed"); loadData(); }
        } catch (e) { showToast("Error", "error"); }
    }

    function updateCompanyField(field, value) {
        setCompany((prev) => ({ ...prev, [field]: value }));
    }

    if (loading) {
        return (
            <div>
                <div className={styles.pageHeader}>
                    <h1>Settings</h1>
                    <p>Loading configuration...</p>
                </div>
            </div>
        );
    }

    const planLabel = subscription?.plan === "business" ? "Business" : subscription?.plan === "professional" ? "Professional" : "Starter";
    const planPrice = subscription?.plan === "business" ? "$199" : subscription?.plan === "professional" ? "$99" : "$49";

    const tabs = [
        { id: "company", label: "Company" },
        { id: "ai", label: "AI Config" },
        { id: "team", label: "Team" },
        { id: "phones", label: "Phone Numbers" },
        { id: "integrations", label: "Integrations" },
        { id: "billing", label: "Billing" },
    ];

    return (
        <div>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: "fixed", top: 24, right: 24, zIndex: 999,
                    padding: "12px 24px", borderRadius: "var(--radius-md)",
                    background: toast.type === "error" ? "rgba(255,60,60,0.9)" : "rgba(0,210,255,0.9)",
                    color: "#fff", fontWeight: 600, fontSize: "0.88rem",
                    backdropFilter: "blur(8px)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                    animation: "fadeIn 0.2s ease",
                }}>
                    {toast.msg}
                </div>
            )}

            <div className={styles.pageHeader}>
                <h1>Settings</h1>
                <p>Configure your company, AI dispatcher, team, and integrations.</p>
            </div>

            {/* Tabs */}
            <div style={{
                display: "flex", gap: 4, marginBottom: "var(--space-xl)",
                background: "var(--bg-input)", borderRadius: "var(--radius-md)",
                padding: 4, overflowX: "auto",
            }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: "8px 16px", borderRadius: "var(--radius-sm)",
                            border: "none", cursor: "pointer", fontSize: "0.85rem",
                            fontWeight: 600, whiteSpace: "nowrap",
                            background: activeTab === tab.id ? "var(--accent)" : "transparent",
                            color: activeTab === tab.id ? "#000" : "var(--text-muted)",
                            transition: "all 0.2s ease",
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Company Tab */}
            {activeTab === "company" && (
                <div className="card-flat">
                    <h4 style={{ marginBottom: "var(--space-lg)" }}>Company Information</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
                        <div className="input-group">
                            <label>Company Name</label>
                            <input className="input" placeholder="Your company name"
                                value={company.name || ""} onChange={(e) => updateCompanyField("name", e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>Service Area</label>
                            <input className="input" placeholder="e.g. Las Vegas & nearby areas"
                                value={company.serviceArea || ""} onChange={(e) => updateCompanyField("serviceArea", e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>Phone</label>
                            <input className="input" placeholder="+1 (702) 555-0100"
                                value={company.phone || ""} onChange={(e) => updateCompanyField("phone", e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>Email</label>
                            <input className="input" placeholder="contact@company.com"
                                value={company.email || ""} onChange={(e) => updateCompanyField("email", e.target.value)} />
                        </div>
                    </div>
                    <button className="btn btn-primary" style={{ marginTop: "var(--space-lg)" }}
                        onClick={saveCompany} disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            )}

            {/* AI Config Tab */}
            {activeTab === "ai" && (
                <div className="card-flat">
                    <h4 style={{ marginBottom: "var(--space-lg)" }}>AI Dispatcher Settings</h4>
                    <div className="input-group" style={{ marginBottom: "var(--space-md)" }}>
                        <label>Greeting Message (Phone & SMS)</label>
                        <textarea className="input" rows={3}
                            placeholder="Hi! Thank you for calling [Company]. How can I help?"
                            value={company.aiGreeting || ""}
                            onChange={(e) => updateCompanyField("aiGreeting", e.target.value)} />
                    </div>
                    <div className="input-group" style={{ marginBottom: "var(--space-md)" }}>
                        <label>AI Tone</label>
                        <select className="input" value={company.aiTone || "friendly, professional, confident"}
                            onChange={(e) => updateCompanyField("aiTone", e.target.value)}>
                            <option value="friendly, professional, confident">Friendly & Professional</option>
                            <option value="formal, corporate, precise">Formal & Corporate</option>
                            <option value="casual, relaxed, conversational">Casual & Relaxed</option>
                            <option value="warm, empathetic, supportive">Warm & Empathetic</option>
                        </select>
                    </div>
                    <div className="input-group" style={{ marginBottom: "var(--space-md)" }}>
                        <label>Services Offered (comma separated)</label>
                        <textarea className="input" rows={2}
                            placeholder="TV mounting, Drywall repair, Painting, Furniture assembly"
                            value={(() => {
                                try { return JSON.parse(company.aiServices || "[]").join(", "); }
                                catch { return company.aiServices || ""; }
                            })()}
                            onChange={(e) => updateCompanyField("aiServices", JSON.stringify(e.target.value.split(",").map(s => s.trim()).filter(Boolean)))} />
                    </div>
                    <div className="input-group" style={{ marginBottom: "var(--space-md)" }}>
                        <label>Pricing Response</label>
                        <textarea className="input" rows={2}
                            placeholder="We offer free estimates..."
                            value={company.aiPricingMsg || ""}
                            onChange={(e) => updateCompanyField("aiPricingMsg", e.target.value)} />
                    </div>
                    <div className="input-group" style={{ marginBottom: "var(--space-md)" }}>
                        <label>Escalation Message</label>
                        <textarea className="input" rows={2}
                            placeholder="I'll forward this to our project manager..."
                            value={company.aiEscalationMsg || ""}
                            onChange={(e) => updateCompanyField("aiEscalationMsg", e.target.value)} />
                    </div>
                    <button className="btn btn-primary" onClick={saveAI} disabled={saving}>
                        {saving ? "Saving..." : "Save AI Settings"}
                    </button>
                </div>
            )}

            {/* Team Tab */}
            {activeTab === "team" && (
                <div className="card-flat">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)" }}>
                        <h4>Team Members</h4>
                        <span className="badge badge-primary">{teamLimit.used}/{teamLimit.limit === "unlimited" ? "∞" : teamLimit.limit}</span>
                    </div>

                    {/* Member list */}
                    <div style={{ display: "grid", gap: "var(--space-sm)", marginBottom: "var(--space-lg)" }}>
                        {members.map((m) => (
                            <div key={m.id} style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "12px 16px", background: "var(--bg-input)",
                                borderRadius: "var(--radius-md)", border: "1px solid var(--border)",
                            }}>
                                <div>
                                    <strong style={{ color: "var(--text-white)", fontSize: "0.9rem" }}>{m.name || m.email}</strong>
                                    <p style={{ fontSize: "0.8rem", margin: 0, color: "var(--text-muted)" }}>{m.email}</p>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span className={`badge ${m.role === "owner" ? "badge-primary" : "badge-info"}`}>{m.role}</span>
                                    {m.role !== "owner" && (
                                        <button onClick={() => removeMember(m.id)}
                                            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem" }}>
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pending invites */}
                    {invites.length > 0 && (
                        <>
                            <h5 style={{ marginBottom: "var(--space-sm)", color: "var(--text-muted)" }}>Pending Invitations</h5>
                            <div style={{ display: "grid", gap: "var(--space-sm)", marginBottom: "var(--space-lg)" }}>
                                {invites.map((inv) => (
                                    <div key={inv.id} style={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        padding: "10px 16px", background: "var(--bg-input)",
                                        borderRadius: "var(--radius-md)", border: "1px dashed var(--border)",
                                    }}>
                                        <span style={{ fontSize: "0.85rem" }}>{inv.email}</span>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <span className="badge badge-warning">pending</span>
                                            <button onClick={() => cancelInvite(inv.id)}
                                                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem" }}>
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Invite form */}
                    {teamLimit.canInvite && (
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                            <div className="input-group" style={{ flex: 1 }}>
                                <label>Invite Team Member</label>
                                <input className="input" type="email" placeholder="email@example.com"
                                    value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                            </div>
                            <select className="input" style={{ width: 120, height: 42 }}
                                value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                                <option value="member">Member</option>
                                <option value="admin">Admin</option>
                            </select>
                            <button className="btn btn-primary" style={{ height: 42 }} onClick={inviteMember}>
                                Invite
                            </button>
                        </div>
                    )}
                    {!teamLimit.canInvite && (
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                            Team member limit reached ({teamLimit.used}/{teamLimit.limit}).{" "}
                            <a href="/dashboard/billing" style={{ color: "var(--accent)" }}>Upgrade plan</a> to add more.
                        </p>
                    )}
                </div>
            )}

            {/* Phone Numbers Tab */}
            {activeTab === "phones" && (
                <div className="card-flat">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)" }}>
                        <h4>Phone Numbers</h4>
                        <span className="badge badge-primary">{phoneLimit.used}/{phoneLimit.limit === "unlimited" ? "∞" : phoneLimit.limit}</span>
                    </div>

                    <div style={{ display: "grid", gap: "var(--space-sm)", marginBottom: "var(--space-lg)" }}>
                        {phoneNumbers.length === 0 && (
                            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>No phone numbers configured yet.</p>
                        )}
                        {phoneNumbers.map((pn) => (
                            <div key={pn.id} style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "12px 16px", background: "var(--bg-input)",
                                borderRadius: "var(--radius-md)", border: "1px solid var(--border)",
                            }}>
                                <div>
                                    <strong style={{ color: "var(--text-white)", fontSize: "0.9rem" }}>{pn.number}</strong>
                                    <p style={{ fontSize: "0.8rem", margin: 0, color: "var(--text-muted)" }}>{pn.label || "Main"}</p>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    {pn.voiceEnabled && <span className="badge badge-info">Voice</span>}
                                    {pn.smsEnabled && <span className="badge badge-info">SMS</span>}
                                    <button onClick={() => removePhoneNumber(pn.id)}
                                        style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem" }}>
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {phoneLimit.canAdd && (
                        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                            <div className="input-group" style={{ flex: 1 }}>
                                <label>Add Phone Number</label>
                                <input className="input" placeholder="+17025550100"
                                    value={newNumber} onChange={(e) => setNewNumber(e.target.value)} />
                            </div>
                            <div className="input-group" style={{ width: 140 }}>
                                <label>Label</label>
                                <input className="input" placeholder="Main"
                                    value={newNumberLabel} onChange={(e) => setNewNumberLabel(e.target.value)} />
                            </div>
                            <button className="btn btn-primary" style={{ height: 42 }} onClick={addPhoneNumber}>
                                Add
                            </button>
                        </div>
                    )}
                    {!phoneLimit.canAdd && phoneNumbers.length > 0 && (
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                            Phone number limit reached ({phoneLimit.used}/{phoneLimit.limit}).{" "}
                            <a href="/dashboard/billing" style={{ color: "var(--accent)" }}>Upgrade plan</a> to add more.
                        </p>
                    )}
                </div>
            )}

            {/* Integrations Tab */}
            {activeTab === "integrations" && (
                <div className="card-flat">
                    <h4 style={{ marginBottom: "var(--space-lg)" }}>Integrations</h4>
                    <div style={{ display: "grid", gap: "var(--space-md)" }}>
                        {[
                            { name: "Twilio", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>, desc: "Phone & SMS", status: phoneNumbers.length > 0 ? "Connected" : "Not connected" },
                            { name: "Yelp", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>, desc: "Lead auto-responder", status: "Not connected" },
                            { name: "Thumbtack", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>, desc: "Lead auto-responder", status: "Not connected" },
                            { name: "Google Business", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>, desc: "Business Profile leads", status: "Not connected" },
                            { name: "Zapier / Make.com", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="24" height="24"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>, desc: "Workflow automation", status: "Not connected" },
                        ].map((int, i) => (
                            <div key={i} style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "14px 16px", background: "var(--bg-input)",
                                borderRadius: "var(--radius-md)", border: "1px solid var(--border)",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <span style={{ display: "flex", alignItems: "center" }}>{int.icon}</span>
                                    <div>
                                        <strong style={{ color: "var(--text-white)", fontSize: "0.9rem" }}>{int.name}</strong>
                                        <p style={{ fontSize: "0.8rem", margin: 0 }}>{int.desc}</p>
                                    </div>
                                </div>
                                <span className={`badge ${int.status === "Connected" ? "badge-success" : "badge-warning"}`}>
                                    {int.status}
                                </span>
                            </div>
                        ))}
                    </div>
                    <a href="/dashboard/onboarding" className="btn btn-secondary" style={{ marginTop: "var(--space-lg)" }}>
                        Run Setup Wizard →
                    </a>
                </div>
            )}

            {/* Billing Tab */}
            {activeTab === "billing" && (
                <div className="card-flat">
                    <h4 style={{ marginBottom: "var(--space-lg)" }}>Subscription & Billing</h4>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-lg)" }}>
                        <div>
                            <span className="badge badge-primary" style={{ marginBottom: "8px", display: "inline-block" }}>
                                {planLabel} Plan
                            </span>
                            <p style={{ fontSize: "0.9rem", margin: 0 }}>{planPrice}/month
                                {subscription?.status === "trialing" && " • Trial active"}
                            </p>
                        </div>
                        <a href="/dashboard/billing" className="btn btn-secondary btn-sm">Manage Billing →</a>
                    </div>

                    {/* Usage bar */}
                    {subscription && (
                        <div style={{ marginTop: "var(--space-md)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Leads this period</span>
                                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                                    {subscription.leadsUsed}/{subscription.leadsLimit === "unlimited" ? "∞" : subscription.leadsLimit}
                                </span>
                            </div>
                            <div style={{
                                height: 8, borderRadius: 4,
                                background: "var(--bg-input)",
                                overflow: "hidden",
                            }}>
                                <div style={{
                                    height: "100%", borderRadius: 4,
                                    background: "linear-gradient(90deg, var(--accent), #00ff88)",
                                    width: `${Math.min(100, (subscription.leadsUsed / (subscription.leadsLimit || 100)) * 100)}%`,
                                    transition: "width 0.3s ease",
                                }} />
                            </div>
                        </div>
                    )}

                    {/* Plan comparison */}
                    <div style={{ marginTop: "var(--space-xl)" }}>
                        <h5 style={{ marginBottom: "var(--space-md)", color: "var(--text-muted)" }}>Plan Comparison</h5>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-md)" }}>
                            {[
                                { plan: "Starter", price: "$49", leads: "100", numbers: "1", team: "1", features: ["SMS + Voice AI", "Basic Analytics", "Lead Dashboard"] },
                                { plan: "Professional", price: "$99", leads: "500", numbers: "2", team: "5", features: ["All integrations", "Custom AI Scripts", "CRM Export + Zapier"] },
                                { plan: "Business", price: "$199", leads: "Unlimited", numbers: "5", team: "Unlimited", features: ["Voice Cloning", "White-Label", "API Access + Reports"] },
                            ].map((p, i) => (
                                <div key={i} style={{
                                    padding: 16, borderRadius: "var(--radius-md)",
                                    background: "var(--bg-input)", border: `1px solid ${planLabel === p.plan ? "var(--accent)" : "var(--border)"}`,
                                    position: "relative",
                                }}>
                                    {planLabel === p.plan && (
                                        <span style={{
                                            position: "absolute", top: -10, right: 12,
                                            background: "var(--accent)", color: "#000",
                                            fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px",
                                            borderRadius: 99,
                                        }}>Current</span>
                                    )}
                                    <strong style={{ color: "var(--text-white)" }}>{p.plan}</strong>
                                    <p style={{ fontSize: "1.2rem", fontWeight: 700, margin: "4px 0 8px", color: "var(--accent)" }}>{p.price}<span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>/mo</span></p>
                                    <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                                        <p style={{ margin: "2px 0" }}>{p.leads} leads/mo</p>
                                        <p style={{ margin: "2px 0" }}>{p.numbers} phone numbers</p>
                                        <p style={{ margin: "2px 0" }}>{p.team} team members</p>
                                        {p.features.map((f, j) => (
                                            <p key={j} style={{ margin: "2px 0", color: "var(--text-white)" }}>✓ {f}</p>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
