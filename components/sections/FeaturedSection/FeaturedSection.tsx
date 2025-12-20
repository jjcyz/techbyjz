import FeaturedCarousel from './FeaturedCarousel';
import SectionHeader from '@/components/shared/SectionHeader';
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
        <SectionHeader
          title="Featured Posts"
          sectionId="featured-posts"
          theme="electric-blue"
          viewMoreHref="/?view=all"
        />

        {/* Carousel - Right Side */}
        <div className="flex-1 overflow-hidden min-w-0">
          <FeaturedCarousel posts={posts} />
        </div>
      </div>
    </div>
  );
}

