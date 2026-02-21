"use client";
import styles from "./CommandPreview.module.css";

export default function CommandPreview() {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <span className={styles.tag}>Your Command Center</span>
                    <h2 className={styles.title}>
                        See Everything. <span className={styles.gradient}>Control Everything.</span>
                    </h2>
                    <p className={styles.subtitle}>
                        One dashboard to manage calls, messages, leads, and revenue — powered by AI that works 24/7.
                    </p>
                    <div className={styles.outcomes}>
                        <div className={styles.outcome}>
                            <div className={styles.outcomeDot} />
                            <div>
                                <strong>Never Miss a Lead</strong>
                                <span>AI captures every call, text, and form submission instantly.</span>
                            </div>
                        </div>
                        <div className={styles.outcome}>
                            <div className={`${styles.outcomeDot} ${styles.dotAccent}`} />
                            <div>
                                <strong>Book Jobs Automatically</strong>
                                <span>AI schedules appointments based on your availability rules.</span>
                            </div>
                        </div>
                        <div className={styles.outcome}>
                            <div className={`${styles.outcomeDot} ${styles.dotSuccess}`} />
                            <div>
                                <strong>Track Performance</strong>
                                <span>Real-time analytics on revenue, conversion, and response times.</span>
                            </div>
                        </div>
                    </div>
                    <a href="/signup" className={styles.cta}>
                        Try It Free <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </a>
                </div>
                <div className={styles.preview}>
                    <div className={styles.browserFrame}>
                        <div className={styles.browserHeader}>
                            <div className={styles.browserDots}>
                                <span /><span /><span />
                            </div>
                            <div className={styles.browserUrl}>tryhustleai.com/dashboard</div>
                        </div>
                        <div className={styles.dashboardMock}>
                            {/* Simplified dashboard mockup */}
                            <div className={styles.mockSidebar}>
                                <div className={styles.mockLogo}>H</div>
                                {['Dashboard', 'Leads', 'Messages', 'Calls', 'Invoices'].map((item, i) => (
                                    <div key={i} className={`${styles.mockNavItem} ${i === 0 ? styles.mockNavActive : ''}`}>{item}</div>
                                ))}
                            </div>
                            <div className={styles.mockMain}>
                                <div className={styles.mockStats}>
                                    <div className={styles.mockStat}>
                                        <div className={styles.mockStatValue}>847</div>
                                        <div className={styles.mockStatLabel}>Leads This Month</div>
                                    </div>
                                    <div className={styles.mockStat}>
                                        <div className={`${styles.mockStatValue} ${styles.mockStatGreen}`}>$42.3K</div>
                                        <div className={styles.mockStatLabel}>Revenue Captured</div>
                                    </div>
                                    <div className={styles.mockStat}>
                                        <div className={`${styles.mockStatValue} ${styles.mockStatBlue}`}>98.2%</div>
                                        <div className={styles.mockStatLabel}>Answer Rate</div>
                                    </div>
                                </div>
                                <div className={styles.mockChart}>
                                    <div className={styles.mockChartTitle}>Revenue Trend</div>
                                    <div className={styles.mockBars}>
                                        {[40, 55, 45, 65, 50, 70, 80, 75, 90, 85, 95, 100].map((h, i) => (
                                            <div key={i} className={styles.mockBar} style={{ height: `${h}%` }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
