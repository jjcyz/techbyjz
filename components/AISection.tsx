import AICard from './AICard';
import type { Post } from '@/types/post';

interface AISectionProps {
  posts: Post[];
}

export default function AISection({ posts }: AISectionProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <div id="ai-posts" className="relative z-10 py-10 md:py-14 lg:py-20 scroll-mt-20 w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-12">
        {/* Section Header - Left Column */}
        <div className="shrink-0 max-w-md pl-4 sm:pl-8 md:pl-12 lg:pl-16 xl:pl-24">
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-none text-left">
              AI Models
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[var(--foreground-low)] leading-relaxed text-left max-w-2xl">
              Explore the latest developments in artificial intelligence
            </p>
          </div>
        </div>

        {/* Square grid layout - emphasizes images */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {posts.slice(0, 12).map((post) => (
            <AICard key={post._id || post.slug?.current} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}
