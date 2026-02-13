export default function sitemap() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hustleai.co";
    const now = new Date();

    const corePages = [
        { url: "", changeFrequency: "daily", priority: 1.0 },
        { url: "/signup", changeFrequency: "monthly", priority: 0.9 },
        { url: "/login", changeFrequency: "monthly", priority: 0.5 },
        { url: "/blog", changeFrequency: "weekly", priority: 0.8 },
        { url: "/privacy", changeFrequency: "monthly", priority: 0.3 },
        { url: "/terms", changeFrequency: "monthly", priority: 0.3 },
    ];

    const blogSlugs = [
        "ai-automation-service-business",
        "ai-receptionist-vs-answering-service",
        "how-to-get-more-leads-contractors",
        "ai-sms-marketing-small-business",
        "automate-customer-follow-ups",
        "best-crm-for-plumbers-hvac-electricians",
    ];

    const blogPages = blogSlugs.map((slug) => ({
        url: `/blog/${slug}`,
        changeFrequency: "monthly",
        priority: 0.7,
    }));

    return [...corePages, ...blogPages].map((page) => ({
        url: `${baseUrl}${page.url}`,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
    }));
}
