"use client";

import "../globals.css";

const BLOG_POSTS = [
    {
        slug: "ai-phone-answering-small-business",
        title: "AI Phone Answering for Small Business: The Ultimate Guide (2026)",
        excerpt: "Never miss a call again. Learn how AI phone answering works, what it costs, and why 10,000+ small businesses switched from voicemail.",
        date: "2026-02-12",
        readTime: "8 min read",
        category: "AI Phone",
    },
    {
        slug: "automate-appointment-scheduling-ai",
        title: "How to Automate Appointment Scheduling with AI in 2026",
        excerpt: "Eliminate no-shows and double bookings. Step-by-step guide to setting up AI-powered scheduling that books jobs 24/7.",
        date: "2026-02-12",
        readTime: "6 min read",
        category: "Scheduling",
    },
    {
        slug: "ai-vs-virtual-receptionist-cost",
        title: "AI vs Virtual Receptionist: Cost Comparison 2026 (Real Numbers)",
        excerpt: "We ran the numbers on 8 popular services. AI receptionists save $2,100/month on average — here's the full breakdown.",
        date: "2026-02-11",
        readTime: "7 min read",
        category: "Comparison",
    },
    {
        slug: "lead-follow-up-automation-guide",
        title: "Lead Follow-Up Automation: The Complete Guide for Service Businesses",
        excerpt: "The data is clear — 78% of customers buy from whoever responds first. Here's how to automate your follow-up and win every time.",
        date: "2026-02-11",
        readTime: "6 min read",
        category: "Lead Generation",
    },
    {
        slug: "ai-text-marketing-local-business",
        title: "AI Text Marketing for Local Businesses: 98% Open Rate Strategy",
        excerpt: "Email is dead for local. SMS gets 98% opens. Learn the exact AI text campaigns that service businesses use to fill their calendar.",
        date: "2026-02-10",
        readTime: "7 min read",
        category: "SMS Marketing",
    },
    {
        slug: "service-business-win-more-clients-ai",
        title: "How Service Businesses Win 3x More Clients with AI (Case Studies)",
        excerpt: "Real stories from plumbers, electricians, and HVAC companies that tripled revenue using AI automation. With actual numbers.",
        date: "2026-02-10",
        readTime: "9 min read",
        category: "Case Studies",
    },
    {
        slug: "ai-automation-service-business",
        title: "How AI Automation Is Transforming Service Businesses in 2026",
        excerpt: "Discover how plumbers, HVAC techs, and contractors are using AI to capture more leads, answer calls 24/7, and grow revenue by 3x.",
        date: "2026-02-10",
        readTime: "5 min read",
        category: "AI Automation",
    },
    {
        slug: "ai-receptionist-vs-answering-service",
        title: "AI Receptionist vs. Traditional Answering Service: Which Is Better?",
        excerpt: "We compare cost, quality, and speed. Spoiler: AI receptionists cost 90% less and never put callers on hold.",
        date: "2026-02-08",
        readTime: "4 min read",
        category: "Comparison",
    },
    {
        slug: "how-to-get-more-leads-contractors",
        title: "7 Proven Ways Contractors Can Get More Leads in 2026",
        excerpt: "From AI-powered follow-ups to automated SMS marketing, here are the strategies top contractors use to fill their pipeline.",
        date: "2026-02-05",
        readTime: "6 min read",
        category: "Lead Generation",
    },
    {
        slug: "ai-sms-marketing-small-business",
        title: "AI SMS Marketing for Small Business: The Complete Guide",
        excerpt: "Learn how to set up automated text message campaigns that get 98% open rates and convert leads while you sleep.",
        date: "2026-02-01",
        readTime: "7 min read",
        category: "SMS Marketing",
    },
    {
        slug: "automate-customer-follow-ups",
        title: "Stop Losing Customers: How to Automate Follow-Ups With AI",
        excerpt: "80% of sales require 5+ follow-ups, but most businesses only do 1. Here's how AI handles the rest automatically.",
        date: "2026-01-28",
        readTime: "5 min read",
        category: "Sales Automation",
    },
    {
        slug: "best-crm-for-plumbers-hvac-electricians",
        title: "Best CRM for Plumbers, HVAC & Electricians (2026 Review)",
        excerpt: "We review the top CRMs for service businesses and explain why AI-native platforms are winning.",
        date: "2026-01-25",
        readTime: "8 min read",
        category: "Reviews",
    },
];

