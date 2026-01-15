'use client'

import Script from 'next/script'

interface GoogleAnalyticsProps {
  measurementId: string
}

/**
 * Google Analytics 4 (GA4) Component with Consent Mode v2
 *
 * This component implements Google Consent Mode v2 which is required for
 * GDPR compliance and AdSense serving in the EEA.
 *
 * How it works:
 * 1. Sets default consent to 'denied' before loading any Google scripts
 * 2. Loads gtag.js (required for consent mode to function)
 * 3. CookieConsent component will call gtag('consent', 'update', ...) when user accepts
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
      {/*
        Google Consent Mode v2 - Default Settings
        MUST be set before loading gtag.js
        This sets all consent to 'denied' by default, requiring explicit user consent
      */}
      <Script
        id="google-consent-default"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}

            // Set default consent to denied (required for GDPR/Consent Mode v2)
            gtag('consent', 'default', {
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'analytics_storage': 'denied',
              'functionality_storage': 'denied',
              'personalization_storage': 'denied',
              'security_storage': 'granted',
              'wait_for_update': 500
            });

            // Enable URL passthrough for better measurement when cookies are denied
            gtag('set', 'url_passthrough', true);

            // Enable ads data redaction when ad_storage is denied
            gtag('set', 'ads_data_redaction', true);
          `,
        }}
      />

      {/* Google Analytics 4 - Global Site Tag (gtag.js) */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script
        id="google-analytics-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
              send_page_view: true
            });
          `,
        }}
      />
    </>
  )
}
