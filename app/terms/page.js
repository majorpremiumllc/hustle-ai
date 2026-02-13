import Link from "next/link";

export const metadata = {
    title: "Terms of Service — HustleAI",
    description: "HustleAI Terms of Service. Read our terms and conditions for using the platform.",
};

export default function TermsPage() {
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
                        Hustle<span style={{ background: "linear-gradient(135deg,#6C5CE7,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI</span>
                    </Link>
                    <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none", fontSize: "0.9rem" }}>← Back to Home</Link>
                </div>
            </nav>

            {/* Content */}
            <main style={{ maxWidth: 800, margin: "0 auto", padding: "64px 24px 96px" }}>
                <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--text-white)", marginBottom: 8 }}>Terms of Service</h1>
                <p style={{ color: "var(--text-muted)", marginBottom: 48, fontSize: "0.9rem" }}>Last updated: February 10, 2026</p>

                <div style={{ display: "grid", gap: 40 }}>
                    <Section title="1. Acceptance of Terms">
                        By accessing or using the HustleAI platform (&quot;Platform&quot;), including our website, mobile application, and AI dispatcher services, you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, do not use the Platform.
                    </Section>

                    <Section title="2. Description of Service">
                        HustleAI provides an AI-powered dispatcher platform for small businesses. Our services include:
                        <ul style={{ paddingLeft: 20, display: "grid", gap: 8, marginTop: 12 }}>
                            <li>AI-powered phone call answering and handling</li>
                            <li>Automated SMS response and lead capture</li>
                            <li>Integration with third-party platforms (Yelp, Thumbtack, Google Business)</li>
                            <li>Business dashboard for lead management and analytics</li>
                            <li>AI configuration and customization tools</li>
                        </ul>
                    </Section>

                    <Section title="3. Account Registration">
                        <p>You must create an account to use our services. You agree to provide accurate, current, and complete information. You are responsible for maintaining the security of your account credentials and for all activities that occur under your account.</p>
                        <p style={{ marginTop: 12 }}>You must be at least 18 years old and authorized to act on behalf of the business you register.</p>
                    </Section>

                    <Section title="4. Subscription & Billing">
                        <p><strong style={{ color: "var(--text-white)" }}>Plans:</strong> We offer Starter ($49/mo), Professional ($99/mo), and Business ($199/mo) plans. Annual billing is available at a 20% discount.</p>
                        <p style={{ marginTop: 8 }}><strong style={{ color: "var(--text-white)" }}>Free Trial:</strong> New accounts receive a 7-day free trial. No credit card is required to start.</p>
                        <p style={{ marginTop: 8 }}><strong style={{ color: "var(--text-white)" }}>Billing:</strong> After the trial period, you will be charged automatically based on your selected plan. Payments are processed securely via Stripe.</p>
                        <p style={{ marginTop: 8 }}><strong style={{ color: "var(--text-white)" }}>Cancellation:</strong> You may cancel your subscription at any time. Your account will remain active until the end of the current billing period.</p>
                        <p style={{ marginTop: 8 }}><strong style={{ color: "var(--text-white)" }}>Refunds:</strong> We offer a full refund within 14 days of your first payment if you are not satisfied with the service.</p>
                    </Section>

                    <Section title="5. Acceptable Use">
                        You agree not to:
                        <ul style={{ paddingLeft: 20, display: "grid", gap: 8, marginTop: 12 }}>
                            <li>Use the Platform for any unlawful purpose or in violation of any regulations</li>
                            <li>Send spam, unsolicited messages, or deceptive communications through our services</li>
                            <li>Attempt to reverse-engineer, decompile, or access the AI models underlying our services</li>
                            <li>Interfere with or disrupt the Platform or servers</li>
                            <li>Impersonate another person or entity</li>
                            <li>Use the Platform to harass, abuse, or harm others</li>
                        </ul>
                    </Section>

                    <Section title="6. AI Disclaimer">
                        <p>Our AI dispatcher is designed to assist with customer communication but is not a substitute for human judgment. While we strive for accuracy, AI responses may occasionally contain errors. You are responsible for reviewing AI interactions and ensuring they meet your business standards.</p>
                        <p style={{ marginTop: 12 }}>We do not guarantee specific business results (such as increased revenue or lead conversion rates). Results vary by business and usage patterns.</p>
                    </Section>

                    <Section title="7. Intellectual Property">
                        <p>The Platform, including its design, code, AI models, and content, is owned by HustleAI and protected by intellectual property laws. Your subscription grants you a limited, non-exclusive license to use the Platform for your business purposes.</p>
                        <p style={{ marginTop: 12 }}>You retain ownership of your business data, customer information, and content you provide to the Platform.</p>
                    </Section>

                    <Section title="8. Third-Party Integrations">
                        The Platform integrates with third-party services (Twilio, Stripe, Yelp, Thumbtack, Google Business). Your use of these integrations is also subject to the respective third-party terms of service. We are not responsible for the availability or performance of third-party services.
                    </Section>

                    <Section title="9. Limitation of Liability">
                        <p>To the maximum extent permitted by law, ServiceBot AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of revenue, data, or business opportunities.</p>
                        <p style={{ marginTop: 12 }}>Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
                    </Section>

                    <Section title="10. Privacy">
                        Your use of the Platform is also governed by our <Link href="/privacy" style={{ color: "#6C5CE7", textDecoration: "underline" }}>Privacy Policy</Link>, which describes how we collect, use, and protect your information.
                    </Section>

                    <Section title="11. Termination">
                        We may suspend or terminate your account if you violate these Terms or engage in fraudulent activity. Upon termination, your right to use the Platform ceases immediately. We will provide 30 days notice for termination without cause, during which you may export your data.
                    </Section>

                    <Section title="12. Changes to Terms">
                        We reserve the right to modify these Terms at any time. We will notify you of material changes via email or through the Platform at least 30 days before they take effect. Your continued use of the Platform after changes constitutes acceptance.
                    </Section>

                    <Section title="13. Governing Law">
                        These Terms are governed by the laws of the State of California, United States. Any disputes shall be resolved in the courts of Los Angeles County, California.
                    </Section>

                    <Section title="14. Contact">
                        For questions about these Terms, contact us at:
                        <p style={{ marginTop: 12 }}>
                            <strong style={{ color: "var(--text-white)" }}>Email:</strong> legal@servicebot.ai<br />
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
