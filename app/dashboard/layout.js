"use client";

import { usePathname } from "next/navigation";
import { SessionProvider } from "next-auth/react";
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

const NAV_ITEMS = [
    { href: "/dashboard", icon: <IconOverview />, label: "Overview" },
    { href: "/dashboard/leads", icon: <IconLeads />, label: "Leads" },
    { href: "/dashboard/messages", icon: <IconMessages />, label: "Messages" },
    { href: "/dashboard/calls", icon: <IconCalls />, label: "Calls" },
    { href: "/dashboard/outreach", icon: <IconOutreach />, label: "Outreach" },
    { href: "/dashboard/market", icon: <IconMarket />, label: "Market" },
    { href: "/dashboard/billing", icon: <IconBilling />, label: "Billing" },
    { href: "/dashboard/settings", icon: <IconSettings />, label: "Settings" },
];

function DashboardLayoutInner({ children }) {
    const pathname = usePathname();

    // Skip sidebar for onboarding
    if (pathname?.startsWith("/dashboard/onboarding")) {
        return <>{children}</>;
    }

    return (
        <div className={styles.dashboardLayout}>
            <aside className={styles.sidebar}>
                <a href="/" className={styles.sidebarLogo}>
                    <IconBolt />
                    <span>Hustle<span className="text-gradient">AI</span></span>
                </a>

                <nav className={styles.sidebarNav}>
                    {NAV_ITEMS.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ""}`}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span>{item.label}</span>
                        </a>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <a href="/dashboard/onboarding" className={styles.navItem}>
                        <span className={styles.navIcon}><IconRocket /></span>
                        <span>Setup Wizard</span>
                    </a>
                    <a href="/api/auth/signout" className={styles.navItem}>
                        <span className={styles.navIcon}><IconLogout /></span>
                        <span>Sign Out</span>
                    </a>
                </div>
            </aside>

            <main className={styles.mainContent}>
                {children}
            </main>
        </div>
    );
}

export default function DashboardLayout({ children }) {
    return (
        <SessionProvider basePath="/api/auth" refetchOnWindowFocus={false} refetchInterval={0}>
            <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </SessionProvider>
    );
}
