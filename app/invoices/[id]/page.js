/**
 * HustleAI — Public Invoice View
 * Customer-facing page to view and pay invoices (no auth required)
 */

import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) return { title: "Invoice Not Found" };
    return {
        title: `Invoice ${invoice.invoiceNumber} — ${invoice.customerName}`,
        description: `Invoice from HustleAI for $${invoice.total.toFixed(2)}`,
    };
}

export default async function PublicInvoicePage({ params }) {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { items: { orderBy: { sortOrder: "asc" } }, company: true },
    });

    if (!invoice) notFound();

    // Mark as viewed if status is "sent"
    if (invoice.status === "sent") {
        await prisma.invoice.update({
            where: { id },
            data: { status: "viewed", viewedAt: new Date() },
        });
    }

    const fmt = (n) => "$" + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const dateStr = (d) => d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";
    const isPaid = invoice.status === "paid";

    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <meta name="theme-color" content="#0A0A14" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
                <style dangerouslySetInnerHTML={{ __html: publicStyles }} />
            </head>
            <body>
                <div className="invoice-wrapper">
                    {/* Header */}
                    <div className="invoice-header">
                        <div>
                            <h1 className="company-name">{invoice.company?.name || "HustleAI"}</h1>
                            <p className="invoice-num">{invoice.invoiceNumber}</p>
                        </div>
                        <div className="header-right">
                            <div className="total-amount">{fmt(invoice.total)}</div>
                            <span className={`status-badge status-${invoice.status}`}>
                                {isPaid ? "✓ Paid" : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </span>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="details-grid">
                        <div>
                            <p className="detail-label">Bill To</p>
                            <p className="detail-value">{invoice.customerName}</p>
                            {invoice.customerEmail && <p className="detail-sub">{invoice.customerEmail}</p>}
                            {invoice.customerPhone && <p className="detail-sub">{invoice.customerPhone}</p>}
                            {invoice.customerAddress && <p className="detail-sub">{invoice.customerAddress}</p>}
                        </div>
                        <div className="details-right">
                            <p className="detail-label">Date</p>
                            <p className="detail-value">{dateStr(invoice.createdAt)}</p>
                            {invoice.dueDate && (
                                <>
                                    <p className="detail-label" style={{ marginTop: 12 }}>Due Date</p>
                                    <p className="detail-value">{dateStr(invoice.dueDate)}</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Items — Desktop Table */}
                    <table className="items-table desktop-only">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th className="center">Qty</th>
                                <th className="right">Rate</th>
                                <th className="right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items.map((item, i) => (
                                <tr key={i}>
                                    <td>{item.description}</td>
                                    <td className="center">{item.quantity}</td>
                                    <td className="right">{fmt(item.unitPrice)}</td>
                                    <td className="right bold">{fmt(item.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Items — Mobile Cards */}
                    <div className="items-mobile mobile-only">
                        {invoice.items.map((item, i) => (
                            <div key={i} className="item-card">
                                <div className="item-desc">{item.description}</div>
                                <div className="item-meta">
                                    <span>{item.quantity} × {fmt(item.unitPrice)}</span>
                                    <span className="item-amount">{fmt(item.amount)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="totals">
                        <div className="total-row">
                            <span>Subtotal</span>
                            <span>{fmt(invoice.subtotal)}</span>
                        </div>
                        {invoice.taxAmount > 0 && (
                            <div className="total-row">
                                <span>Tax ({invoice.taxRate}%)</span>
                                <span>{fmt(invoice.taxAmount)}</span>
                            </div>
                        )}
                        {invoice.discount > 0 && (
                            <div className="total-row discount">
                                <span>Discount</span>
                                <span>-{fmt(invoice.discount)}</span>
                            </div>
                        )}
                        <div className="total-row grand-total">
                            <span>Total</span>
                            <span>{fmt(invoice.total)}</span>
                        </div>
                    </div>

                    {/* Notes */}
                    {invoice.notes && (
                        <div className="notes">
                            <p className="notes-label">Notes</p>
                            <p className="notes-text">{invoice.notes}</p>
                        </div>
                    )}

                    {/* Terms */}
                    {invoice.terms && (
                        <div className="terms">
                            <p>{invoice.terms}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="footer">
                        <p>Powered by <strong>HustleAI</strong></p>
                    </div>
                </div>
            </body>
        </html>
    );
}

const publicStyles = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        background: #f5f5f7;
        color: #333;
        min-height: 100vh;
        padding: 24px;
        -webkit-font-smoothing: antialiased;
    }
    .invoice-wrapper {
        max-width: 680px;
        margin: 0 auto;
        background: #fff;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .invoice-header {
        background: linear-gradient(135deg, #6C5CE7, #5A4BD1);
        padding: 32px 28px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
    }
    .company-name { color: #fff; font-size: 1.4rem; font-weight: 800; margin: 0; }
    .invoice-num { color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-top: 4px; }
    .header-right { text-align: right; }
    .total-amount { color: #fff; font-size: 2rem; font-weight: 800; }
    .status-badge {
        display: inline-block; padding: 4px 14px; border-radius: 20px;
        font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
        margin-top: 8px;
    }
    .status-draft { background: rgba(255,255,255,0.2); color: #fff; }
    .status-sent { background: rgba(116,185,255,0.2); color: #74B9FF; }
    .status-viewed { background: rgba(253,203,110,0.2); color: #FDCB6E; }
    .status-paid { background: rgba(0,184,148,0.2); color: #00B894; }
    .status-overdue { background: rgba(255,107,107,0.2); color: #FF6B6B; }

    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 28px; }
    .details-right { text-align: right; }
    .detail-label { font-size: 0.72rem; color: #999; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; margin-bottom: 4px; }
    .detail-value { font-weight: 600; color: #111; font-size: 0.95rem; }
    .detail-sub { color: #666; font-size: 0.85rem; margin-top: 2px; }

    /* Desktop table */
    .items-table { width: 100%; border-collapse: collapse; }
    .items-table th {
        text-align: left; padding: 12px 28px; font-size: 0.72rem; color: #999;
        text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;
        border-top: 1px solid #eee; border-bottom: 1px solid #eee; background: #fafafa;
    }
    .items-table td { padding: 14px 28px; font-size: 0.9rem; color: #333; border-bottom: 1px solid #f0f0f0; }
    .items-table .center { text-align: center; }
    .items-table .right { text-align: right; }
    .items-table .bold { font-weight: 600; color: #111; }

    /* Mobile item cards */
    .items-mobile { padding: 0 20px; }
    .item-card {
        padding: 14px; margin-bottom: 8px; border-radius: 12px;
        background: #f8f9fa; border: 1px solid #eee;
    }
    .item-desc { font-weight: 600; color: #111; font-size: 0.9rem; margin-bottom: 6px; }
    .item-meta { display: flex; justify-content: space-between; align-items: center; }
    .item-meta span { font-size: 0.82rem; color: #666; }
    .item-amount { font-weight: 700; color: #111 !important; font-size: 0.92rem !important; }

    /* Visibility */
    .mobile-only { display: none; }
    .desktop-only { display: table; }

    .totals { padding: 0 28px 24px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 0.9rem; color: #666; }
    .total-row.discount { color: #00B894; }
    .grand-total { padding-top: 12px; margin-top: 8px; border-top: 2px solid #eee; font-size: 1.3rem; font-weight: 800; color: #111; }

    .notes { margin: 0 28px 24px; padding: 16px; background: #f8f8f8; border-radius: 10px; }
    .notes-label { font-size: 0.72rem; color: #999; text-transform: uppercase; font-weight: 600; margin-bottom: 6px; }
    .notes-text { font-size: 0.88rem; color: #444; line-height: 1.5; }

    .terms { padding: 0 28px 24px; }
    .terms p { font-size: 0.78rem; color: #aaa; font-style: italic; }

    .footer { text-align: center; padding: 16px 28px; border-top: 1px solid #f0f0f0; }
    .footer p { font-size: 0.78rem; color: #ccc; }
    .footer strong { color: #6C5CE7; }

    /* ── Mobile (< 600px) ──────────────────── */
    @media (max-width: 600px) {
        body { padding: 8px; }
        .invoice-wrapper { border-radius: 16px; }
        .invoice-header { padding: 20px 16px; gap: 12px; }
        .company-name { font-size: 1.15rem; }
        .total-amount { font-size: 1.5rem; }
        .details-grid { padding: 16px; gap: 12px; grid-template-columns: 1fr; }
        .details-right { text-align: left; }
        .detail-value { font-size: 0.88rem; }

        /* Switch table → cards on mobile */
        .desktop-only { display: none !important; }
        .mobile-only { display: block !important; }

        .items-mobile { padding: 0 16px; }
        .totals { padding: 16px; }
        .notes { margin: 0 16px 16px; }
        .terms { padding: 0 16px 16px; }
        .footer { padding: 12px 16px; }
        .grand-total { font-size: 1.1rem; }
    }

    /* ── Very small (< 380px) ───────────────── */
    @media (max-width: 380px) {
        body { padding: 4px; }
        .invoice-header { padding: 16px 12px; }
        .company-name { font-size: 1rem; }
        .total-amount { font-size: 1.3rem; }
        .details-grid { padding: 12px; }
        .items-mobile { padding: 0 12px; }
        .totals { padding: 12px; }
        .notes { margin: 0 12px 12px; }
        .terms { padding: 0 12px 12px; }
    }
`;
