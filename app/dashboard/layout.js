"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { SessionProvider, useSession } from "next-auth/react";
import InstallPrompt from "../components/InstallPrompt";
import NeuralSplash from "../components/NeuralSplash";
import PaywallScreen from "../components/PaywallScreen";
import styles from "./dashboard.module.css";

/* ── SVG Nav Icons ───────────────────────────── */
const SvgIcon = ({ children, ...props }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="20" height="20" {...props}>{children}</svg>
);

const IconOverview = () => <SvgIcon><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></SvgIcon>;
const IconLeads = () => <SvgIcon><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" /></SvgIcon>;
const IconMessages = () => <SvgIcon><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></SvgIcon>;
const IconCalls = () => <SvgIcon><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></SvgIcon>;
const IconSettings = () => <SvgIcon><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></SvgIcon>;
const IconOutreach = () => <SvgIcon><circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M13 6h3a2 2 0 012 2v7" /><path d="M6 9v12" /></SvgIcon>;
const IconMarket = () => <SvgIcon><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></SvgIcon>;
const IconRocket = () => <SvgIcon><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 3 0 3 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-3 0-3" /></SvgIcon>;
const IconLogout = () => <SvgIcon><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></SvgIcon>;
const IconBolt = () => <SvgIcon><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></SvgIcon>;

const IconBilling = () => <SvgIcon><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></SvgIcon>;
const IconInvoice = () => <SvgIcon><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></SvgIcon>;

const NAV_ITEMS = [
    { href: "/dashboard", icon: <IconOverview />, label: "Overview" },
    { href: "/dashboard/leads", icon: <IconLeads />, label: "Leads" },
    { href: "/dashboard/invoices", icon: <IconInvoice />, label: "Invoices" },
    { href: "/dashboard/messages", icon: <IconMessages />, label: "Messages" },
    { href: "/dashboard/calls", icon: <IconCalls />, label: "Calls" },
    { href: "/dashboard/outreach", icon: <IconOutreach />, label: "Outreach" },
    { href: "/dashboard/market", icon: <IconMarket />, label: "Market" },
    { href: "/dashboard/billing", icon: <IconBilling />, label: "Billing" },
    { href: "/dashboard/settings", icon: <IconSettings />, label: "Settings" },
];

/* Bottom tab – 4 core items + FAB center */
const BOTTOM_TABS_LEFT = [
    { href: "/dashboard", icon: <IconOverview />, label: "Home" },
    { href: "/dashboard/invoices", icon: <IconInvoice />, label: "Invoices" },
];
const BOTTOM_TABS_RIGHT = [
    { href: "/dashboard/calls", icon: <IconCalls />, label: "Calls" },
    { href: "/dashboard/settings", icon: <IconSettings />, label: "Settings" },
];
const IconPlus = () => <SvgIcon><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></SvgIcon>;

