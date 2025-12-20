'use client';

import { useRef, useEffect, useState } from 'react';
import FeaturedCard from './FeaturedCard';
import type { Post } from '@/types/post';

interface FeaturedCarouselProps {
  posts: Post[];
}

export default function FeaturedCarousel({ posts }: FeaturedCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const scrollSpeed = 1; // pixels per frame (adjust for speed)

  // Continuous auto-scroll
  useEffect(() => {
    if (posts.length === 0) return;

    // Small delay to ensure container is rendered
    const startTimeout = setTimeout(() => {
      if (!scrollContainerRef.current) return;

      const scroll = () => {
        if (!scrollContainerRef.current || isPaused) {
          animationFrameRef.current = requestAnimationFrame(scroll);
          return;
        }

        const container = scrollContainerRef.current;
        const { scrollLeft, scrollWidth, clientWidth } = container;

        // Check if content actually overflows
        if (scrollWidth <= clientWidth) {
          animationFrameRef.current = requestAnimationFrame(scroll);
          return;
        }

        // Calculate the width of the first set of posts (before duplication)
        const firstSetWidth = scrollWidth / 2;

        // If we've scrolled past the first set, reset to the equivalent position in the first set
        // This creates a seamless infinite loop
        if (scrollLeft >= firstSetWidth - scrollSpeed) {
          container.scrollLeft = scrollLeft - firstSetWidth;
        } else {
          // Continuous scroll - but make sure we don't exceed bounds
          const newScrollLeft = scrollLeft + scrollSpeed;
          if (newScrollLeft <= scrollWidth - clientWidth) {
            container.scrollLeft = newScrollLeft;
          } else {
            // If we would exceed, reset to start
            container.scrollLeft = 0;
          }
        }

        animationFrameRef.current = requestAnimationFrame(scroll);
      };

      animationFrameRef.current = requestAnimationFrame(scroll);
    }, 100);

    return () => {
      clearTimeout(startTimeout);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [posts, isPaused, scrollSpeed]);

  // Pause on hover
  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  if (posts.length === 0) {
    return null;
  }

  // Duplicate posts for seamless infinite scroll
  const duplicatedPosts = [...posts, ...posts];

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Left Fade Gradient */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[var(--background-dark-navy)] to-transparent z-10 pointer-events-none" />

      {/* Scrollable Container - constrained to parent width */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 md:gap-6 overflow-x-auto hide-scrollbar w-full"
        style={{
          scrollBehavior: 'auto',
        }}
      >
        {duplicatedPosts.map((post, index) => (
          <div
            key={`${post._id || post.slug?.current}-${index}`}
            className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px] lg:w-[400px]"
          >
            <FeaturedCard post={post} />
          </div>
        ))}
      </div>

      {/* Right Fade Gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[var(--background-dark-navy)] to-transparent z-10 pointer-events-none" />
    </div>
  );
}

