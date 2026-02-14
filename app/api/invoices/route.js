/**
 * HustleAI — Invoice API
 * CRUD operations for invoices with service fee calculation
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

const PLATFORM_FEE_PERCENT = 2.9; // HustleAI service fee

// ── Helper: get companyId from session ─────────
async function getCompanyId() {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.companyId) return session.user.companyId;
    } catch (e) { /* session unavailable */ }
    const company = await prisma.company.findFirst();
    return company?.id || null;
}

// ── Helper: generate next invoice number ───────
async function nextInvoiceNumber(companyId) {
    const count = await prisma.invoice.count({ where: { companyId } });
    return `INV-${String(count + 1).padStart(3, "0")}`;
}

// ── Helper: generate receipt number ────────────
async function nextReceiptNumber(companyId) {
    const count = await prisma.invoice.count({ where: { companyId, status: "paid" } });
    return `REC-${String(count + 1).padStart(3, "0")}`;
}

// ── Helper: calculate totals with service fee ──
function calcTotals(items, taxRate, discount, serviceFeePercent) {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity || 1) * (item.unitPrice || 0), 0);
    const taxAmount = subtotal * ((taxRate || 0) / 100);
    const afterTaxDiscount = subtotal + taxAmount - (discount || 0);
    const sfPercent = serviceFeePercent ?? PLATFORM_FEE_PERCENT;
    const serviceFeeAmount = afterTaxDiscount * (sfPercent / 100);
    const total = afterTaxDiscount + serviceFeeAmount;
    return { subtotal, taxAmount, serviceFee: sfPercent, serviceFeeAmount: Math.round(serviceFeeAmount * 100) / 100, total: Math.round(total * 100) / 100 };
}

// GET — List all invoices
export async function GET() {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const invoices = await prisma.invoice.findMany({
            where: { companyId },
            include: { items: { orderBy: { sortOrder: "asc" } } },
            orderBy: { createdAt: "desc" },
            take: 200,
        });
        return NextResponse.json({ invoices });
    } catch (err) {
        console.error("[Invoices] GET error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// POST — Create a new invoice
export async function POST(request) {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        const invoiceNumber = body.invoiceNumber || await nextInvoiceNumber(companyId);
        const items = body.items || [];
        const totals = calcTotals(items, body.taxRate, body.discount, body.serviceFee);

        const invoice = await prisma.invoice.create({
            data: {
                companyId,
                leadId: body.leadId || null,
                invoiceNumber,
                customerName: body.customerName || "Customer",
                customerEmail: body.customerEmail || null,
                customerPhone: body.customerPhone || null,
                customerAddress: body.customerAddress || null,
                status: body.status || "draft",
                template: body.template || "modern",
                subtotal: totals.subtotal,
                taxRate: body.taxRate || 0,
                taxAmount: totals.taxAmount,
                discount: body.discount || 0,
                serviceFee: totals.serviceFee,
                serviceFeeAmount: totals.serviceFeeAmount,
                total: totals.total,
                currency: body.currency || "USD",
                dueDate: body.dueDate ? new Date(body.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                notes: body.notes || null,
                terms: body.terms || "Payment is due within 30 days of invoice date.",
                items: {
                    create: items.map((item, i) => ({
                        description: item.description || "",
                        quantity: item.quantity || 1,
                        unitPrice: item.unitPrice || 0,
                        amount: (item.quantity || 1) * (item.unitPrice || 0),
                        sortOrder: i,
                    })),
                },
            },
            include: { items: true },
        });

        return NextResponse.json({ success: true, invoice });
    } catch (err) {
        console.error("[Invoices] POST error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PATCH — Update an invoice
export async function PATCH(request) {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await request.json();
        // Whitelist only DB-safe fields
        const allowedFields = [
            "customerName", "customerEmail", "customerPhone", "customerAddress",
            "status", "template", "subtotal", "taxRate", "taxAmount", "discount",
            "serviceFee", "serviceFeeAmount", "total", "currency", "dueDate",
            "paidAt", "sentAt", "viewedAt", "notes", "terms", "paymentMethod",
            "stripePaymentLink", "receiptNumber",
        ];
        const id = body.id;
        const items = body.items;
        const updateData = {};
        for (const key of allowedFields) {
            if (body[key] !== undefined) updateData[key] = body[key];
        }

        if (!id) return NextResponse.json({ error: "Invoice ID required" }, { status: 400 });

        const existing = await prisma.invoice.findFirst({ where: { id, companyId } });
        if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

        // Recalculate totals if items provided
        if (items) {
            const totals = calcTotals(items, updateData.taxRate ?? existing.taxRate, updateData.discount ?? existing.discount, updateData.serviceFee ?? existing.serviceFee);
            updateData.subtotal = totals.subtotal;
            updateData.taxRate = totals.serviceFee !== undefined ? updateData.taxRate ?? existing.taxRate : existing.taxRate;
            updateData.taxAmount = totals.taxAmount;
            updateData.serviceFee = totals.serviceFee;
            updateData.serviceFeeAmount = totals.serviceFeeAmount;
            updateData.total = totals.total;

            await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });
            await prisma.invoiceItem.createMany({
                data: items.map((item, i) => ({
                    invoiceId: id,
                    description: item.description || "",
                    quantity: item.quantity || 1,
                    unitPrice: item.unitPrice || 0,
                    amount: (item.quantity || 1) * (item.unitPrice || 0),
                    sortOrder: i,
                })),
            });
        }

        // Handle date fields
        if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);
        if (updateData.paidAt) updateData.paidAt = new Date(updateData.paidAt);

        // Auto-generate receipt number when marking as paid
        if (updateData.status === "paid" && existing.status !== "paid") {
            updateData.receiptNumber = await nextReceiptNumber(companyId);
            if (!updateData.paidAt) updateData.paidAt = new Date();
        }

        const invoice = await prisma.invoice.update({
            where: { id },
            data: updateData,
            include: { items: { orderBy: { sortOrder: "asc" } } },
        });

        return NextResponse.json({ success: true, invoice });
    } catch (err) {
        console.error("[Invoices] PATCH error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// DELETE — Delete an invoice
export async function DELETE(request) {
    const companyId = await getCompanyId();
    if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await request.json();
        if (!id) return NextResponse.json({ error: "Invoice ID required" }, { status: 400 });

        const existing = await prisma.invoice.findFirst({ where: { id, companyId } });
        if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

        await prisma.invoice.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[Invoices] DELETE error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
