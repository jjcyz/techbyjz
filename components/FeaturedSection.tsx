import FeaturedCard from './FeaturedCard';
import type { Post } from '@/types/post';

interface FeaturedSectionProps {
  posts: Post[];
}

export default function FeaturedSection({ posts }: FeaturedSectionProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <div id="featured-posts" className="relative z-10 py-10 md:py-14 lg:py-20 scroll-mt-20 w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12">
        {/* Section Header - Left Column */}
        <div className="flex-shrink-0 max-w-md pl-4 sm:pl-8 md:pl-12 lg:pl-16 xl:pl-24">
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-none text-left">
              Featured Posts
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[var(--foreground-low)] leading-relaxed text-left max-w-2xl">
              Latest insights and deep dives into cutting-edge technology
            </p>
          </div>
        </div>

        {/* Posts Grid - Right Side (3 columns, larger cards) */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {posts.slice(0, 9).map((post) => (
            <FeaturedCard key={post._id || post.slug?.current} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}
