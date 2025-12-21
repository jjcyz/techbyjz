'use client'

import Script from 'next/script'

interface GoogleAnalyticsProps {
  measurementId: string
}

/**
 * Google Analytics 4 (GA4) Component
 *
 * Tracks website traffic, page views, user behavior, and more.
 * This is different from AdSense - AdSense shows ad performance,
 * while GA4 shows overall website traffic analytics.
 *
 * Setup:
 * 1. Go to https://analytics.google.com/
 * 2. Create a new GA4 property for your website
 * 3. Get your Measurement ID (format: G-XXXXXXXXXX)
 * 4. Add it to .env.local: NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
 */
export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  if (!measurementId) {
    return null
  }

  return (
    <>
      {/* Google Analytics 4 - Global Site Tag (gtag.js) */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  )
}

