"use client";

import { useState, useEffect } from "react";

/* ─────────────────────────────────────────────
   PWA Install Prompt
   Shows a banner to mobile users who haven't installed
   ───────────────────────────────────────────── */

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        /* Hide in native Capacitor app */
        if (window.Capacitor) { setIsStandalone(true); return; }

        /* Check if already installed / standalone */
        const standalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            window.navigator.standalone === true;
        setIsStandalone(standalone);
        if (standalone) return;

        /* Check if dismissed recently */
        const dismissed = localStorage.getItem("pwa-install-dismissed");
        if (dismissed) {
            const dismissedAt = parseInt(dismissed, 10);
            /* Show again after 7 days */
            if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
        }

        /* Detect iOS */
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(isIOSDevice);

        /* On iOS, show the manual install prompt */
        if (isIOSDevice) {
            setShowBanner(true);
            return;
        }

        /* On Android/Chrome, listen for beforeinstallprompt */
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowBanner(true);
        };

        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setShowBanner(false);
        }
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    };

    if (!showBanner || isStandalone) return null;

    return (
        <div style={styles.banner}>
            <div style={styles.content}>
                <div style={styles.icon}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        style={{ color: "#FDCB6E" }}
                    >
                        <path
                            fillRule="evenodd"
                            d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
                <div style={styles.text}>
                    <strong style={styles.title}>Install HustleAI</strong>
                    <span style={styles.subtitle}>
                        {isIOS
                            ? "Tap Share ⎋ then 'Add to Home Screen'"
                            : "Get faster access from your home screen"}
                    </span>
                </div>
            </div>
            <div style={styles.actions}>
                {!isIOS && (
                    <button style={styles.installBtn} onClick={handleInstall}>
                        Install
                    </button>
                )}
                <button style={styles.dismissBtn} onClick={handleDismiss}>
                    ✕
                </button>
            </div>
        </div>
    );
}

const styles = {
    banner: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "12px 16px",
        background: "linear-gradient(135deg, rgba(108, 92, 231, 0.15), rgba(0, 210, 255, 0.08))",
        border: "1px solid rgba(108, 92, 231, 0.25)",
        borderRadius: "12px",
        marginBottom: "16px",
        animation: "fadeInDown 0.4s ease",
    },
    content: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flex: 1,
        minWidth: 0,
    },
    icon: {
        width: "40px",
        height: "40px",
        borderRadius: "10px",
        background: "rgba(108, 92, 231, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    text: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        minWidth: 0,
    },
    title: {
        fontSize: "0.9rem",
        fontWeight: 700,
        color: "#fff",
    },
    subtitle: {
        fontSize: "0.78rem",
        color: "#A0A0B8",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    actions: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexShrink: 0,
    },
    installBtn: {
        padding: "8px 20px",
        background: "linear-gradient(135deg, #6C5CE7, #5A4BD1)",
        color: "#fff",
        fontWeight: 600,
        fontSize: "0.85rem",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: "0 2px 8px rgba(108, 92, 231, 0.3)",
    },
    dismissBtn: {
        padding: "6px",
        background: "transparent",
        color: "#6B6B80",
        fontSize: "1rem",
        border: "none",
        cursor: "pointer",
        transition: "color 0.2s ease",
        lineHeight: 1,
    },
};
