/**
 * HustleAI — AI Invoice Generator
 * Uses Gemini to auto-generate invoice from lead data or text description
 */

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `You are an invoice generator for a service business. Given job details, generate a professional invoice breakdown.

Return ONLY valid JSON (no markdown, no code fences) with this structure:
{
  "customerName": "string",
  "customerEmail": "string or null",
  "customerPhone": "string or null",
  "customerAddress": "string or null",
  "items": [
    { "description": "string", "quantity": number, "unitPrice": number }
  ],
  "taxRate": number (percentage, e.g. 8.375 for Nevada),
  "notes": "string or null",
  "discount": number (0 if none)
}

Guidelines:
- Break work into clear, specific line items
- Use realistic market pricing for service work
- Include materials as separate line items when applicable
- Labor should be itemized by task, not as a lump sum
- Default tax rate: 8.375% (Nevada) unless specified otherwise
- Be specific in descriptions (e.g. "Install 55\" Samsung TV with full-motion mount" not "TV mounting")`;

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        let companyId = session?.user?.companyId;
        if (!companyId) {
            const company = await prisma.company.findFirst();
            companyId = company?.id;
        }
        if (!companyId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { leadId, description } = body;

        let prompt = "";

        // If leadId provided, pull lead data
        if (leadId) {
            const lead = await prisma.lead.findFirst({
                where: { id: leadId, companyId },
            });
            if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

            prompt = `Generate an invoice for this job:
Customer: ${lead.customerName}
Email: ${lead.customerEmail || "N/A"}
Phone: ${lead.customerPhone || "N/A"}
Address: ${lead.address || "N/A"}
Job Type: ${lead.jobType}
Description: ${lead.notes || "General service work"}
Urgency: ${lead.urgency || "Standard"}
Estimated Value: ${lead.estimatedValue ? `$${lead.estimatedValue}` : "Estimate needed"}`;
        } else if (description) {
            prompt = `Generate an invoice for this job description:\n${description}`;
        } else {
            return NextResponse.json({ error: "Provide leadId or description" }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: SYSTEM_PROMPT,
        });

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();

        // Clean markdown code fences if any
        text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        const data = JSON.parse(text);

        return NextResponse.json({
            success: true,
            invoice: {
                customerName: data.customerName || "Customer",
                customerEmail: data.customerEmail || null,
                customerPhone: data.customerPhone || null,
                customerAddress: data.customerAddress || null,
                items: (data.items || []).map((item) => ({
                    description: item.description,
                    quantity: item.quantity || 1,
                    unitPrice: item.unitPrice || 0,
                })),
                taxRate: data.taxRate || 0,
                discount: data.discount || 0,
                notes: data.notes || null,
            },
        });
    } catch (err) {
        console.error("[Invoice AI] Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
