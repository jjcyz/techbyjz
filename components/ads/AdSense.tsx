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
 * Use this component in your pages:
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
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    try {
      // @ts-expect-error - Google AdSense types not in @types
      if (window.adsbygoogle && adSlot && publisherId) {
        // @ts-expect-error - Google AdSense types not in @types
        window.adsbygoogle.push({});

        if (isDevelopment) {
          console.log('AdSense: Attempting to load ad', {
            publisherId,
            adSlot,
            adFormat,
            hostname: window.location.hostname,
          });
        }
      }
    } catch (err) {
      if (isDevelopment) {
        console.error('AdSense error:', err);
      }
    }
  }, [adSlot, publisherId, adFormat, isDevelopment]);

  // Show placeholder in development or if missing config
  if (isDevelopment || !publisherId || !adSlot) {
    return (
      <div className={`bg-[var(--card-bg)] border-2 border-dashed border-[var(--border-color)] p-8 text-center text-[var(--foreground-muted)] ${className}`} style={style}>
        <p className="text-sm font-semibold text-[var(--electric-blue)] mb-2">AdSense Ad Unit</p>
        <div className="text-xs space-y-1 mt-3">
          <p>Publisher ID: <span className={publisherId ? 'text-green-400' : 'text-red-400'}>{publisherId ? `Set (${publisherId.substring(0, 10)}...)` : 'Not Set'}</span></p>
          <p>Ad Slot: <span className={adSlot ? 'text-green-400' : 'text-red-400'}>{adSlot ? adSlot : 'Not Set'}</span></p>
          {isDevelopment && (
            <p className="text-[var(--foreground-low)] mt-3 pt-3 border-t border-[var(--border-color)]">
              Note: AdSense ads won&apos;t display on localhost. They will appear on your production domain.
            </p>
          )}
        </div>
      </div>
    );
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

/**
 * AdSense Vertical Sidebar Component (for left/right sidebars)
 */
export function AdSenseSidebar({ adSlot, className = '' }: { adSlot?: string; className?: string }) {
  return (
    <div className={`sticky top-4 flex justify-center items-start ${className}`}>
      <AdSense
        adSlot={adSlot}
        adFormat="vertical"
        fullWidthResponsive={false}
        style={{
          minWidth: '250px',
          width: '250px',
          minHeight: '600px',
        }}
      />
    </div>
  );
}

