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
    <div id="featured-posts" className="relative z-10 py-6 md:py-8 lg:py-10 scroll-mt-20 w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8">
        {/* Section Header - Left Column */}
        <div className="w-full md:w-1/5 lg:w-1/6 xl:w-1/6 md:min-w-[180px] lg:min-w-[200px] md:flex-shrink">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight sm:leading-none text-left text-[var(--electric-blue)]">
              Featured Posts
            </h2>
          </div>
        </div>

        {/* Posts Grid - Right Side */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {posts.slice(0, 9).map((post) => (
            <FeaturedCard key={post._id || post.slug?.current} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}

