import Link from "next/link";

export const metadata = {
    title: "Privacy Policy — HustleAI",
    description: "HustleAI Privacy Policy. Learn how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
    return (
        <div style={{ background: "var(--bg-primary)", minHeight: "100vh", color: "var(--text-secondary)" }}>
            {/* Nav */}
            <nav style={{
                position: "sticky", top: 0, zIndex: 100,
                background: "rgba(10,10,20,0.85)", backdropFilter: "blur(24px)",
                borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px",
            }}>
                <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
                    <Link href="/" style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-white)", textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22" style={{ color: "var(--primary-light)" }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                        Grow<span style={{ background: "linear-gradient(135deg,#6C5CE7,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
                    </Link>
                    <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem" }}>← Back to Home</Link>
                </div>
            </nav>

            {/* Content */}
            <main style={{ maxWidth: 800, margin: "0 auto", padding: "64px 24px 96px" }}>
                <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--text-white)", marginBottom: 8 }}>Privacy Policy</h1>
                <p style={{ color: "var(--text-muted)", marginBottom: 48, fontSize: "0.9rem" }}>Last updated: February 10, 2026</p>

                <div style={{ display: "grid", gap: 40 }}>
                    <Section title="1. Introduction">
                        HustleAI (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile application, and services (collectively, the &quot;Platform&quot;).
                    </Section>

                    <Section title="2. Information We Collect">
                        <p><strong style={{ color: "var(--text-white)" }}>Account Information:</strong> When you create an account, we collect your name, email address, phone number, business name, and industry type.</p>
                        <p><strong style={{ color: "var(--text-white)" }}>Business Data:</strong> Service types, pricing, operating hours, service area, and AI dispatcher configuration settings you provide.</p>
                        <p><strong style={{ color: "var(--text-white)" }}>Communication Data:</strong> Phone call recordings, SMS messages, and lead information processed through our AI dispatcher on your behalf.</p>
                        <p><strong style={{ color: "var(--text-white)" }}>Usage Data:</strong> Log data, device information, IP address, browser type, and pages visited.</p>
                        <p><strong style={{ color: "var(--text-white)" }}>Payment Information:</strong> Billing details processed securely through Stripe. We do not store your full credit card number.</p>
                    </Section>

                    <Section title="3. How We Use Your Information">
                        <ul style={{ paddingLeft: 20, display: "grid", gap: 8 }}>
                            <li>Provide, maintain, and improve our AI dispatcher services</li>
                            <li>Process and manage your account and subscription</li>
                            <li>Handle phone calls and SMS messages on behalf of your business</li>
                            <li>Send you service updates and notifications about leads</li>
                            <li>Analyze usage patterns to improve our platform</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </Section>

                    <Section title="4. Data Sharing">
                        We do not sell your personal information. We may share data with:
                        <ul style={{ paddingLeft: 20, display: "grid", gap: 8, marginTop: 12 }}>
                            <li><strong style={{ color: "var(--text-white)" }}>Service Providers:</strong> Twilio (phone/SMS), Stripe (payments), Google Cloud (AI processing)</li>
                            <li><strong style={{ color: "var(--text-white)" }}>Third-Party Integrations:</strong> Yelp, Thumbtack, and Google Business — only when you explicitly connect these services</li>
                            <li><strong style={{ color: "var(--text-white)" }}>Legal Requirements:</strong> When required by law or to protect our rights</li>
                        </ul>
                    </Section>

                    <Section title="5. Data Security">
                        We implement industry-standard security measures including encryption in transit (TLS/SSL) and at rest. Access to customer data is restricted to authorized personnel only. We conduct regular security reviews of our infrastructure.
                    </Section>

                    <Section title="6. Data Retention">
                        We retain your account data for as long as your account is active. Call recordings and message logs are retained for 90 days by default. You may request deletion of your data at any time by contacting us.
                    </Section>

                    <Section title="7. Your Rights">
                        You have the right to:
                        <ul style={{ paddingLeft: 20, display: "grid", gap: 8, marginTop: 12 }}>
                            <li>Access, correct, or delete your personal data</li>
                            <li>Export your data in a portable format</li>
                            <li>Opt out of marketing communications</li>
                            <li>Request information about how your data is used</li>
                            <li>Close your account at any time</li>
                        </ul>
                    </Section>

                    <Section title="8. Cookies">
                        We use essential cookies to maintain your session and preferences. We do not use third-party advertising cookies. You can manage cookie preferences in your browser settings.
                    </Section>

                    <Section title="9. Children's Privacy">
                        Our Platform is not intended for individuals under the age of 18. We do not knowingly collect data from children.
                    </Section>

                    <Section title="10. Changes to This Policy">
                        We may update this Privacy Policy from time to time. We will notify you of material changes via email or through the Platform. Your continued use after changes constitutes acceptance.
                    </Section>

                    <Section title="11. Contact Us">
                        If you have questions about this Privacy Policy, contact us at:
                        <p style={{ marginTop: 12 }}>
                            <strong style={{ color: "var(--text-white)" }}>Email:</strong> privacy@servicebot.ai<br />
                            <strong style={{ color: "var(--text-white)" }}>Website:</strong> servicebot.ai
                        </p>
                    </Section>
                </div>
            </main>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <section>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-white)", marginBottom: 12 }}>{title}</h2>
            <div style={{ lineHeight: 1.7, fontSize: "0.95rem" }}>{children}</div>
        </section>
    );
}
