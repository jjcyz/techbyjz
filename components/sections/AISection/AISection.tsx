import AICard from './AICard';
import Link from 'next/link';
import type { Post, Category } from '@/types/post';

interface AISectionProps {
  posts: Post[];
  category?: Category | null;
}

export default function AISection({ posts, category }: AISectionProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <div id="ai-posts" className="relative z-10 py-6 md:py-8 lg:py-10 scroll-mt-20 w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8">
        {/* Section Header - Left Column */}
        <div className="w-full md:w-1/5 lg:w-1/6 xl:w-1/6 md:min-w-[180px] lg:min-w-[200px] md:flex-shrink">
          <div className="flex flex-col gap-3">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight sm:leading-none text-left text-[var(--purple)]">
              AI Models
            </h2>
            {category?.slug?.current ? (
              <Link
                href={`/category/${category.slug.current}`}
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-[var(--purple)] border border-[var(--purple)] px-3 py-1.5 hover:bg-[var(--purple)] hover:text-[var(--background-dark-navy)] transition-all duration-300 font-semibold w-fit group"
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
                href="/#ai-posts"
                className="inline-flex items-center gap-2 text-xs sm:text-sm text-[var(--purple)] border border-[var(--purple)] px-3 py-1.5 hover:bg-[var(--purple)] hover:text-[var(--background-dark-navy)] transition-all duration-300 font-semibold w-fit group"
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

        {/* Uniform square grid layout */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {posts.slice(0, 12).map((post) => (
            <AICard key={post._id || post.slug?.current} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}

