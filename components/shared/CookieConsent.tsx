'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'cookie-consent';

type ConsentStatus = 'accepted' | 'rejected' | null;

/**
 * Updates Google Consent Mode v2 with user's choice
 * This function updates all consent signals required by Google
 */
function updateGoogleConsent(granted: boolean) {
  if (typeof window !== 'undefined' && window.gtag) {
    const consentState = granted ? 'granted' : 'denied';

    window.gtag('consent', 'update', {
      ad_storage: consentState,
      ad_user_data: consentState,
      ad_personalization: consentState,
      analytics_storage: consentState,
      functionality_storage: consentState,
      personalization_storage: consentState,
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('Cookie Consent: Updated Google Consent Mode v2', {
        status: granted ? 'granted' : 'denied',
      });
    }
  }
}

/**
 * Check if user has previously given consent
 */
function getStoredConsent(): ConsentStatus {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentStatus;
}

/**
 * Apply stored consent on page load
 * This ensures consent is restored when user revisits
 */
function applyStoredConsent() {
  const consent = getStoredConsent();
  if (consent === 'accepted') {
    updateGoogleConsent(true);
  }
  // If rejected or null, consent remains denied (set as default in GoogleAnalytics)
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check and apply stored consent
    const consent = getStoredConsent();

    if (consent === 'accepted') {
      // User previously accepted - update consent (in case page was refreshed)
      applyStoredConsent();
      return;
    }

    if (consent === 'rejected') {
      // User previously rejected - consent stays denied (default state)
      return;
    }

    // No previous choice - show banner after a short delay for better UX
    const timer = setTimeout(() => {
      setShowBanner(true);
      // Trigger animation after state update
      setTimeout(() => setIsVisible(true), 10);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    updateGoogleConsent(true);
    setIsVisible(false);
    setTimeout(() => setShowBanner(false), 300);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    updateGoogleConsent(false);
    setIsVisible(false);
    setTimeout(() => setShowBanner(false), 300);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="bg-[var(--background-dark-navy)] shadow-[0_-4px_20px_rgba(0,191,255,0.2)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-4 sm:py-5 md:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Content */}
            <div className="flex-1">
              <h3
                id="cookie-consent-title"
                className="text-sm sm:text-base font-semibold text-[var(--electric-blue)] mb-2"
              >
                Cookie Consent
              </h3>
              <p
                id="cookie-consent-description"
                className="text-xs sm:text-sm text-[var(--foreground-low)] leading-relaxed"
              >
                We use cookies to enhance your browsing experience, serve personalized ads, and analyze our traffic.
                By clicking &quot;Accept All&quot;, you consent to our use of cookies from{' '}
                <Link
                  href="/privacy"
                  className="text-[var(--electric-blue)] hover:underline"
                >
                  Google AdSense and Google Analytics
                </Link>
                . You can learn more in our{' '}
                <Link
                  href="/privacy"
                  className="text-[var(--electric-blue)] hover:underline"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={handleReject}
                className="px-4 py-2 text-xs sm:text-sm font-medium bg-transparent border border-[var(--border-color)] text-[var(--foreground-low)] hover:border-[var(--electric-blue)] hover:text-[var(--electric-blue)] transition-all duration-300 whitespace-nowrap"
              >
                Reject All
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 text-xs sm:text-sm font-semibold bg-[var(--electric-blue)] border border-[var(--electric-blue)] text-[var(--background-dark-navy)] hover:bg-[var(--neon-cyan)] hover:border-[var(--neon-cyan)] transition-all duration-300 whitespace-nowrap"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