// Metadata is handled via <title> tag in the component for client components

export default function BlogPage() {
    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary, #0A0A14)" }}>
            {/* Header */}
            <nav style={{
                padding: "16px 32px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
                <a href="/" style={{ color: "var(--accent, #00d2ff)", fontWeight: 700, fontSize: "1.2rem", textDecoration: "none" }}>
                    ⚡ HustleAI
                </a>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <a href="/blog" style={{ color: "var(--accent, #00d2ff)", textDecoration: "none", fontSize: "0.9rem" }}>Blog</a>
                    <a href="/login" style={{ color: "var(--text-muted, #888)", textDecoration: "none", fontSize: "0.9rem" }}>Login</a>
                    <a href="/signup" style={{
                        background: "var(--accent, #00d2ff)", color: "#000", padding: "8px 20px",
                        borderRadius: 8, textDecoration: "none", fontSize: "0.85rem", fontWeight: 600,
                    }}>
                        Start Free
                    </a>
                </div>
            </nav>

            {/* Hero */}
            <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px 40px" }}>
                <h1 style={{ fontSize: "2.4rem", fontWeight: 800, marginBottom: 12, background: "linear-gradient(135deg, #fff, #00d2ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    Hustle AI Blog
                </h1>
                <p style={{ fontSize: "1.1rem", color: "var(--text-muted, #999)", maxWidth: 500 }}>
                    Tips, guides, and strategies for automating your service business with AI.
                </p>
            </div>

            {/* Posts Grid */}
            <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 80px" }}>
                <div style={{ display: "grid", gap: 20 }}>
                    {BLOG_POSTS.map((post) => (
                        <a
                            key={post.slug}
                            href={`/blog/${post.slug}`}
                            style={{
                                display: "block",
                                padding: "28px 32px",
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                borderRadius: 16,
                                textDecoration: "none",
                                transition: "all 0.2s ease",
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = "rgba(0,210,255,0.05)"; e.currentTarget.style.borderColor = "rgba(0,210,255,0.2)"; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                        >
                            <div style={{ display: "flex", gap: 12, marginBottom: 12, fontSize: "0.78rem" }}>
                                <span style={{ color: "var(--accent, #00d2ff)", background: "rgba(0,210,255,0.1)", padding: "3px 10px", borderRadius: 20 }}>
                                    {post.category}
                                </span>
                                <span style={{ color: "var(--text-muted, #666)" }}>{post.date}</span>
                                <span style={{ color: "var(--text-muted, #666)" }}>{post.readTime}</span>
                            </div>
                            <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff", marginBottom: 8 }}>
                                {post.title}
                            </h2>
                            <p style={{ fontSize: "0.92rem", color: "var(--text-muted, #999)", lineHeight: 1.5 }}>
                                {post.excerpt}
                            </p>
                        </a>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div style={{
                maxWidth: 800, margin: "0 auto 80px", padding: "48px 32px",
                background: "linear-gradient(135deg, rgba(0,210,255,0.08), rgba(108,92,231,0.08))",
                border: "1px solid rgba(0,210,255,0.15)", borderRadius: 20, textAlign: "center",
            }}>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 8 }}>Ready to automate your business?</h3>
                <p style={{ color: "var(--text-muted, #999)", marginBottom: 24 }}>Start your free trial — no credit card required.</p>
                <a href="/signup" style={{
                    display: "inline-block", background: "var(--accent, #00d2ff)", color: "#000",
                    padding: "14px 36px", borderRadius: 10, textDecoration: "none", fontWeight: 700, fontSize: "1rem",
                }}>
                    Start Free Trial →
                </a>
            </div>
        </div>
    );
}
