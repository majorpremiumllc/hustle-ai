import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tryhustleai.com";

export const metadata = {
  /* ── Core SEO ── */
  title: {
    default: "Hustle AI — AI That Runs Your Business While You Work",
    template: "%s | Hustle AI",
  },
  description:
    "Hustle AI automates calls, texts, and lead capture for service businesses. AI voice receptionist, SMS auto-responder, and sales pipeline — all on autopilot. Start free.",
  keywords: [
    "AI business automation",
    "AI phone answering",
    "AI receptionist",
    "SMS auto-responder",
    "lead automation",
    "sales pipeline AI",
    "service business automation",
    "HustleAI",
    "Hustle AI",
    "AI for small business",
    "AI voice agent",
  ],

  /* ── Robots ── */
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  /* ── Open Graph ── */
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Hustle AI",
    title: "Hustle AI — AI That Runs Your Business While You Work",
    description:
      "Automate calls, texts, and leads with AI. Voice receptionist, SMS responder, and sales pipeline for service businesses. Start your free trial.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Hustle AI — AI-Powered Business Automation",
      },
    ],
  },

  /* ── Twitter Card ── */
  twitter: {
    card: "summary_large_image",
    title: "Hustle AI — AI That Runs Your Business While You Work",
    description:
      "Automate calls, texts, and leads with AI. Voice receptionist, SMS responder, and sales pipeline for service businesses.",
    images: [`${SITE_URL}/og-image.png`],
  },

  /* ── Favicon & Icons ── */
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", type: "image/png" },
    ],
  },

  /* ── Apple Web App ── */
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hustle AI",
  },

  /* ── Canonical & Alternates ── */
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },

  /* ── Other ── */
  category: "technology",
  creator: "Hustle AI",
  publisher: "Hustle AI",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0A14" },
    { media: "(prefers-color-scheme: light)", color: "#0A0A14" },
  ],
};

export default function RootLayout({ children }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hustleai.co";

  const organizationLD = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Hustle AI",
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: "AI-powered business automation for service companies. Automate calls, texts, and lead capture.",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: ["English"],
    },
  };

  const softwareLD = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Hustle AI",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "0",
      highPrice: "199",
      offerCount: "4",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "200",
    },
    description: "AI receptionist, SMS auto-responder, and sales pipeline for service businesses.",
  };

  const faqLD = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Hustle AI?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Hustle AI is an AI-powered platform that automates calls, texts, lead capture, and customer follow-ups for service businesses like plumbers, HVAC, electricians, and contractors.",
        },
      },
      {
        "@type": "Question",
        name: "How much does Hustle AI cost?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Hustle AI starts free with our Starter plan. Paid plans start at $49/month for Growth, $99/month for Pro, and $199/month for Enterprise with unlimited leads and custom AI voice.",
        },
      },
      {
        "@type": "Question",
        name: "Does Hustle AI answer phone calls automatically?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! Hustle AI provides a 24/7 AI voice receptionist that answers calls, captures lead information, schedules appointments, and sends follow-up texts — all automatically.",
        },
      },
      {
        "@type": "Question",
        name: "Can I use Hustle AI for my service business?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Absolutely. Hustle AI is built specifically for service businesses: plumbing, HVAC, electrical, landscaping, cleaning, auto repair, roofing, pest control, and more.",
        },
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareLD) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLD) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
