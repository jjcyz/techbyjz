import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import Script from "next/script";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import PageViewTracker from "@/components/analytics/PageViewTracker";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import CookieConsent from "@/components/shared/CookieConsent";
import { validateStartup } from "@/lib/startup-validation";
import "./globals.css";

// Validate environment variables on app startup
// This runs once when the module is loaded
if (typeof window === 'undefined') {
  // Only run on server side
  try {
    validateStartup();
  } catch (error) {
    // In development, throw to catch issues early
    // In production, log but continue (graceful degradation)
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
    console.error('Startup validation failed:', error);
  }
}

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TechByJZ Blog | Futuristic Tech Insights",
  description: "A futuristic sci-fi themed tech blog featuring cutting-edge tech insights",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  // Note: We allow AI search engines (ChatGPT, Claude, Perplexity) for discoverability
  // but block training bots (GPTBot, Google-Extended) via robots.txt
  // Google AdSense account meta tag (required for verification)
  other: {
    'google-adsense-account': process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || '',
    ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
      ? {
          'google-site-verification': process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        }
      : {}),
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${geistMono.variable} antialiased`}
      >
        {/* Google Analytics 4 - Website Traffic Analytics */}
        {gaMeasurementId && (
          <>
            <GoogleAnalytics measurementId={gaMeasurementId} />
            <PageViewTracker measurementId={gaMeasurementId} />
          </>
        )}

        {/* Google AdSense Script - Load once globally */}
        {publisherId && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
            <ErrorBoundary>
              {children}
            </ErrorBoundary>

        {/* Cookie Consent Banner */}
        <CookieConsent />
      </body>
    </html>
  );
}
