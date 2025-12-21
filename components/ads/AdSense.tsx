'use client';

import { useEffect } from 'react';

interface AdSenseProps {
  adSlot?: string;
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  fullWidthResponsive?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Google AdSense Component
 *
 * Usage:
 * 1. Get your AdSense publisher ID from Google AdSense dashboard
 * 2. Add it to your .env.local: NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-xxxxxxxxxx
 * 3. Create ad units in AdSense dashboard and get ad slot IDs
 * 4. Use this component in your pages:
 *
 * <AdSense
 *   adSlot="1234567890"
 *   adFormat="auto"
 *   fullWidthResponsive={true}
 * />
 */
export default function AdSense({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  style,
  className = '',
}: AdSenseProps) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;

  useEffect(() => {
    try {
      // @ts-expect-error - Google AdSense types not in @types
      if (window.adsbygoogle && adSlot) {
        // @ts-expect-error - Google AdSense types not in @types
        window.adsbygoogle.push({});
      }
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('AdSense error:', err);
      }
    }
  }, [adSlot]);

  // Don't render if no publisher ID or ad slot
  if (!publisherId || !adSlot) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className={`bg-[var(--card-bg)] border border-[var(--border-color)] p-8 text-center text-[var(--foreground-muted)] ${className}`} style={style}>
          <p className="text-sm">AdSense Placeholder</p>
          <p className="text-xs mt-2">Publisher ID: {publisherId ? 'Set' : 'Not Set'}</p>
          <p className="text-xs">Ad Slot: {adSlot ? adSlot : 'Not Set'}</p>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {/* AdSense Script is loaded globally in layout.tsx */}
      {/* AdSense Ad Unit */}
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          ...style,
        }}
        data-ad-client={publisherId}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      />
    </>
  );
}

/**
 * AdSense Banner Component (for sidebar or top of page)
 */
export function AdSenseBanner({ adSlot, className = '' }: { adSlot?: string; className?: string }) {
  return (
    <div className={`mb-6 ${className}`}>
      <AdSense
        adSlot={adSlot}
        adFormat="horizontal"
        fullWidthResponsive={true}
        style={{ minHeight: '100px' }}
      />
    </div>
  );
}

/**
 * AdSense In-Article Component (for between content)
 */
export function AdSenseInArticle({ adSlot, className = '' }: { adSlot?: string; className?: string }) {
  return (
    <div className={`my-8 ${className}`}>
      <AdSense
        adSlot={adSlot}
        adFormat="auto"
        fullWidthResponsive={true}
      />
    </div>
  );
}

