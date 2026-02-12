import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://hustleai.co";

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
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
