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

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to track view:', response.status, errorData);
          return;
        }

        const data = await response.json();
        console.log('View tracked successfully:', data);
      } catch (error) {
        // Log error for debugging
        console.error('Failed to track view:', error);
      }
    };

    trackView();
  }, [slug]);

  return null; // This component doesn't render anything
}

