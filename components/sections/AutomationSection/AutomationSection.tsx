import AutomationCard from './AutomationCard';
import SectionHeader from '@/components/shared/SectionHeader';
import type { Post, Category } from '@/types/post';

interface AutomationSectionProps {
  posts: Post[];
  category?: Category | null;
}

export default function AutomationSection({ posts, category }: AutomationSectionProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <div id="automation-posts" className="relative z-10 py-6 md:py-8 lg:py-10 scroll-mt-20 w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8">
        <SectionHeader
          title="Automation"
          category={category}
          sectionId="automation-posts"
          theme="electric-blue"
        />

        {/* Content area with featured card and grid */}
        <div className="flex-1 flex flex-col gap-3 sm:gap-4">
          {/* Top row: Featured card with 2x2 grid beside it */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Featured Card */}
            {posts[0] && (
              <div className="sm:col-span-2">
                <AutomationCard post={posts[0]} featured />
              </div>
            )}

            {/* 2x2 Grid of smaller cards */}
            <div className="sm:col-span-1 grid grid-cols-2 gap-2 sm:gap-3">
              {posts.slice(1, 5).map((post) => (
                <AutomationCard key={post._id || post.slug?.current} post={post} />
              ))}
            </div>
          </div>

          {/* Remaining cards in grid below */}
          {posts.length > 5 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
              {posts.slice(5, 11).map((post) => (
                <AutomationCard key={post._id || post.slug?.current} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

