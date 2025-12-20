import CybersecurityCard from './CybersecurityCard';
import CybersecurityCarouselWrapper from './CybersecurityCarouselWrapper';
import SectionHeader from '@/components/shared/SectionHeader';
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
        <SectionHeader
          title="Cybersecurity"
          category={category}
          sectionId="cybersecurity-posts"
          theme="red"
        />

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

