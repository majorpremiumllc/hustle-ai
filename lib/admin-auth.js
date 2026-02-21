/**
 * HustleAI — Admin Authorization Middleware
 * Protects all /api/clients/* and /api/admin/* routes.
 * 
 * Three access levels:
 * - admin:    Full access (internal team)
 * - internal: API access with secret key (automated systems)
 * - client:   Limited access to own data only (future client portal)
 */

import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

/**
 * Validate an admin API request.
 * Checks session auth OR X-Api-Key header.
 * 
 * @param {Request} request - Incoming request
 * @param {object} options - { requiredRole: "admin" | "internal", clientId?: string }
 * @returns {Promise<{ authorized: boolean, user?: object, error?: string, status?: number }>}
 */
export async function authorizeRequest(request, options = {}) {
    const { requiredRole = "admin" } = options;

    // ── Method 1: Internal API Key ──
    const apiKey = request.headers.get("x-api-key");
    if (apiKey) {
        const validKey = process.env.ADMIN_API_KEY;
        if (!validKey) {
            console.warn("[Auth] ADMIN_API_KEY not configured");
            return { authorized: false, error: "Server misconfiguration", status: 500 };
        }

        // Constant-time comparison to prevent timing attacks
        if (apiKey.length !== validKey.length || !timingSafeEqual(apiKey, validKey)) {
            console.warn("[Auth] ❌ Invalid API key attempt");
            await logAuthFailure("invalid-api-key", request);
            return { authorized: false, error: "Invalid API key", status: 401 };
        }

        return {
            authorized: true,
            user: { role: "internal", source: "api-key" },
        };
    }

    // ── Method 2: NextAuth Session ──
    try {
        // Dynamic import to handle cases where authOptions might not be available
        const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return { authorized: false, error: "Authentication required", status: 401 };
        }

        // Check role if required
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { company: true },
        });

        if (!user) {
            return { authorized: false, error: "User not found", status: 401 };
        }

        // Role check
        if (requiredRole === "admin" && user.role !== "owner" && user.role !== "admin") {
            console.warn(`[Auth] ❌ Insufficient role: ${user.role} (need ${requiredRole})`);
            return { authorized: false, error: "Insufficient permissions", status: 403 };
        }

        return {
            authorized: true,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                companyId: user.companyId,
                source: "session",
            },
        };
    } catch (err) {
        // NextAuth not configured or session error
        console.error("[Auth] Session check failed:", err.message);
        return { authorized: false, error: "Authentication required", status: 401 };
    }
}

/**
 * Quick middleware wrapper for route handlers.
 * Returns null if authorized, or a Response if not.
 * 
 * Usage:
 *   const authError = await requireAdmin(request);
 *   if (authError) return authError;
 */
export async function requireAdmin(request) {
    const auth = await authorizeRequest(request, { requiredRole: "admin" });
    if (!auth.authorized) {
        return Response.json(
            { error: auth.error || "Unauthorized" },
            { status: auth.status || 401 }
        );
    }
    return null; // Authorized — proceed
}

/**
 * Quick middleware for internal API key auth.
 */
export async function requireInternal(request) {
    const auth = await authorizeRequest(request, { requiredRole: "internal" });
    if (!auth.authorized) {
        return Response.json(
            { error: auth.error || "Unauthorized" },
            { status: auth.status || 401 }
        );
    }
    return null;
}

/**
 * Constant-time string comparison (prevents timing attacks).
 */
function timingSafeEqual(a, b) {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

/**
 * Log failed authentication attempts for audit trail.
 */
async function logAuthFailure(reason, request) {
    try {
        const company = await prisma.company.findFirst();
        if (company) {
            await prisma.complianceLog.create({
                data: {
                    companyId: company.id,
                    event: "auth-failure",
                    details: JSON.stringify({
                        reason,
                        ip: request.headers.get("x-forwarded-for") || "unknown",
                        userAgent: request.headers.get("user-agent") || "unknown",
                        url: request.url,
                        timestamp: new Date().toISOString(),
                    }),
                },
            });
        }
    } catch { /* don't let logging break auth flow */ }
}
