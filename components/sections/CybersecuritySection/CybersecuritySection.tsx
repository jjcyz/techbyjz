import CybersecurityCard from './CybersecurityCard';
import CybersecurityCarouselWrapper from './CybersecurityCarouselWrapper';
import Link from 'next/link';
import type { Post, Category } from '@/types/post';

interface CybersecuritySectionProps {
  posts: Post[];
  category?: Category | null;
}

export default function CybersecuritySection({ posts, category }: CybersecuritySectionProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <div id="cybersecurity-posts" className="relative z-10 py-6 md:py-8 lg:py-10 scroll-mt-20 w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8">
        {/* Section Header - Left Column */}
        <div className="w-full md:w-1/5 lg:w-1/6 xl:w-1/6 md:min-w-[180px] lg:min-w-[200px] md:flex-shrink">
          <div className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight sm:leading-none text-left text-[#ff4444]">
              Cybersecurity
            </h2>
            {category?.slug?.current ? (
              <Link
                href={`/category/${category.slug.current}`}
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#ff4444] border border-[#ff4444] px-3 py-1.5 hover:bg-[#ff4444] hover:text-[var(--background-dark-navy)] transition-all duration-300 font-semibold w-fit group"
              >
                View More
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            ) : (
              <Link
                href="/#cybersecurity-posts"
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#ff4444] border border-[#ff4444] px-3 py-1.5 hover:bg-[#ff4444] hover:text-[var(--background-dark-navy)] transition-all duration-300 font-semibold w-fit group"
              >
                View More
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {/* Content Area - Two column layout */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start">
          {/* Left column: Two featured cards stacked together */}
          <div className="flex flex-col gap-3 w-full" id="cybersecurity-featured-column">
            {posts[0] && (
              <CybersecurityCard post={posts[0]} featured />
            )}
            {posts[1] && (
              <CybersecurityCard post={posts[1]} featured />
            )}
          </div>

          {/* Right column: Auto-scrolling vertical carousel - height matches two featured cards */}
          <div className="w-full h-full">
            <CybersecurityCarouselWrapper posts={posts.slice(2)} />
          </div>
        </div>
      </div>
    </div>
  );
}

