'use client';

import { useRef, useEffect, useState } from 'react';
import PostCard from '@/components/shared/PostCard';
import type { Post } from '@/types/post';

interface CybersecurityCarouselProps {
  posts: Post[];
}

/**
 * Auto-scrolling vertical carousel for cybersecurity posts.
 * Uses CSS Grid to match height with the featured column naturally.
 */
export default function CybersecurityCarousel({ posts }: CybersecurityCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const scrollSpeed = 0.5; // pixels per frame (slower for vertical scroll)

  // Continuous auto-scroll upward
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
        const { scrollTop, scrollHeight, clientHeight } = container;

        // Check if content actually overflows
        if (scrollHeight <= clientHeight) {
          animationFrameRef.current = requestAnimationFrame(scroll);
          return;
        }

        // Calculate the height of the first set of posts (before duplication)
        const firstSetHeight = scrollHeight / 2;

        // If we've scrolled past the first set, reset to the equivalent position in the first set
        // This creates a seamless infinite loop
        if (scrollTop >= firstSetHeight - scrollSpeed) {
          container.scrollTop = scrollTop - firstSetHeight;
        } else {
          // Continuous scroll upward
          const newScrollTop = scrollTop + scrollSpeed;
          if (newScrollTop <= scrollHeight - clientHeight) {
            container.scrollTop = newScrollTop;
          } else {
            // If we would exceed, reset to start
            container.scrollTop = 0;
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
      className="absolute inset-0 w-full h-full flex flex-col overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Top Fade Gradient */}
      <div className="absolute left-0 top-0 right-0 h-16 bg-gradient-to-b from-[var(--background-dark-navy)] to-transparent z-10 pointer-events-none" />

      {/* Scrollable Container - vertical scroll within constrained height */}
      <div
        ref={scrollContainerRef}
        className="flex flex-col gap-3 overflow-y-auto hide-scrollbar w-full h-full"
        style={{
          scrollBehavior: 'auto',
        }}
      >
        {duplicatedPosts.map((post, index) => (
          <div
            key={`${post._id || post.slug?.current}-${index}`}
            className="flex-shrink-0"
          >
            <PostCard post={post} variant="overlay-horizontal" theme="red" />
          </div>
        ))}
      </div>

      {/* Bottom Fade Gradient */}
      <div className="absolute left-0 bottom-0 right-0 h-16 bg-gradient-to-t from-[var(--background-dark-navy)] to-transparent z-10 pointer-events-none" />
    </div>
  );
}
