/**
 * HustleAI — Send Invoice via Email
 * Sends a professional invoice email to the customer using Resend
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        let companyId = session?.user?.companyId;
        if (!companyId) {
            const company = await prisma.company.findFirst();
            companyId = company?.id;
        }
        if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { invoiceId } = await request.json();
        if (!invoiceId) return NextResponse.json({ error: "Invoice ID required" }, { status: 400 });

        const invoice = await prisma.invoice.findFirst({
            where: { id: invoiceId, companyId },
            include: { items: { orderBy: { sortOrder: "asc" } }, company: true },
        });

        if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        if (!invoice.customerEmail) return NextResponse.json({ error: "Customer email missing" }, { status: 400 });

        // Build the public invoice URL
        const baseUrl = process.env.NEXTAUTH_URL || "https://tryhustleai.com";
        const invoiceUrl = `${baseUrl}/invoices/${invoice.id}`;

        // Build email HTML
        const emailHtml = buildInvoiceEmail(invoice, invoiceUrl);

        // Send via Resend
        if (process.env.RESEND_API_KEY) {
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: `${invoice.company.name || "HustleAI"} <invoices@tryhustleai.com>`,
                    to: [invoice.customerEmail],
                    subject: `Invoice ${invoice.invoiceNumber} from ${invoice.company.name || "HustleAI"}`,
                    html: emailHtml,
                }),
            });

            if (!res.ok) {
                const err = await res.text();
                console.error("[Invoice Send] Resend error:", err);
                return NextResponse.json({ error: "Email send failed", details: err }, { status: 500 });
            }
        } else {
            console.log(`[Invoice Send] 📝 Logged (no RESEND_API_KEY): ${invoice.customerEmail}`);
        }

        // Update invoice status
        await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                status: "sent",
                sentAt: new Date(),
            },
        });

        return NextResponse.json({ success: true, sentTo: invoice.customerEmail });
    } catch (err) {
        console.error("[Invoice Send] Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

function buildInvoiceEmail(invoice, invoiceUrl) {
    const itemRows = invoice.items
        .map(
            (item) => `
        <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #eee;color:#333">${item.description}</td>
            <td style="padding:12px 16px;border-bottom:1px solid #eee;text-align:center;color:#333">${item.quantity}</td>
            <td style="padding:12px 16px;border-bottom:1px solid #eee;text-align:right;color:#333">$${item.unitPrice.toFixed(2)}</td>
            <td style="padding:12px 16px;border-bottom:1px solid #eee;text-align:right;font-weight:600;color:#111">$${item.amount.toFixed(2)}</td>
        </tr>`
        )
        .join("");

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
    <div style="max-width:600px;margin:0 auto;padding:24px">
        <div style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#6C5CE7,#5A4BD1);padding:32px;text-align:center">
                <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700">Invoice ${invoice.invoiceNumber}</h1>
                <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">from ${invoice.company.name || "HustleAI"}</p>
            </div>

            <!-- Body -->
            <div style="padding:32px">
                <div style="display:flex;justify-content:space-between;margin-bottom:24px">
                    <div>
                        <p style="margin:0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.05em">Bill To</p>
                        <p style="margin:4px 0 0;font-weight:600;color:#111">${invoice.customerName}</p>
                        ${invoice.customerAddress ? `<p style="margin:2px 0 0;color:#666;font-size:14px">${invoice.customerAddress}</p>` : ""}
                    </div>
                    <div style="text-align:right">
                        <p style="margin:0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.05em">Amount Due</p>
                        <p style="margin:4px 0 0;font-size:28px;font-weight:800;color:#111">$${invoice.total.toFixed(2)}</p>
                        ${invoice.dueDate ? `<p style="margin:4px 0 0;color:#666;font-size:13px">Due ${new Date(invoice.dueDate).toLocaleDateString()}</p>` : ""}
                    </div>
                </div>

                <!-- Items -->
                <table style="width:100%;border-collapse:collapse;margin:24px 0">
                    <thead>
                        <tr style="background:#f8f8f8">
                            <th style="padding:10px 16px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Description</th>
                            <th style="padding:10px 16px;text-align:center;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Qty</th>
                            <th style="padding:10px 16px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Rate</th>
                            <th style="padding:10px 16px;text-align:right;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Amount</th>
                        </tr>
                    </thead>
                    <tbody>${itemRows}</tbody>
                </table>

                <!-- Totals -->
                <div style="border-top:2px solid #eee;padding-top:16px;text-align:right">
                    <p style="margin:4px 0;color:#666;font-size:14px">Subtotal: <strong style="color:#111">$${invoice.subtotal.toFixed(2)}</strong></p>
                    ${invoice.taxAmount > 0 ? `<p style="margin:4px 0;color:#666;font-size:14px">Tax (${invoice.taxRate}%): <strong style="color:#111">$${invoice.taxAmount.toFixed(2)}</strong></p>` : ""}
                    ${invoice.discount > 0 ? `<p style="margin:4px 0;color:#666;font-size:14px">Discount: <strong style="color:#00B894">-$${invoice.discount.toFixed(2)}</strong></p>` : ""}
                    <p style="margin:12px 0 0;font-size:22px;font-weight:800;color:#111">Total: $${invoice.total.toFixed(2)}</p>
                </div>

                ${invoice.notes ? `<div style="margin-top:24px;padding:16px;background:#f8f8f8;border-radius:8px"><p style="margin:0;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Notes</p><p style="margin:8px 0 0;color:#333;font-size:14px">${invoice.notes}</p></div>` : ""}

                <!-- CTA -->
                <div style="text-align:center;margin-top:32px">
                    <a href="${invoiceUrl}" style="display:inline-block;padding:14px 40px;background:linear-gradient(135deg,#6C5CE7,#5A4BD1);color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:16px;box-shadow:0 4px 15px rgba(108,92,231,0.3)">View Invoice</a>
                </div>
            </div>

            <!-- Footer -->
            <div style="padding:20px;text-align:center;border-top:1px solid #eee">
                <p style="margin:0;font-size:12px;color:#aaa">${invoice.terms || ""}</p>
            </div>
        </div>
    </div>
</body>
</html>`;
}
