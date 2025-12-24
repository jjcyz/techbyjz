import AIInfrastructureCard from './AIInfrastructureCard';
import SectionHeader from '@/components/shared/SectionHeader';
import type { Post, Category } from '@/types/post';

interface AIInfrastructureSectionProps {
  posts: Post[];
  category?: Category | null;
}

export default function AIInfrastructureSection({ posts, category }: AIInfrastructureSectionProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <div id="ai-infrastructure-posts" className="relative z-10 py-6 md:py-8 lg:py-10 scroll-mt-20 w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8">
        <SectionHeader
          title="AI Infrastructure"
          category={category}
          sectionId="ai-infrastructure-posts"
          theme="purple"
        />

        {/* Uniform square grid layout */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {posts.slice(0, 8).map((post) => (
            <AIInfrastructureCard key={post._id || post.slug?.current} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}

