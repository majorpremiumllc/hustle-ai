export default function robots() {
    const baseUrl = "https://tryhustleai.com";

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
