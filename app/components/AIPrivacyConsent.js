"use client";

import { useState, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

/* ─────────────────────────────────────────────
   AI Privacy Consent Screen
   Required by App Store Guidelines 5.1.1(i) and 5.1.2(i).
   Must be shown before the user interacts with AI features.
   Explains what data is shared, with whom, and asks consent.
   ───────────────────────────────────────────── */

const CONSENT_KEY = "ai-privacy-consent-v1";

export default function AIPrivacyConsent({ onAccept }) {
    const [checking, setChecking] = useState(true);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        (async () => {
            // Check if consent was already given
            if (Capacitor.isNativePlatform()) {
                const { value } = await Preferences.get({ key: CONSENT_KEY });
                if (value === "accepted") { setChecking(false); return; }
            } else {
                if (localStorage.getItem(CONSENT_KEY) === "accepted") { setChecking(false); return; }
            }
            setVisible(true);
            setChecking(false);
        })();
    }, []);

    const handleAccept = async () => {
        // Save consent
        if (Capacitor.isNativePlatform()) {
            await Preferences.set({ key: CONSENT_KEY, value: "accepted" });
        }
        localStorage.setItem(CONSENT_KEY, "accepted");
        setVisible(false);
        if (onAccept) onAccept();
    };

    if (checking || !visible) return null;

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
        }}>
            <div style={{
                background: "linear-gradient(180deg, #13132a 0%, #0e0e20 100%)",
                border: "1px solid rgba(108, 92, 231, 0.3)",
                borderRadius: "20px",
                padding: "32px 24px",
                maxWidth: "440px",
                width: "100%",
                maxHeight: "85vh",
                overflowY: "auto",
            }}>
                {/* Icon */}
                <div style={{
                    width: "56px", height: "56px", borderRadius: "16px",
                    background: "linear-gradient(135deg, #6C5CE7, #00d2ff)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 20px", fontSize: "24px",
                }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="M9 12l2 2 4-4" />
                    </svg>
                </div>

                {/* Title */}
                <h2 style={{
                    color: "#fff", fontSize: "1.35rem", fontWeight: 800,
                    textAlign: "center", marginBottom: "8px",
                }}>
                    AI Data Privacy
                </h2>
                <p style={{
                    color: "#a0a0b8", fontSize: "0.85rem",
                    textAlign: "center", marginBottom: "24px", lineHeight: 1.5,
                }}>
                    Hustle AI uses artificial intelligence to power its features.
                    Please review how your data is handled.
                </p>

                {/* Data disclosure sections */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                    {/* What data */}
                    <div style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px", padding: "16px",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "18px" }}>📋</span>
                            <strong style={{ color: "#fff", fontSize: "0.9rem" }}>What Data Is Shared</strong>
                        </div>
                        <ul style={{
                            margin: 0, paddingLeft: "20px",
                            color: "#c0c0d0", fontSize: "0.82rem", lineHeight: 1.7,
                        }}>
                            <li>Messages you send in the AI chat</li>
                            <li>Business information (company name, services)</li>
                            <li>Lead details (job descriptions, customer requests)</li>
                        </ul>
                    </div>

                    {/* Who receives it */}
                    <div style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px", padding: "16px",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "18px" }}>🔒</span>
                            <strong style={{ color: "#fff", fontSize: "0.9rem" }}>Who Receives Your Data</strong>
                        </div>
                        <p style={{ color: "#c0c0d0", fontSize: "0.82rem", lineHeight: 1.7, margin: 0 }}>
                            Your data is processed by <strong style={{ color: "#00d2ff" }}>Google Gemini API</strong> (Google LLC)
                            to generate AI-powered responses, estimates, and business insights.
                            Data is transmitted securely over encrypted connections.
                        </p>
                    </div>

                    {/* How it's used */}
                    <div style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "12px", padding: "16px",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                            <span style={{ fontSize: "18px" }}>⚙️</span>
                            <strong style={{ color: "#fff", fontSize: "0.9rem" }}>How Your Data Is Used</strong>
                        </div>
                        <ul style={{
                            margin: 0, paddingLeft: "20px",
                            color: "#c0c0d0", fontSize: "0.82rem", lineHeight: 1.7,
                        }}>
                            <li>Generate AI chat responses and business advice</li>
                            <li>Create estimates and customer replies</li>
                            <li>Power voice AI and lead follow-ups</li>
                            <li>Your data is not sold to third parties</li>
                        </ul>
                    </div>
                </div>

                {/* Privacy Policy link */}
                <p style={{
                    textAlign: "center", marginBottom: "20px",
                    fontSize: "0.8rem", color: "#6b6b80",
                }}>
                    By continuing, you agree to our{" "}
                    <a
                        href="https://tryhustleai.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#6C5CE7", textDecoration: "underline" }}
                    >
                        Privacy Policy
                    </a>
                </p>

                {/* Accept button */}
                <button
                    onClick={handleAccept}
                    style={{
                        width: "100%", padding: "14px",
                        borderRadius: "12px", border: "none",
                        background: "linear-gradient(135deg, #6C5CE7, #7C3AED)",
                        color: "#fff", fontSize: "0.95rem", fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                >
                    I Understand & Agree
                </button>

                {/* Decline option */}
                <button
                    onClick={() => {
                        if (Capacitor.isNativePlatform()) {
                            // On native, just go back to splash/login
                            window.location.href = "/";
                        } else {
                            window.location.href = "/";
                        }
                    }}
                    style={{
                        width: "100%", padding: "12px", marginTop: "8px",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "transparent",
                        color: "#6b6b80", fontSize: "0.85rem",
                        cursor: "pointer",
                    }}
                >
                    Decline & Sign Out
                </button>
            </div>
        </div>
    );
}
