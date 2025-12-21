'use client';

import { useEffect } from 'react';

interface ViewTrackerProps {
  slug: string;
}

export default function ViewTracker({ slug }: ViewTrackerProps) {
  useEffect(() => {
    // Track view only once per page load
    const trackView = async () => {
      try {
        const response = await fetch(`/api/posts/${encodeURIComponent(slug)}/view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        // Consume response body (always consume to avoid leaving connection open)
        await response.json().catch(() => ({}));

        if (!response.ok) {
          // Silently fail - view tracking is non-critical
          return;
        }
      } catch {
        // Silently fail - view tracking is non-critical
        // Errors are already handled by the API endpoint
      }
    };

    trackView();
  }, [slug]);

  return null; // This component doesn't render anything
}

