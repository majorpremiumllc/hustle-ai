export default function robots() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tryhustleai.com";

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/dashboard/", "/api/", "/onboarding/"],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