function DashboardLayoutInner({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const fabCooldown = useRef(false);
    const { data: session } = useSession();

    /* ── Splash screen (once per session) ── */
    const [showSplash, setShowSplash] = useState(false);
    useEffect(() => {
        if (!sessionStorage.getItem("splash-shown")) {
            setShowSplash(true);
        }
    }, []);
    const handleSplashFinish = () => {
        sessionStorage.setItem("splash-shown", "1");
        setShowSplash(false);
    };

    /* ── Paywall check ── */
    const [subscription, setSubscription] = useState(null);
    const [subLoading, setSubLoading] = useState(true);
    useEffect(() => {
        fetch("/api/subscription")
            .then(r => r.json())
            .then(data => { setSubscription(data); setSubLoading(false); })
            .catch(() => setSubLoading(false));
    }, []);

    const needsPaywall = !subLoading && session &&
        (!subscription?.status || subscription?.status === "canceled" || subscription?.status === "unpaid");

    const handleFabClick = (e) => {
        e.preventDefault();
        if (fabCooldown.current) return;
        fabCooldown.current = true;
        router.push("/dashboard/invoices?create=1");
        setTimeout(() => { fabCooldown.current = false; }, 300);
    };

    // Close sidebar on route change
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    // Prevent body scroll when sidebar is open
    useEffect(() => {
        if (sidebarOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [sidebarOpen]);

    // Skip sidebar for onboarding
    if (pathname?.startsWith("/dashboard/onboarding")) {
        return <>{children}</>;
    }

    return (
        <>
            {showSplash && <NeuralSplash onFinish={handleSplashFinish} />}
            {needsPaywall && !showSplash && <PaywallScreen />}
            <div className={styles.dashboardLayout}>
                {/* ── Sidebar Overlay ─────────── */}
                <div
                    className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.sidebarOverlayVisible : ""}`}
                    onClick={() => setSidebarOpen(false)}
                />

                {/* ── Sidebar ────────────────── */}
                <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
                    <Link href="/" className={styles.sidebarLogo}>
                        <img src="/app-icon.png" alt="" style={{ width: 28, height: 28, borderRadius: 7 }} />
                        <span>Hustle<span className="text-gradient">AI</span></span>
                    </Link>

                    <nav className={styles.sidebarNav}>
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ""}`}
                            >
                                <span className={styles.navIcon}>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </nav>

                    <div className={styles.sidebarFooter}>
                        <Link href="/dashboard/onboarding" className={styles.navItem}>
                            <span className={styles.navIcon}><IconRocket /></span>
                            <span>Setup Wizard</span>
                        </Link>
                        <Link href="/api/auth/signout" className={styles.navItem}>
                            <span className={styles.navIcon}><IconLogout /></span>
                            <span>Sign Out</span>
                        </Link>
                    </div>
                </aside>

                {/* ── Main Content ─────────── */}
                <main className={styles.mainContent}>
                    {/* Mobile header bar */}
                    <div className={styles.mobileHeader}>
                        <button
                            className={`${styles.hamburger} ${sidebarOpen ? styles.hamburgerActive : ""}`}
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label="Toggle sidebar"
                        >
                            <span /><span /><span />
                        </button>
                        <Link href="/" className={styles.mobileHeaderLogo}>
                            <img src="/app-icon.png" alt="" style={{ width: 26, height: 26, borderRadius: 6 }} />
                            <span>Hustle<span className="text-gradient">AI</span></span>
                        </Link>
                        <div style={{ width: 40 }} /> {/* Spacer for centering */}
                    </div>

                    <InstallPrompt />
                    {children}
                </main>

                {/* ── Bottom Tab Bar (mobile) ── */}
                <nav className={styles.bottomTabs}>
                    {BOTTOM_TABS_LEFT.map((tab) => (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`${styles.bottomTab} ${pathname === tab.href ? styles.bottomTabActive : ""}`}
                        >
                            <span className={styles.bottomTabIcon}>{tab.icon}</span>
                            <span className={styles.bottomTabLabel}>{tab.label}</span>
                        </Link>
                    ))}
                    {/* ── FAB: New Invoice ── */}
                    <button
                        onClick={handleFabClick}
                        className={styles.fab}
                        aria-label="Create new invoice"
                        role="button"
                    >
                        <span className={styles.fabIcon}><IconPlus /></span>
                    </button>
                    {BOTTOM_TABS_RIGHT.map((tab) => (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`${styles.bottomTab} ${pathname === tab.href ? styles.bottomTabActive : ""}`}
                        >
                            <span className={styles.bottomTabIcon}>{tab.icon}</span>
                            <span className={styles.bottomTabLabel}>{tab.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>
        </>
    );
}

export default function DashboardLayout({ children }) {
    return (
        <SessionProvider basePath="/api/auth" refetchOnWindowFocus={false} refetchInterval={0} refetchWhenOffline={false}>
            <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </SessionProvider>
    );
}
