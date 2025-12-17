'use client';

import { useRouter } from 'next/navigation';
import type { Post } from '@/types/post';

// Read Articles Button - scrolls to Categories section
export function ReadArticlesButton() {
  const scrollToCategories = () => {
    // Find the first category section
    const categorySections = document.querySelectorAll('[id^="category-"]');
    if (categorySections.length > 0) {
      categorySections[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <button
      onClick={scrollToCategories}
      className="group relative px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 lg:px-12 lg:py-6 text-sm font-medium sm:font-bold sm:text-base bg-transparent border border-[var(--electric-blue)] sm:border-2 text-[var(--electric-blue)] overflow-hidden transition-all duration-300 hover:scale-105 hover:bg-[var(--electric-blue)]/10 no-button-reset"
    >
      <span className="relative z-10">Read Articles</span>
      <div className="absolute inset-0 bg-[var(--neon-cyan)]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
}

// Random Post Button
interface RandomPostButtonProps {
  randomPost?: Post | null;
}

export function RandomPostButton({ randomPost }: RandomPostButtonProps) {
  const router = useRouter();

  const handleRandomPost = () => {
    if (randomPost?.slug?.current) {
      router.push(`/posts/${randomPost.slug.current}`);
    }
  };

  if (!randomPost) {
    return null;
  }

  return (
    <button
      onClick={handleRandomPost}
      className="group relative px-4 py-2 sm:px-6 sm:py-3 md:px-8 md:py-4 lg:px-12 lg:py-6 text-sm font-medium sm:font-bold sm:text-base bg-transparent border border-[var(--purple)] sm:border-2 text-[var(--purple)] overflow-hidden transition-all duration-300 hover:scale-105 hover:bg-[var(--purple)]/10 no-button-reset"
    >
      <span className="relative z-10">Random Post</span>
      <div className="absolute inset-0 bg-[var(--purple)]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
}


// View All Button
interface ViewAllButtonProps {
  onClick: () => void;
}

export function ViewAllButton({ onClick }: ViewAllButtonProps) {
  return (
    <button
      onClick={onClick}
      className="text-[var(--electric-blue)] hover:text-[var(--electric-blue)] transition-colors text-sm font-medium border border-[var(--border-cyan)] px-4 py-2 hover:bg-[var(--hover-cyan-bg)] whitespace-nowrap"
    >
      View All →
    </button>
  );
}

// Scroll to Section Button
interface ScrollToSectionButtonProps {
  sectionId: string;
  children: React.ReactNode;
  className?: string;
}

export function ScrollToSectionButton({ sectionId, children, className = '' }: ScrollToSectionButtonProps) {
  const handleClick = () => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`text-[var(--foreground-low)] hover:text-[var(--electric-blue)] transition-colors text-sm ${className}`}
    >
      {children}
    </button>
  );
}

// Back to Top Button
export function BackToTopButton() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      className="text-[var(--electric-blue)] hover:text-[var(--electric-blue)] transition-colors text-sm font-medium flex items-center gap-2 border border-[var(--border-cyan)] px-4 py-2 hover:bg-[var(--hover-cyan-bg)]"
    >
      Back to Top
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  );
}
