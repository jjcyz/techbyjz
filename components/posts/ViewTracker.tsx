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
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to track view:', response.status, data);
          }
          return;
        }

        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log('View tracked successfully', data);
        }
      } catch (error) {
        // Log error only in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to track view:', error);
        }
      }
    };

    trackView();
  }, [slug]);

  return null; // This component doesn't render anything
}

