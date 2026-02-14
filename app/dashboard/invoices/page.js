"use client";

import { useState, useEffect, useCallback } from "react";

/* ── SVG Icons ───────────────────────────────── */
const SvgIcon = ({ children, ...props }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" {...props}>{children}</svg>
);
const IconPlus = () => <SvgIcon><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></SvgIcon>;
const IconSparkle = () => <SvgIcon width="18" height="18"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></SvgIcon>;
const IconSend = () => <SvgIcon width="16" height="16"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></SvgIcon>;
const IconTrash = () => <SvgIcon width="16" height="16"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></SvgIcon>;
const IconDownload = () => <SvgIcon width="16" height="16"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></SvgIcon>;
const IconEye = () => <SvgIcon width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></SvgIcon>;
const IconEdit = () => <SvgIcon width="16" height="16"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></SvgIcon>;
const IconX = () => <SvgIcon width="18" height="18"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></SvgIcon>;
const IconReceipt = () => <SvgIcon width="16" height="16"><path d="M4 2v20l3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2z" /><line x1="8" y1="10" x2="16" y2="10" /><line x1="8" y1="14" x2="13" y2="14" /></SvgIcon>;

/* ── Status Badges ───────────────────────────── */
const STATUS_MAP = {
    draft: { label: "Draft", cls: "badge-secondary" },
    sent: { label: "Sent", cls: "badge-info" },
    viewed: { label: "Viewed", cls: "badge-warning" },
    paid: { label: "Paid", cls: "badge-success" },
    overdue: { label: "Overdue", cls: "badge-error" },
    cancelled: { label: "Cancelled", cls: "badge-secondary" },
};

const STATUSES = ["all", "draft", "sent", "viewed", "paid", "overdue"];

const TEMPLATES = [
    { id: "modern", name: "Modern", desc: "Gradient header, clean lines" },
    { id: "clean", name: "Clean", desc: "Classic professional look" },
    { id: "bold", name: "Bold", desc: "High contrast, impactful" },
    { id: "minimal", name: "Minimal", desc: "Ultra-clean, spacious" },
];

const SAMPLE_ITEMS = [
    { description: "Kitchen Faucet Repair", quantity: 1, unitPrice: 185, amount: 185 },
    { description: "Drywall Patch & Paint", quantity: 2, unitPrice: 120, amount: 240 },
    { description: "Door Lock Replacement", quantity: 1, unitPrice: 95, amount: 95 },
];

/* ═══════════════════════════════════════════════
   INVOICES PAGE
   ═══════════════════════════════════════════════ */
