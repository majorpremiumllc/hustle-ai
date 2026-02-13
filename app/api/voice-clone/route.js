/**
 * HustleAI — Voice Cloning API
 * Upload audio samples to create custom AI voices via ElevenLabs.
 * Business plan only.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";
import { checkFeature } from "@/lib/plan-limits";

async function getCompanyId() {
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.companyId) return session.user.companyId;
    } catch (e) { /* session unavailable */ }
    const company = await prisma.company.findFirst();
    return company?.id || null;
}

// GET — List available voices for company
export async function GET() {
    const companyId = await getCompanyId();
    if (!companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const featureCheck = await checkFeature(companyId, "voiceCloning");

    const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { voiceId: true, voiceProvider: true },
    });

    // Default voices always available
    const defaultVoices = [
        { id: "alloy", name: "Alloy", provider: "openai", description: "Neutral, professional" },
        { id: "echo", name: "Echo", provider: "openai", description: "Warm, conversational" },
        { id: "fable", name: "Fable", provider: "openai", description: "British, expressive" },
        { id: "onyx", name: "Onyx", provider: "openai", description: "Deep, authoritative" },
        { id: "nova", name: "Nova", provider: "openai", description: "Friendly, upbeat" },
        { id: "shimmer", name: "Shimmer", provider: "openai", description: "Clear, gentle" },
    ];

    return NextResponse.json({
        currentVoice: company?.voiceId || "alloy",
        currentProvider: company?.voiceProvider || "default",
        voiceCloningAvailable: featureCheck.allowed,
        defaultVoices,
        customVoice: company?.voiceId && company?.voiceProvider === "elevenlabs"
            ? { id: company.voiceId, name: "Custom Voice", provider: "elevenlabs" }
            : null,
    });
}

// POST — Upload audio sample for voice cloning
export async function POST(request) {
    const companyId = await getCompanyId();
    if (!companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check feature access
    const featureCheck = await checkFeature(companyId, "voiceCloning");
    if (!featureCheck.allowed) {
        return NextResponse.json({
            error: "Voice cloning is only available on the Business plan",
            details: featureCheck.reason,
        }, { status: 403 });
    }

    // Check for ElevenLabs API key
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenLabsKey) {
        return NextResponse.json({
            error: "Voice cloning service not configured",
            details: "ELEVENLABS_API_KEY not set in environment variables",
        }, { status: 503 });
    }

    try {
        const formData = await request.formData();
        const audioFile = formData.get("audio");
        const voiceName = formData.get("name") || "Custom Voice";

        if (!audioFile) {
            return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
        }

        // Call ElevenLabs API to create voice clone
        const elFormData = new FormData();
        elFormData.append("name", voiceName);
        elFormData.append("files", audioFile);
        elFormData.append("description", `Custom voice for HustleAI company ${companyId}`);

        const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
            method: "POST",
            headers: { "xi-api-key": elevenLabsKey },
            body: elFormData,
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("[VoiceClone] ElevenLabs error:", error);
            return NextResponse.json({
                error: "Voice cloning failed",
                details: error,
            }, { status: 500 });
        }

        const result = await response.json();

        // Save voice ID to company
        await prisma.company.update({
            where: { id: companyId },
            data: {
                voiceId: result.voice_id,
                voiceProvider: "elevenlabs",
            },
        });

        return NextResponse.json({
            success: true,
            voiceId: result.voice_id,
            message: "Voice clone created successfully!",
        });
    } catch (err) {
        console.error("[VoiceClone] Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

// PATCH — Switch active voice
export async function PATCH(request) {
    const companyId = await getCompanyId();
    if (!companyId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { voiceId, provider } = await request.json();

    await prisma.company.update({
        where: { id: companyId },
        data: {
            voiceId: voiceId || "alloy",
            voiceProvider: provider || "default",
        },
    });

    return NextResponse.json({ success: true, voiceId, provider });
}
