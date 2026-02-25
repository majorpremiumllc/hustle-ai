import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// DELETE — Permanently delete user account and all associated data
export async function DELETE(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Find the user and their company
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                company: true,
                ownedCompany: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // If user owns a company, delete all company data
        const companyToDelete = user.ownedCompany;
        if (companyToDelete) {
            console.log(`[Account] Deleting company ${companyToDelete.name} (${companyToDelete.id}) and all associated data`);

            // Delete related records in order (respecting foreign keys)
            await prisma.$transaction([
                // Remove team invites
                prisma.teamInvite.deleteMany({ where: { companyId: companyToDelete.id } }),
                // Remove agent logs
                prisma.agentLog.deleteMany({ where: { companyId: companyToDelete.id } }),
                // Remove phone numbers
                prisma.phoneNumber.deleteMany({ where: { companyId: companyToDelete.id } }),
                // Remove conversations
                prisma.conversation.deleteMany({ where: { companyId: companyToDelete.id } }),
                // Remove leads
                prisma.lead.deleteMany({ where: { companyId: companyToDelete.id } }),
                // Remove outreach campaigns
                prisma.outreachCampaign.deleteMany({ where: { companyId: companyToDelete.id } }),
                // Remove invoice items then invoices
                prisma.invoiceItem.deleteMany({
                    where: { invoice: { companyId: companyToDelete.id } },
                }),
                prisma.invoice.deleteMany({ where: { companyId: companyToDelete.id } }),
                // Remove integrations
                prisma.integration.deleteMany({ where: { companyId: companyToDelete.id } }),
                // Remove subscription
                prisma.subscription.deleteMany({ where: { companyId: companyToDelete.id } }),
                // Disconnect users from company
                prisma.user.updateMany({
                    where: { companyId: companyToDelete.id },
                    data: { companyId: null },
                }),
                // Delete the company
                prisma.company.delete({ where: { id: companyToDelete.id } }),
            ]);
        }

        // Delete the user account
        await prisma.user.delete({ where: { id: userId } });

        console.log(`[Account] Deleted user ${user.email} (${userId})`);

        return NextResponse.json({ success: true, message: "Account permanently deleted" });
    } catch (err) {
        console.error("[Account] Delete error:", err.message);
        return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }
}