export default function InvoicesPage() {
    const [invoices, setInvoices] = useState([]);
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [sendingId, setSendingId] = useState(null);
    const [previewInvoice, setPreviewInvoice] = useState(null);
    const [receiptInvoice, setReceiptInvoice] = useState(null);

    // Form state
    const [form, setForm] = useState({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        customerAddress: "",
        template: "modern",
        taxRate: 8.375,
        discount: 0,
        notes: "",
        terms: "Payment is due within 30 days of invoice date.",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        items: [{ description: "", quantity: 1, unitPrice: 0 }],
        leadId: "",
        aiPrompt: "",
    });

    /* ── Fetch data ──────────────────────────── */
    const fetchInvoices = useCallback(async () => {
        try {
            const res = await fetch("/api/invoices");
            const data = await res.json();
            setInvoices(data.invoices || []);
        } catch (err) {
            console.error("Failed to fetch invoices", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchLeads = useCallback(async () => {
        try {
            const res = await fetch("/api/leads/ingest");
            const data = await res.json();
            setLeads(data.leads || []);
        } catch (err) { /* ignore */ }
    }, []);

    useEffect(() => {
        fetchInvoices();
        fetchLeads();
    }, [fetchInvoices, fetchLeads]);

    /* ── Stats ───────────────────────────────── */
    const stats = {
        totalRevenue: invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0),
        outstanding: invoices.filter((i) => ["sent", "viewed"].includes(i.status)).reduce((s, i) => s + i.total, 0),
        overdue: invoices.filter((i) => i.status === "overdue").length,
        paidCount: invoices.filter((i) => i.status === "paid").length,
    };

    /* ── Filter & search ─────────────────────── */
    const filtered = invoices.filter((inv) => {
        if (filter !== "all" && inv.status !== filter) return false;
        if (search && !inv.customerName.toLowerCase().includes(search.toLowerCase()) && !inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    /* ── Reset form ──────────────────────────── */
    const resetForm = () => {
        setForm({
            customerName: "", customerEmail: "", customerPhone: "", customerAddress: "",
            template: "modern", taxRate: 8.375, discount: 0, notes: "",
            terms: "Payment is due within 30 days of invoice date.",
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            items: [{ description: "", quantity: 1, unitPrice: 0 }],
            leadId: "", aiPrompt: "",
        });
        setEditing(null);
    };

    /* ── Open create modal ───────────────────── */
    const openCreate = () => { resetForm(); setShowModal(true); };

    /* ── Open edit modal ─────────────────────── */
    const openEdit = (inv) => {
        setForm({
            customerName: inv.customerName, customerEmail: inv.customerEmail || "",
            customerPhone: inv.customerPhone || "", customerAddress: inv.customerAddress || "",
            template: inv.template, taxRate: inv.taxRate, discount: inv.discount,
            notes: inv.notes || "", terms: inv.terms || "",
            dueDate: inv.dueDate ? inv.dueDate.split("T")[0] : "",
            items: inv.items.length > 0 ? inv.items.map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })) : [{ description: "", quantity: 1, unitPrice: 0 }],
            leadId: inv.leadId || "", aiPrompt: "",
        });
        setEditing(inv);
        setShowModal(true);
    };

    /* ── AI Generate ─────────────────────────── */
    const aiGenerate = async () => {
        setAiLoading(true);
        try {
            const payload = form.leadId ? { leadId: form.leadId } : { description: form.aiPrompt || "General handyman service" };
            const res = await fetch("/api/invoices/ai-generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.invoice) {
                setForm((prev) => ({
                    ...prev,
                    customerName: data.invoice.customerName || prev.customerName,
                    customerEmail: data.invoice.customerEmail || prev.customerEmail,
                    customerPhone: data.invoice.customerPhone || prev.customerPhone,
                    customerAddress: data.invoice.customerAddress || prev.customerAddress,
                    taxRate: data.invoice.taxRate || prev.taxRate,
                    discount: data.invoice.discount || 0,
                    notes: data.invoice.notes || prev.notes,
                    items: data.invoice.items?.length > 0 ? data.invoice.items : prev.items,
                }));
            }
        } catch (err) {
            console.error("AI generate failed", err);
        } finally {
            setAiLoading(false);
        }
    };

    /* ── Save invoice ────────────────────────── */
    const saveInvoice = async (status = "draft") => {
        try {
            const method = editing ? "PATCH" : "POST";
            const body = {
                ...form,
                status,
                ...(editing && { id: editing.id }),
            };
            const res = await fetch("/api/invoices", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                setShowModal(false);
                resetForm();
                fetchInvoices();
            }
        } catch (err) {
            console.error("Save failed", err);
        }
    };

    /* ── Send invoice ────────────────────────── */
    const sendInvoice = async (invoiceId) => {
        setSendingId(invoiceId);
        try {
            const res = await fetch("/api/invoices/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ invoiceId }),
            });
            const data = await res.json();
            if (data.success) fetchInvoices();
            else alert(data.error || "Send failed");
        } catch (err) {
            console.error("Send failed", err);
        } finally {
            setSendingId(null);
        }
    };

    /* ── Delete invoice ──────────────────────── */
    const deleteInvoice = async (id) => {
        if (!confirm("Delete this invoice?")) return;
        try {
            await fetch("/api/invoices", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            fetchInvoices();
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    /* ── Mark as paid ────────────────────────── */
    const markPaid = async (id) => {
        try {
            await fetch("/api/invoices", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: "paid", paidAt: new Date().toISOString() }),
            });
            fetchInvoices();
        } catch (err) {
            console.error("Mark paid failed", err);
        }
    };

    /* ── Item helpers ────────────────────────── */
    const addItem = () => setForm((p) => ({ ...p, items: [...p.items, { description: "", quantity: 1, unitPrice: 0 }] }));
    const removeItem = (i) => setForm((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
    const updateItem = (i, field, val) => setForm((p) => {
        const items = [...p.items];
        items[i] = { ...items[i], [field]: val };
        return { ...p, items };
    });

    const subtotal = form.items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0);
    const taxAmount = subtotal * ((form.taxRate || 0) / 100);
    const afterTaxDiscount = subtotal + taxAmount - (form.discount || 0);
    const serviceFeeAmount = afterTaxDiscount * (2.9 / 100);
    const total = afterTaxDiscount + serviceFeeAmount;

    const fmt = (n) => "$" + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    /* ═════════════════════════════════════════
       RENDER
       ═════════════════════════════════════════ */
    return (
        <div style={{ padding: "0 var(--space-md) var(--space-lg)" }} className="invoice-page-wrap">
            {/* ── Header ────────────── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-md)", flexWrap: "wrap", gap: "12px" }}>
                <div>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-white)" }}>Invoices</h2>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: 4 }}>Create, manage, and send professional invoices</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate} style={{ gap: 8 }}>
                    <IconPlus /> New Invoice
                </button>
            </div>

            {/* ── Stat Cards ────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--space-sm)", marginBottom: "var(--space-lg)" }}>
                <div className="stat-card">
                    <div className="stat-label">Total Revenue</div>
                    <div className="stat-value" style={{ color: "var(--success)" }}>{fmt(stats.totalRevenue)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Outstanding</div>
                    <div className="stat-value" style={{ color: "var(--warning)" }}>{fmt(stats.outstanding)}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Overdue</div>
                    <div className="stat-value" style={{ color: "var(--error)" }}>{stats.overdue}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Paid</div>
                    <div className="stat-value">{stats.paidCount}</div>
                </div>
            </div>

            {/* ── Filters ───────────── */}
            <div style={{ display: "flex", gap: "var(--space-xs)", marginBottom: "var(--space-md)", flexWrap: "wrap", alignItems: "center" }}>
                {STATUSES.map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        style={{
                            padding: "6px 12px", borderRadius: "var(--radius-full)", fontSize: "0.78rem", fontWeight: 600,
                            background: filter === s ? "var(--primary)" : "rgba(255,255,255,0.05)",
                            color: filter === s ? "#fff" : "var(--text-muted)",
                            border: "1px solid " + (filter === s ? "var(--primary)" : "var(--border)"),
                            cursor: "pointer", transition: "all 0.2s",
                        }}
                    >
                        {s === "all" ? "All" : STATUS_MAP[s]?.label || s}
                    </button>
                ))}
            </div>
            <input
                type="text"
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input"
                style={{ width: "100%", padding: "10px 14px", fontSize: "0.85rem", marginBottom: "var(--space-md)", borderRadius: 12 }}
            />

            {/* ── Invoice Table ──────── */}
            {loading ? (
                <div style={{ textAlign: "center", padding: 60, color: "var(--text-muted)" }}>Loading...</div>
            ) : filtered.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: 60 }}>
                    <p style={{ fontSize: "1.1rem", color: "var(--text-muted)", marginBottom: 16 }}>
                        {invoices.length === 0 ? "No invoices yet. Create your first one!" : "No invoices match your filter."}
                    </p>
                    {invoices.length === 0 && (
                        <button className="btn btn-primary" onClick={openCreate}><IconPlus /> Create Invoice</button>
                    )}
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Invoice</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((inv) => (
                                <tr key={inv.id}>
                                    <td style={{ fontWeight: 600, color: "var(--text-white)" }}>{inv.invoiceNumber}</td>
                                    <td>
                                        <div style={{ fontWeight: 500 }}>{inv.customerName}</div>
                                        {inv.customerEmail && <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{inv.customerEmail}</div>}
                                    </td>
                                    <td style={{ fontWeight: 700, color: "var(--text-white)" }}>{fmt(inv.total)}</td>
                                    <td>
                                        <span className={`badge ${STATUS_MAP[inv.status]?.cls || "badge-secondary"}`}>
                                            {STATUS_MAP[inv.status]?.label || inv.status}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                        {new Date(inv.createdAt).toLocaleDateString()}
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                                            <button
                                                onClick={() => setPreviewInvoice(inv)}
                                                title="Preview"
                                                style={actionBtnStyle}
                                            ><IconEye /></button>
                                            <button onClick={() => openEdit(inv)} title="Edit" style={actionBtnStyle}><IconEdit /></button>
                                            {inv.status === "draft" && inv.customerEmail && (
                                                <button
                                                    onClick={() => sendInvoice(inv.id)}
                                                    title="Send"
                                                    style={{ ...actionBtnStyle, color: "var(--accent)" }}
                                                    disabled={sendingId === inv.id}
                                                >
                                                    {sendingId === inv.id ? "..." : <IconSend />}
                                                </button>
                                            )}
                                            {["sent", "viewed"].includes(inv.status) && (
                                                <button
                                                    onClick={() => markPaid(inv.id)}
                                                    title="Mark Paid"
                                                    style={{ ...actionBtnStyle, color: "var(--success)", fontSize: "0.75rem", fontWeight: 700 }}
                                                >$</button>
                                            )}
                                            {inv.status === "paid" && (
                                                <button
                                                    onClick={() => setReceiptInvoice(inv)}
                                                    title="View Receipt"
                                                    style={{ ...actionBtnStyle, color: "var(--accent)" }}
                                                ><IconReceipt /></button>
                                            )}
                                            <button onClick={() => deleteInvoice(inv.id)} title="Delete" style={{ ...actionBtnStyle, color: "var(--error)" }}><IconTrash /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div style={overlayStyle} onClick={() => setShowModal(false)}>
                    <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                        {/* ── Header ── */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "0 4px" }}>
                            <h3 style={{ margin: 0, color: "var(--text-white)", fontSize: "1.2rem" }}>{editing ? "Edit Invoice" : "New Invoice"}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 8 }}><IconX /></button>
                        </div>

                        <div style={{ maxHeight: "calc(100vh - 200px)", overflowY: "auto", overflowX: "hidden", WebkitOverflowScrolling: "touch", paddingRight: 4, paddingBottom: 20 }}>
                            {/* ── AI Section ── */}
                            <div style={{ background: "linear-gradient(135deg, rgba(108,92,231,0.1), rgba(0,210,255,0.05))", border: "1px solid rgba(108,92,231,0.2)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                                    <IconSparkle />
                                    <strong style={{ color: "var(--text-white)", fontSize: "0.88rem" }}>AI Auto-Fill</strong>
                                </div>
                                <select
                                    value={form.leadId}
                                    onChange={(e) => setForm((p) => ({ ...p, leadId: e.target.value }))}
                                    className="input"
                                    style={{ width: "100%", padding: "10px 12px", fontSize: "0.85rem", marginBottom: 8, borderRadius: 10 }}
                                >
                                    <option value="">Select a lead...</option>
                                    {leads.map((l) => (
                                        <option key={l.id} value={l.id}>{l.customerName} — {l.jobType}</option>
                                    ))}
                                </select>
                                <textarea
                                    placeholder="Or describe the job (e.g. Kitchen remodel, cabinet install, plumbing...)"
                                    value={form.aiPrompt}
                                    onChange={(e) => setForm((p) => ({ ...p, aiPrompt: e.target.value }))}
                                    className="input"
                                    rows={2}
                                    style={{ width: "100%", padding: "10px 14px", fontSize: "0.85rem", lineHeight: 1.5, resize: "none", borderRadius: 10, marginBottom: 8 }}
                                />
                                <button
                                    className="btn btn-primary"
                                    onClick={aiGenerate}
                                    disabled={aiLoading}
                                    style={{ width: "100%", padding: "10px", borderRadius: 10, fontWeight: 700 }}
                                >
                                    {aiLoading ? "Generating..." : "⚡ AI Generate Invoice"}
                                </button>
                            </div>

                            {/* ── Quick Services ── */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>Quick Add</label>
                                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                    {QUICK_SERVICES.map((qs) => (
                                        <button
                                            key={qs.name}
                                            onClick={() => setForm((p) => ({ ...p, items: [...p.items.filter(i => i.description), { description: qs.name, quantity: 1, unitPrice: qs.price }] }))}
                                            style={{
                                                padding: "6px 12px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600,
                                                background: "rgba(108,92,231,0.1)", border: "1px solid rgba(108,92,231,0.2)",
                                                color: "var(--primary-light)", cursor: "pointer", transition: "all 0.2s",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {qs.name} · ${qs.price}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── Template Selector (horizontal scroll) ── */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>Style</label>
                                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
                                    {TEMPLATES.map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setForm((p) => ({ ...p, template: t.id }))}
                                            style={{
                                                flex: "0 0 auto", width: 120, borderRadius: 12, cursor: "pointer", transition: "all 0.2s",
                                                textAlign: "left", overflow: "hidden", padding: 0,
                                                background: form.template === t.id ? "rgba(108,92,231,0.1)" : "rgba(255,255,255,0.02)",
                                                border: `2px solid ${form.template === t.id ? "var(--primary)" : "var(--border)"}`,
                                            }}
                                        >
                                            <TemplateMiniPreview templateId={t.id} companyName={form.customerName || "Your Company"} />
                                            <div style={{ padding: "6px 10px", borderTop: `1px solid ${form.template === t.id ? "rgba(108,92,231,0.3)" : "var(--border)"}` }}>
                                                <div style={{ fontWeight: 700, fontSize: "0.75rem", color: form.template === t.id ? "var(--text-white)" : "var(--text-muted)" }}>{t.name}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── Customer Info (single column on mobile) ── */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>Customer</label>
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                    <input className="input" placeholder="Customer name" value={form.customerName} onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))} style={{ padding: "12px 14px", fontSize: "0.88rem", borderRadius: 10 }} />
                                    <input className="input" type="email" placeholder="Email" value={form.customerEmail} onChange={(e) => setForm((p) => ({ ...p, customerEmail: e.target.value }))} style={{ padding: "12px 14px", fontSize: "0.88rem", borderRadius: 10 }} />
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <input className="input" placeholder="Phone" value={form.customerPhone} onChange={(e) => setForm((p) => ({ ...p, customerPhone: e.target.value }))} style={{ flex: 1, padding: "12px 14px", fontSize: "0.88rem", borderRadius: 10 }} />
                                        <input className="input" placeholder="Address" value={form.customerAddress} onChange={(e) => setForm((p) => ({ ...p, customerAddress: e.target.value }))} style={{ flex: 1, padding: "12px 14px", fontSize: "0.88rem", borderRadius: 10 }} />
                                    </div>
                                </div>
                            </div>

                            {/* ── Line Items (card-based) ── */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>Line Items</label>
                                {form.items.map((item, i) => (
                                    <div key={i} style={{
                                        background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)",
                                        borderRadius: 12, padding: 12, marginBottom: 8,
                                    }}>
                                        <input
                                            className="input"
                                            placeholder="Service description"
                                            value={item.description}
                                            onChange={(e) => updateItem(i, "description", e.target.value)}
                                            style={{ width: "100%", padding: "10px 12px", fontSize: "0.85rem", borderRadius: 8, marginBottom: 8 }}
                                        />
                                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Qty</label>
                                                <input
                                                    className="input"
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(i, "quantity", parseFloat(e.target.value) || 0)}
                                                    style={{ width: "100%", padding: "8px", fontSize: "0.88rem", textAlign: "center", borderRadius: 8 }}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Price</label>
                                                <input
                                                    className="input"
                                                    type="number"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)}
                                                    style={{ width: "100%", padding: "8px", fontSize: "0.88rem", borderRadius: 8 }}
                                                />
                                            </div>
                                            <div style={{ textAlign: "right", minWidth: 60 }}>
                                                <label style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Total</label>
                                                <span style={{ fontWeight: 700, color: "var(--text-white)", fontSize: "0.92rem" }}>
                                                    {fmt((item.quantity || 0) * (item.unitPrice || 0))}
                                                </span>
                                            </div>
                                            {form.items.length > 1 && (
                                                <button onClick={() => removeItem(i)} style={{ ...actionBtnStyle, color: "var(--error)", marginTop: 14 }}><IconTrash /></button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button onClick={addItem} style={{ color: "var(--primary-light)", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", background: "none", border: "none", marginTop: 4, padding: "6px 0" }}>
                                    + Add Item
                                </button>
                            </div>

                            {/* ── Totals Section ── */}
                            <div style={{
                                background: "rgba(255,255,255,0.03)", borderRadius: 12,
                                padding: 16, marginBottom: 16, border: "1px solid var(--border)",
                            }}>
                                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Tax %</label>
                                        <input className="input" type="number" step="0.01" value={form.taxRate} onChange={(e) => setForm((p) => ({ ...p, taxRate: parseFloat(e.target.value) || 0 }))} style={{ width: "100%", padding: "8px", fontSize: "0.85rem", borderRadius: 8, textAlign: "center" }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Discount $</label>
                                        <input className="input" type="number" value={form.discount} onChange={(e) => setForm((p) => ({ ...p, discount: parseFloat(e.target.value) || 0 }))} style={{ width: "100%", padding: "8px", fontSize: "0.85rem", borderRadius: 8, textAlign: "center" }} />
                                    </div>
                                </div>
                                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 4 }}>
                                        <span>Subtotal</span><span>{fmt(subtotal)}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: 4 }}>
                                        <span>Tax</span><span>{fmt(taxAmount)}</span>
                                    </div>
                                    {form.discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--success)", marginBottom: 4 }}>
                                        <span>Discount</span><span>-{fmt(form.discount)}</span>
                                    </div>}
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "rgba(108,92,231,0.7)", marginBottom: 4 }}>
                                        <span>Service Fee (2.9%)</span><span>{fmt(serviceFeeAmount)}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                                        <span style={{ fontWeight: 700, color: "var(--text-white)" }}>Total</span>
                                        <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-white)" }}>{fmt(total)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* ── Due Date & Notes ── */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
                                <div>
                                    <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Due Date</label>
                                    <input className="input" type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} style={{ width: "100%", padding: "10px 12px", fontSize: "0.85rem", borderRadius: 10 }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginBottom: 4 }}>Notes</label>
                                    <input className="input" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional notes..." style={{ width: "100%", padding: "10px 12px", fontSize: "0.85rem", borderRadius: 10 }} />
                                </div>
                            </div>
                        </div>

                        {/* ── Actions (sticky bottom) ── */}
                        <div style={{
                            display: "flex", gap: 8, marginTop: 12, paddingTop: 14,
                            borderTop: "1px solid var(--border)",
                        }}>
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, fontSize: "0.85rem" }}>Cancel</button>
                            <button className="btn btn-primary" onClick={() => saveInvoice("draft")} style={{ flex: 2, padding: "12px", borderRadius: 10, fontSize: "0.85rem", fontWeight: 700 }}>Save Draft</button>
                            {form.customerEmail && (
                                <button className="btn btn-accent" onClick={async () => { await saveInvoice("draft"); }} style={{ flex: 2, padding: "12px", borderRadius: 10, fontSize: "0.85rem", fontWeight: 700 }}>
                                    Save & Send
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═════════════════════════════════
               PREVIEW MODAL
               ═════════════════════════════════ */}
            {previewInvoice && (
                <div style={overlayStyle} onClick={() => setPreviewInvoice(null)}>
                    <div style={{ ...modalStyle, maxWidth: 650 }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h3 style={{ margin: 0, color: "var(--text-white)" }}>Invoice Preview</h3>
                            <button onClick={() => setPreviewInvoice(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><IconX /></button>
                        </div>
                        <InvoicePreview invoice={previewInvoice} />
                    </div>
                </div>
            )}

            {/* ═════════════════════════════════
               RECEIPT MODAL
               ═════════════════════════════════ */}
            {receiptInvoice && (
                <div style={overlayStyle} onClick={() => setReceiptInvoice(null)}>
                    <div style={{ ...modalStyle, maxWidth: 550 }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                            <h3 style={{ margin: 0, color: "var(--text-white)" }}>Payment Receipt</h3>
                            <button onClick={() => setReceiptInvoice(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><IconX /></button>
                        </div>
                        <ReceiptView invoice={receiptInvoice} />
                    </div>
                </div>
            )}
        </div>
    );
}

/* ═══════════════════════════════════════════════
   INVOICE PREVIEW COMPONENT (4 Templates)
   ═══════════════════════════════════════════════ */
function InvoicePreview({ invoice }) {
    const template = invoice.template || "modern";
    const items = invoice.items || [];

    const fmt = (n) => "$" + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const dateStr = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";

    /* ── Modern Template ─────────── */
    if (template === "modern") {
        return (
            <div style={{ background: "var(--bg-card)", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg, #6C5CE7, #00D2FF)", padding: "28px 24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h2 style={{ color: "#fff", margin: 0, fontSize: "1.3rem", fontWeight: 800 }}>INVOICE</h2>
                            <p style={{ color: "rgba(255,255,255,0.7)", margin: "4px 0 0", fontSize: "0.85rem" }}>{invoice.invoiceNumber}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <p style={{ color: "#fff", margin: 0, fontSize: "1.8rem", fontWeight: 800 }}>{fmt(invoice.total)}</p>
                            <span className={`badge ${STATUS_MAP[invoice.status]?.cls}`} style={{ marginTop: 4 }}>{STATUS_MAP[invoice.status]?.label}</span>
                        </div>
                    </div>
                </div>
                <div style={{ padding: 24 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                        <div>
                            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Bill To</p>
                            <p style={{ fontWeight: 600, color: "var(--text-white)", margin: 0 }}>{invoice.customerName}</p>
                            {invoice.customerEmail && <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "2px 0 0" }}>{invoice.customerEmail}</p>}
                            {invoice.customerAddress && <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "2px 0 0" }}>{invoice.customerAddress}</p>}
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Details</p>
                            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "2px 0" }}>Date: {dateStr(invoice.createdAt)}</p>
                            {invoice.dueDate && <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "2px 0" }}>Due: {dateStr(invoice.dueDate)}</p>}
                        </div>
                    </div>
                    {renderItemsTable(items, fmt)}
                    {renderTotals(invoice, fmt)}
                    {invoice.notes && <div style={{ marginTop: 16, padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 8, fontSize: "0.82rem", color: "var(--text-muted)" }}><strong>Notes:</strong> {invoice.notes}</div>}
                </div>
            </div>
        );
    }

    /* ── Clean Template ──────────── */
    if (template === "clean") {
        return (
            <div style={{ background: "#fff", borderRadius: 12, padding: 28, color: "#333" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #eee", paddingBottom: 20, marginBottom: 20 }}>
                    <div>
                        <h2 style={{ color: "#111", margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>INVOICE</h2>
                        <p style={{ color: "#888", margin: "4px 0 0", fontSize: "0.9rem" }}>{invoice.invoiceNumber}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <p style={{ color: "#111", margin: 0, fontSize: "1.1rem", fontWeight: 700 }}>{fmt(invoice.total)}</p>
                        <p style={{ color: "#888", fontSize: "0.82rem", margin: "4px 0 0" }}>Due: {dateStr(invoice.dueDate)}</p>
                    </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                    <p style={{ fontWeight: 600, color: "#111", margin: 0 }}>{invoice.customerName}</p>
                    {invoice.customerEmail && <p style={{ color: "#666", fontSize: "0.85rem", margin: "2px 0 0" }}>{invoice.customerEmail}</p>}
                    {invoice.customerAddress && <p style={{ color: "#666", fontSize: "0.85rem", margin: "2px 0 0" }}>{invoice.customerAddress}</p>}
                </div>
                {renderItemsTableLight(items, fmt)}
                {renderTotalsLight(invoice, fmt)}
                {invoice.notes && <div style={{ marginTop: 16, padding: 12, background: "#f8f8f8", borderRadius: 8, fontSize: "0.85rem", color: "#666" }}>{invoice.notes}</div>}
            </div>
        );
    }

    /* ── Bold Template ──────────── */
    if (template === "bold") {
        return (
            <div style={{ background: "var(--bg-card)", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ background: "#111", padding: "32px 24px" }}>
                    <h2 style={{ color: "#fff", margin: 0, fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.03em" }}>INVOICE</h2>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 12 }}>
                        <div>
                            <p style={{ color: "#aaa", margin: 0, fontSize: "0.82rem" }}>{invoice.invoiceNumber}</p>
                            <p style={{ color: "#fff", fontWeight: 700, margin: "4px 0 0", fontSize: "1.1rem" }}>{invoice.customerName}</p>
                        </div>
                        <p style={{ color: "#00D2FF", margin: 0, fontSize: "2.2rem", fontWeight: 900 }}>{fmt(invoice.total)}</p>
                    </div>
                </div>
                <div style={{ padding: 24 }}>
                    {renderItemsTable(items, fmt)}
                    {renderTotals(invoice, fmt)}
                </div>
            </div>
        );
    }

    /* ── Minimal Template ────────── */
    return (
        <div style={{ background: "var(--bg-card)", borderRadius: 12, padding: 32 }}>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>Invoice</p>
            <h2 style={{ color: "var(--text-white)", margin: "0 0 4px", fontSize: "1.1rem", fontWeight: 700 }}>{invoice.invoiceNumber}</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: 24 }}>{dateStr(invoice.createdAt)}</p>
            <div style={{ marginBottom: 24 }}>
                <p style={{ color: "var(--text-white)", fontWeight: 600, margin: 0 }}>{invoice.customerName}</p>
                {invoice.customerEmail && <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: "2px 0 0" }}>{invoice.customerEmail}</p>}
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                {items.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                        <div>
                            <span style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>{item.description}</span>
                            <span style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginLeft: 8 }}>×{item.quantity}</span>
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--text-white)", fontSize: "0.88rem" }}>{fmt(item.amount)}</span>
                    </div>
                ))}
            </div>
            <div style={{ textAlign: "right", marginTop: 20 }}>
                <p style={{ color: "var(--text-white)", fontSize: "1.5rem", fontWeight: 800, margin: 0 }}>{fmt(invoice.total)}</p>
                {invoice.dueDate && <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginTop: 4 }}>Due {dateStr(invoice.dueDate)}</p>}
            </div>
        </div>
    );
}

