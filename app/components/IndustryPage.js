"use client";
import styles from "./IndustryPage.module.css";
import HustleLogo from "./HustleLogo";

export default function IndustryPage({ data }) {
    return (
        <div className={styles.page}>
            {/* Nav */}
            <nav className={styles.nav}>
                <div className={styles.navInner}>
                    <a href="/" className={styles.logo}>
                        <HustleLogo variant="full" size={26} />
                    </a>
                    <div className={styles.navLinks}>
                        <a href="/#features">Features</a>
                        <a href="/#pricing">Pricing</a>
                    </div>
                    <a href="/signup" className={styles.navCta}>Start Free Trial</a>
                </div>
            </nav>

            {/* Hero */}
            <section className={styles.hero}>
                <div className={styles.heroGlow} />
                <div className={styles.heroInner}>
                    <span className={styles.badge}>AI for {data.industry}</span>
                    <h1 className={styles.headline}>{data.headline}</h1>
                    <p className={styles.subheadline}>{data.subheadline}</p>
                    <div className={styles.heroCtas}>
                        <a href="/signup" className={styles.ctaPrimary}>
                            Start Free 3-Day Trial
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </a>
                        <a href="/#pricing" className={styles.ctaSecondary}>See Pricing</a>
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className={styles.statsSection}>
                <div className={styles.statsGrid}>
                    {data.stats.map((s, i) => (
                        <div key={i} className={styles.statCard}>
                            <div className={styles.statValue}>{s.value}</div>
                            <div className={styles.statLabel}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Problem */}
            <section className={styles.section}>
                <div className={styles.sectionInner}>
                    <div className={styles.problemBlock}>
                        <span className={styles.sectionTag}>The Problem</span>
                        <h2>{data.problem.title}</h2>
                        <div className={styles.problemPoints}>
                            {data.problem.points.map((p, i) => (
                                <div key={i} className={styles.problemPoint}>
                                    <div className={styles.problemIcon}>✕</div>
                                    <p>{p}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Solution */}
            <section className={`${styles.section} ${styles.solutionSection}`}>
                <div className={styles.sectionInner}>
                    <div className={styles.solutionBlock}>
                        <span className={`${styles.sectionTag} ${styles.tagGreen}`}>The Solution</span>
                        <h2>{data.solution.title}</h2>
                        <div className={styles.solutionPoints}>
                            {data.solution.points.map((p, i) => (
                                <div key={i} className={styles.solutionPoint}>
                                    <div className={styles.checkIcon}>✓</div>
                                    <p>{p}</p>
                                </div>
                            ))}
                        </div>
                        <a href="/signup" className={styles.ctaPrimary} style={{ marginTop: 32 }}>
                            Try It Free — See It Work in 5 Minutes
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </a>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className={styles.finalCta}>
                <div className={styles.finalCtaGlow} />
                <h2>Stop Losing {data.industry} Revenue to Voicemail</h2>
                <p>Join 2,500+ business owners who automated their dispatch with AI. 3-day free trial. No credit card required.</p>
                <a href="/signup" className={styles.ctaPrimary}>
                    Start Your Free Trial
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </a>
                <div className={styles.trustBadges}>
                    <span>🛡 No credit card</span>
                    <span>🛡 Cancel anytime</span>
                    <span>🛡 5-min setup</span>
                </div>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerInner}>
                    <p>© 2026 HustleAI · Major Premium LLC · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></p>
                </div>
            </footer>
        </div>
    );
}
