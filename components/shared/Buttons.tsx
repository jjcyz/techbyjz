'use client';

import { useRouter } from 'next/navigation';
import type { Post } from '@/types/post';

export function ReadArticlesButton() {
  const scrollToCategories = () => {
    const categorySections = document.querySelectorAll('[id^="category-"]');
    if (categorySections.length > 0) {
      categorySections[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <button
      type="button"
      onClick={scrollToCategories}
      className="px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 lg:px-6 lg:py-2.5 text-xs sm:text-sm font-semibold border border-[var(--electric-blue)] sm:border-2 text-[var(--electric-blue)] transition-all duration-300 hover:bg-[var(--electric-blue)] hover:text-white rounded-sm no-button-reset"
    >
      Read Articles
    </button>
  );
}

interface RandomPostButtonProps {
  randomPost?: Post | null;
}

export function RandomPostButton({ randomPost }: RandomPostButtonProps) {
  const router = useRouter();

  if (!randomPost) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => {
        if (randomPost.slug?.current) {
          router.push(`/posts/${randomPost.slug.current}`);
        }
      }}
      className="px-2.5 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 lg:px-6 lg:py-2.5 text-xs sm:text-sm font-semibold border border-[var(--electric-blue)] sm:border-2 text-[var(--electric-blue)] bg-white/80 transition-all duration-300 hover:bg-[var(--electric-blue)] hover:text-white rounded-sm no-button-reset"
    >
      Random Post
    </button>
  );
}

interface ScrollToSectionButtonProps {
  sectionId: string;
  children: React.ReactNode;
  className?: string;
}

export function ScrollToSectionButton({ sectionId, children, className = '' }: ScrollToSectionButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }}
      className={`text-[var(--foreground-low)] hover:text-[var(--electric-blue)] transition-colors text-sm ${className}`}
    >
      {children}
    </button>
  );
}

export function BackToTopButton() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="text-[var(--electric-blue)] transition-colors text-sm font-medium flex items-center gap-2 border border-[var(--border-color)] px-4 py-2 rounded-sm hover:bg-[var(--hover-accent-bg)]"
    >
      Back to Top
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  );
}