/* ── Shared sub-components ───────────────────── */
function renderItemsTable(items, fmt) {
    return (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
            <thead>
                <tr>
                    <th style={{ textAlign: "left", padding: "8px 0", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)" }}>Description</th>
                    <th style={{ textAlign: "center", padding: "8px 0", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)" }}>Qty</th>
                    <th style={{ textAlign: "right", padding: "8px 0", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)" }}>Rate</th>
                    <th style={{ textAlign: "right", padding: "8px 0", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border)" }}>Amount</th>
                </tr>
            </thead>
            <tbody>
                {items.map((item, i) => (
                    <tr key={i}>
                        <td style={{ padding: "10px 0", color: "var(--text-secondary)", fontSize: "0.85rem", borderBottom: "1px solid var(--border)" }}>{item.description}</td>
                        <td style={{ padding: "10px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", borderBottom: "1px solid var(--border)" }}>{item.quantity}</td>
                        <td style={{ padding: "10px 0", textAlign: "right", color: "var(--text-muted)", fontSize: "0.85rem", borderBottom: "1px solid var(--border)" }}>{fmt(item.unitPrice)}</td>
                        <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 600, color: "var(--text-white)", fontSize: "0.85rem", borderBottom: "1px solid var(--border)" }}>{fmt(item.amount)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function renderItemsTableLight(items, fmt) {
    return (
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
            <thead>
                <tr>
                    <th style={{ textAlign: "left", padding: "8px 0", fontSize: "0.72rem", color: "#999", textTransform: "uppercase", borderBottom: "1px solid #eee" }}>Description</th>
                    <th style={{ textAlign: "center", padding: "8px 0", fontSize: "0.72rem", color: "#999", textTransform: "uppercase", borderBottom: "1px solid #eee" }}>Qty</th>
                    <th style={{ textAlign: "right", padding: "8px 0", fontSize: "0.72rem", color: "#999", textTransform: "uppercase", borderBottom: "1px solid #eee" }}>Rate</th>
                    <th style={{ textAlign: "right", padding: "8px 0", fontSize: "0.72rem", color: "#999", textTransform: "uppercase", borderBottom: "1px solid #eee" }}>Amount</th>
                </tr>
            </thead>
            <tbody>
                {items.map((item, i) => (
                    <tr key={i}>
                        <td style={{ padding: "10px 0", color: "#333", fontSize: "0.88rem", borderBottom: "1px solid #f0f0f0" }}>{item.description}</td>
                        <td style={{ padding: "10px 0", textAlign: "center", color: "#666", fontSize: "0.88rem", borderBottom: "1px solid #f0f0f0" }}>{item.quantity}</td>
                        <td style={{ padding: "10px 0", textAlign: "right", color: "#666", fontSize: "0.88rem", borderBottom: "1px solid #f0f0f0" }}>{fmt(item.unitPrice)}</td>
                        <td style={{ padding: "10px 0", textAlign: "right", fontWeight: 600, color: "#111", fontSize: "0.88rem", borderBottom: "1px solid #f0f0f0" }}>{fmt(item.amount)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function renderTotals(invoice, fmt) {
    return (
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, textAlign: "right" }}>
            <p style={{ margin: "4px 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>Subtotal: <strong style={{ color: "var(--text-white)" }}>{fmt(invoice.subtotal)}</strong></p>
            {invoice.taxAmount > 0 && <p style={{ margin: "4px 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>Tax ({invoice.taxRate}%): <strong style={{ color: "var(--text-white)" }}>{fmt(invoice.taxAmount)}</strong></p>}
            {invoice.discount > 0 && <p style={{ margin: "4px 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>Discount: <strong style={{ color: "var(--success)" }}>-{fmt(invoice.discount)}</strong></p>}
            {(invoice.serviceFeeAmount || 0) > 0 && <p style={{ margin: "4px 0", color: "rgba(108,92,231,0.7)", fontSize: "0.82rem" }}>Service Fee ({invoice.serviceFee || 2.9}%): <strong>{fmt(invoice.serviceFeeAmount)}</strong></p>}
            <p style={{ margin: "8px 0 0", fontSize: "1.3rem", fontWeight: 800, color: "var(--text-white)" }}>{fmt(invoice.total)}</p>
        </div>
    );
}

function renderTotalsLight(invoice, fmt) {
    return (
        <div style={{ borderTop: "2px solid #eee", paddingTop: 12, textAlign: "right" }}>
            <p style={{ margin: "4px 0", color: "#666", fontSize: "0.85rem" }}>Subtotal: <strong style={{ color: "#111" }}>{fmt(invoice.subtotal)}</strong></p>
            {invoice.taxAmount > 0 && <p style={{ margin: "4px 0", color: "#666", fontSize: "0.85rem" }}>Tax ({invoice.taxRate}%): <strong style={{ color: "#111" }}>{fmt(invoice.taxAmount)}</strong></p>}
            {invoice.discount > 0 && <p style={{ margin: "4px 0", color: "#666", fontSize: "0.85rem" }}>Discount: <strong style={{ color: "#00B894" }}>-{fmt(invoice.discount)}</strong></p>}
            {(invoice.serviceFeeAmount || 0) > 0 && <p style={{ margin: "4px 0", color: "#6C5CE7", fontSize: "0.85rem" }}>Service Fee ({invoice.serviceFee || 2.9}%): <strong>{fmt(invoice.serviceFeeAmount)}</strong></p>}
            <p style={{ margin: "8px 0 0", fontSize: "1.3rem", fontWeight: 800, color: "#111" }}>{fmt(invoice.total)}</p>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   TEMPLATE MINI PREVIEW — Premium live preview cards
   ═══════════════════════════════════════════════ */
function TemplateMiniPreview({ templateId, companyName }) {
    const name = companyName || "Your Company";
    const base = { pointerEvents: "none", fontSize: "0.5rem", lineHeight: 1.35, overflow: "hidden" };
    const miniRow = (desc, qty, price, bg) => (
        <div style={{ display: "flex", gap: 4, padding: "2.5px 0", borderBottom: `1px solid ${bg}` }}>
            <span style={{ flex: 3 }}>{desc}</span>
            <span style={{ flex: 0.5, textAlign: "center", opacity: 0.6 }}>{qty}</span>
            <span style={{ flex: 1, textAlign: "right", fontWeight: 600 }}>${price}</span>
        </div>
    );

    if (templateId === "modern") {
        return (
            <div style={{ ...base, height: 152 }}>
                <div style={{ background: "linear-gradient(135deg, #6C5CE7, #00B4D8)", padding: "9px 11px 7px", position: "relative" }}>
                    <div style={{ position: "absolute", top: 4, right: 8, width: 16, height: 16, borderRadius: "50%", background: "rgba(255,255,255,0.15)" }} />
                    <div style={{ color: "#fff", fontWeight: 800, fontSize: "0.58rem" }}>{name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 2 }}>
                        <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.38rem" }}>INV-001 • Jan 15, 2026</div>
                        <div style={{ color: "#fff", fontWeight: 800, fontSize: "0.75rem" }}>$520.00</div>
                    </div>
                </div>
                <div style={{ padding: "5px 11px 4px" }}>
                    <div style={{ display: "flex", gap: 4, padding: "0 0 2px", marginBottom: 2, borderBottom: "1px solid rgba(108,92,231,0.2)" }}>
                        <span style={{ flex: 3, fontSize: "0.36rem", color: "rgba(108,92,231,0.6)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.04em" }}>Service</span>
                        <span style={{ flex: 0.5, textAlign: "center", fontSize: "0.36rem", color: "rgba(108,92,231,0.6)", textTransform: "uppercase", fontWeight: 700 }}>Qty</span>
                        <span style={{ flex: 1, textAlign: "right", fontSize: "0.36rem", color: "rgba(108,92,231,0.6)", textTransform: "uppercase", fontWeight: 700 }}>Amount</span>
                    </div>
                    <div style={{ color: "#bbb" }}>
                        {miniRow("Kitchen Faucet Repair", "1", "185", "rgba(255,255,255,0.04)")}
                        {miniRow("Drywall Patch & Paint", "2", "240", "rgba(255,255,255,0.04)")}
                        {miniRow("Door Lock Replace", "1", "95", "transparent")}
                    </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 11px", background: "rgba(108,92,231,0.08)", borderTop: "1px solid rgba(108,92,231,0.15)" }}>
                    <span style={{ fontSize: "0.38rem", color: "var(--text-muted)" }}>Tax (8.375%)</span>
                    <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "var(--text-white)" }}>$563.54</span>
                </div>
            </div>
        );
    }
    if (templateId === "clean") {
        return (
            <div style={{ ...base, height: 152, background: "#FAFBFC", color: "#333" }}>
                <div style={{ padding: "9px 11px 6px", borderBottom: "2px solid #E8ECF1" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: "0.58rem", color: "#1a1a2e" }}>{name}</div>
                            <div style={{ fontSize: "0.36rem", color: "#8899A6", marginTop: 1 }}>Invoice #INV-001 • Due Jan 15, 2026</div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: "0.7rem", color: "#1a1a2e" }}>$520.00</div>
                    </div>
                </div>
                <div style={{ padding: "5px 11px 4px" }}>
                    <div style={{ display: "flex", gap: 4, padding: "0 0 2px", marginBottom: 2, borderBottom: "1px solid #E8ECF1" }}>
                        <span style={{ flex: 3, fontSize: "0.36rem", color: "#8899A6", textTransform: "uppercase", fontWeight: 600 }}>Description</span>
                        <span style={{ flex: 0.5, textAlign: "center", fontSize: "0.36rem", color: "#8899A6", textTransform: "uppercase", fontWeight: 600 }}>Qty</span>
                        <span style={{ flex: 1, textAlign: "right", fontSize: "0.36rem", color: "#8899A6", textTransform: "uppercase", fontWeight: 600 }}>Total</span>
                    </div>
                    <div style={{ color: "#556677" }}>
                        {miniRow("Kitchen Faucet Repair", "1", "185", "#F0F2F5")}
                        {miniRow("Drywall Patch & Paint", "2", "240", "#F0F2F5")}
                        {miniRow("Door Lock Replace", "1", "95", "transparent")}
                    </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", padding: "5px 11px", borderTop: "2px solid #E8ECF1" }}>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.36rem", color: "#8899A6" }}>Amount Due</div>
                        <div style={{ fontSize: "0.58rem", fontWeight: 800, color: "#1a1a2e" }}>$563.54</div>
                    </div>
                </div>
            </div>
        );
    }
    if (templateId === "bold") {
        return (
            <div style={{ ...base, height: 152, background: "#0a0a0f" }}>
                <div style={{ padding: "9px 11px 6px", borderBottom: "2px solid #1a1a2e" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <div style={{ color: "#fff", fontWeight: 900, fontSize: "0.7rem", letterSpacing: "-0.03em", lineHeight: 1 }}>INVOICE</div>
                            <div style={{ color: "#555", fontSize: "0.36rem", marginTop: 3 }}>#{"001"} • {name}</div>
                        </div>
                        <div style={{ background: "linear-gradient(135deg, #00D2FF, #6C5CE7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 900, fontSize: "0.85rem", letterSpacing: "-0.02em" }}>$520</div>
                    </div>
                </div>
                <div style={{ padding: "5px 11px 4px" }}>
                    <div style={{ display: "flex", gap: 4, padding: "0 0 2px", marginBottom: 2 }}>
                        <span style={{ flex: 3, fontSize: "0.36rem", color: "#444", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em" }}>Item</span>
                        <span style={{ flex: 0.5, textAlign: "center", fontSize: "0.36rem", color: "#444", textTransform: "uppercase", fontWeight: 700 }}>×</span>
                        <span style={{ flex: 1, textAlign: "right", fontSize: "0.36rem", color: "#444", textTransform: "uppercase", fontWeight: 700 }}>$</span>
                    </div>
                    <div style={{ color: "#777" }}>
                        {miniRow("Kitchen Faucet Repair", "1", "185", "rgba(255,255,255,0.04)")}
                        {miniRow("Drywall Patch & Paint", "2", "240", "rgba(255,255,255,0.04)")}
                        {miniRow("Door Lock Replace", "1", "95", "transparent")}
                    </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 11px", background: "rgba(0,210,255,0.05)", borderTop: "1px solid rgba(0,210,255,0.15)" }}>
                    <span style={{ fontSize: "0.38rem", color: "#555", fontWeight: 600 }}>TOTAL DUE</span>
                    <span style={{ fontSize: "0.58rem", fontWeight: 900, color: "#00D2FF" }}>$563.54</span>
                </div>
            </div>
        );
    }
    // Minimal
    return (
        <div style={{ ...base, height: 152, padding: "11px 13px 6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <div>
                    <div style={{ fontSize: "0.36rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.18em", fontWeight: 600 }}>Invoice</div>
                    <div style={{ fontWeight: 700, fontSize: "0.52rem", color: "var(--text-white)", marginTop: 2 }}>{name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.36rem", color: "var(--text-muted)" }}>#INV-001</div>
                    <div style={{ fontSize: "0.36rem", color: "var(--text-muted)" }}>Jan 15, 2026</div>
                </div>
            </div>
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 4 }}>
                {SAMPLE_ITEMS.map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", padding: "2.5px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                        <span>{item.description} <span style={{ opacity: 0.4 }}>×{item.quantity}</span></span>
                        <span style={{ fontWeight: 600, color: "var(--text-white)" }}>${item.amount}</span>
                    </div>
                ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6, paddingTop: 4, borderTop: "1px solid var(--border)" }}>
                <span style={{ fontWeight: 800, fontSize: "0.6rem", color: "var(--text-white)" }}>Total: $563.54</span>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════
   RECEIPT VIEW — Official US-market receipt
   ═══════════════════════════════════════════════ */
function ReceiptView({ invoice }) {
    const fmt = (n) => "$" + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const dateStr = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
    const items = invoice.items || [];

    return (
        <div style={{ background: "#fff", borderRadius: 16, padding: 28, color: "#333", maxHeight: "65vh", overflowY: "auto" }}>
            {/* Receipt stamp */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ display: "inline-block", padding: "6px 24px", border: "3px solid #00B894", borderRadius: 8, transform: "rotate(-3deg)" }}>
                    <span style={{ color: "#00B894", fontWeight: 900, fontSize: "1.1rem", letterSpacing: "0.1em" }}>PAID</span>
                </div>
            </div>

            {/* Receipt header */}
            <div style={{ textAlign: "center", marginBottom: 20, borderBottom: "2px dashed #ddd", paddingBottom: 16 }}>
                <h2 style={{ color: "#111", margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>PAYMENT RECEIPT</h2>
                <p style={{ color: "#888", fontSize: "0.82rem", margin: "4px 0" }}>{invoice.receiptNumber || "REC-" + (invoice.invoiceNumber || "").replace("INV-", "")}</p>
                <p style={{ color: "#666", fontSize: "0.82rem", margin: "2px 0" }}>Date: {dateStr(invoice.paidAt || invoice.updatedAt)}</p>
            </div>

            {/* Bill To / From */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                    <p style={{ fontSize: "0.68rem", color: "#999", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Received From</p>
                    <p style={{ fontWeight: 600, color: "#111", margin: 0, fontSize: "0.9rem" }}>{invoice.customerName}</p>
                    {invoice.customerEmail && <p style={{ color: "#666", fontSize: "0.78rem", margin: "2px 0" }}>{invoice.customerEmail}</p>}
                    {invoice.customerPhone && <p style={{ color: "#666", fontSize: "0.78rem", margin: "2px 0" }}>{invoice.customerPhone}</p>}
                </div>
                <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "0.68rem", color: "#999", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Invoice Ref</p>
                    <p style={{ fontWeight: 600, color: "#111", margin: 0, fontSize: "0.9rem" }}>{invoice.invoiceNumber}</p>
                    <p style={{ color: "#666", fontSize: "0.78rem", margin: "2px 0" }}>Issued: {dateStr(invoice.createdAt)}</p>
                    {invoice.paymentMethod && <p style={{ color: "#6C5CE7", fontSize: "0.78rem", margin: "2px 0", fontWeight: 600 }}>Via: {invoice.paymentMethod}</p>}
                </div>
            </div>

            {/* Items */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: "left", padding: "8px 0", fontSize: "0.68rem", color: "#999", textTransform: "uppercase", borderBottom: "1px solid #eee" }}>Description</th>
                        <th style={{ textAlign: "center", padding: "8px 0", fontSize: "0.68rem", color: "#999", textTransform: "uppercase", borderBottom: "1px solid #eee" }}>Qty</th>
                        <th style={{ textAlign: "right", padding: "8px 0", fontSize: "0.68rem", color: "#999", textTransform: "uppercase", borderBottom: "1px solid #eee" }}>Rate</th>
                        <th style={{ textAlign: "right", padding: "8px 0", fontSize: "0.68rem", color: "#999", textTransform: "uppercase", borderBottom: "1px solid #eee" }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, i) => (
                        <tr key={i}>
                            <td style={{ padding: "8px 0", color: "#333", fontSize: "0.85rem", borderBottom: "1px solid #f5f5f5" }}>{item.description}</td>
                            <td style={{ padding: "8px 0", textAlign: "center", color: "#666", fontSize: "0.85rem", borderBottom: "1px solid #f5f5f5" }}>{item.quantity}</td>
                            <td style={{ padding: "8px 0", textAlign: "right", color: "#666", fontSize: "0.85rem", borderBottom: "1px solid #f5f5f5" }}>{fmt(item.unitPrice)}</td>
                            <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 600, color: "#111", fontSize: "0.85rem", borderBottom: "1px solid #f5f5f5" }}>{fmt(item.amount)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div style={{ borderTop: "2px solid #eee", paddingTop: 12, textAlign: "right" }}>
                <p style={{ margin: "4px 0", color: "#666", fontSize: "0.85rem" }}>Subtotal: <strong style={{ color: "#111" }}>{fmt(invoice.subtotal)}</strong></p>
                {invoice.taxAmount > 0 && <p style={{ margin: "4px 0", color: "#666", fontSize: "0.85rem" }}>Tax ({invoice.taxRate}%): <strong style={{ color: "#111" }}>{fmt(invoice.taxAmount)}</strong></p>}
                {invoice.discount > 0 && <p style={{ margin: "4px 0", color: "#666", fontSize: "0.85rem" }}>Discount: <strong style={{ color: "#00B894" }}>-{fmt(invoice.discount)}</strong></p>}
                {(invoice.serviceFeeAmount || 0) > 0 && <p style={{ margin: "4px 0", color: "#6C5CE7", fontSize: "0.85rem" }}>Processing Fee ({invoice.serviceFee || 2.9}%): <strong>{fmt(invoice.serviceFeeAmount)}</strong></p>}
                <p style={{ margin: "12px 0 0", fontSize: "1.4rem", fontWeight: 900, color: "#00B894" }}>{fmt(invoice.total)}</p>
                <p style={{ margin: "2px 0", fontSize: "0.72rem", color: "#999", fontWeight: 500 }}>Amount Paid</p>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 20, padding: "12px 0", borderTop: "2px dashed #ddd", textAlign: "center" }}>
                <p style={{ fontSize: "0.72rem", color: "#aaa", margin: 0 }}>This receipt confirms payment for the services listed above.</p>
                <p style={{ fontSize: "0.72rem", color: "#aaa", margin: "4px 0 0" }}>Thank you for your business!</p>
                <p style={{ fontSize: "0.65rem", color: "#ccc", margin: "8px 0 0" }}>Powered by HustleAI</p>
            </div>
        </div>
    );
}

/* ── Quick Service Presets ──────────────────── */
const QUICK_SERVICES = [
    { name: "Plumbing Repair", price: 175 },
    { name: "Drywall Patch", price: 120 },
    { name: "Door Install", price: 200 },
    { name: "Painting", price: 250 },
    { name: "Fixture Install", price: 95 },
    { name: "Floor Repair", price: 180 },
];

/* ── Styles ──────────────────────────────────── */
const actionBtnStyle = {
    padding: "6px", borderRadius: "6px", cursor: "pointer", transition: "all 0.15s",
    background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
    color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center",
};

const overlayStyle = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000, padding: 0,
};

const modalStyle = {
    background: "var(--bg-secondary)", borderRadius: "20px 20px 0 0", padding: "20px 16px",
    width: "100%", maxWidth: 600,
    maxHeight: "92vh", border: "1px solid var(--border)", borderBottom: "none",
    boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
    animation: "slideUp 0.3s ease",
};
