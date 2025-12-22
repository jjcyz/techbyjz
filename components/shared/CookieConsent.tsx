'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'cookie-consent';

type ConsentStatus = 'accepted' | 'rejected' | null;

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentStatus;

    if (!consent) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
        // Trigger animation after state update
        setTimeout(() => setIsVisible(true), 10);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setShowBanner(false);
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
    setShowBanner(false);
    setIsVisible(false);

    // Disable Google Analytics if user rejects
    // Note: This is a basic implementation. For full compliance,
    // you may want to use a more robust cookie management solution
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
      });
    }
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="bg-[var(--background-dark-navy)] shadow-[0_-4px_20px_rgba(0,191,255,0.2)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-4 sm:py-5 md:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Content */}
            <div className="flex-1">
              <h3 className="text-sm sm:text-base font-semibold text-[var(--electric-blue)] mb-2">
                Cookie Consent
              </h3>
              <p className="text-xs sm:text-sm text-[var(--foreground-low)] leading-relaxed">
                We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                By clicking &quot;Accept All&quot;, you consent to our use of cookies, including those from{' '}
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

