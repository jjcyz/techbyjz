'use client';

import { useEffect, useRef, useState } from 'react';
import CybersecurityCarousel from './CybersecurityCarousel';
import type { Post } from '@/types/post';

interface CybersecurityCarouselWrapperProps {
  posts: Post[];
}

export default function CybersecurityCarouselWrapper({ posts }: CybersecurityCarouselWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const updateHeight = () => {
      // Find the featured column to match its height
      const featuredColumn = document.getElementById('cybersecurity-featured-column');
      if (featuredColumn && containerRef.current) {
        // Use offsetHeight for more reliable measurement
        const featuredHeight = featuredColumn.offsetHeight;
        if (featuredHeight > 0) {
          setHeight(featuredHeight);
          // Also set it directly on the container as a fallback
          containerRef.current.style.height = `${featuredHeight}px`;
        }
      }
    };

    // Multiple attempts to ensure we get the height
    const attempt1 = setTimeout(updateHeight, 50);
    const attempt2 = setTimeout(updateHeight, 200);
    const attempt3 = setTimeout(updateHeight, 500);

    // Update on resize
    const handleResize = () => {
      updateHeight();
    };
    window.addEventListener('resize', handleResize);

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });

    const featuredColumn = document.getElementById('cybersecurity-featured-column');
    if (featuredColumn) {
      resizeObserver.observe(featuredColumn);
    }

    // Also observe the container itself
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(attempt1);
      clearTimeout(attempt2);
      clearTimeout(attempt3);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative"
      style={{
        height: height ? `${height}px` : 'auto',
        minHeight: '400px'
      }}
    >
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <CybersecurityCarousel posts={posts} />
      </div>
    </div>
  );
}

