import NewsCard from './NewsCard';
import SectionHeader from '@/components/shared/SectionHeader';
import { isValidSlug } from '@/lib/utils';
import Link from 'next/link';
import type { Post, Category } from '@/types/post';

interface NewsSectionProps {
  posts: Post[];
  category?: Category | null;
}

export default function NewsSection({ posts, category }: NewsSectionProps) {
  if (posts.length === 0) {
    return null;
  }

  // Get headlines (first 4 posts) and remaining posts
  const headlines = posts.slice(0, 4);
  const remainingPosts = posts.slice(4, 12);

  return (
    <div id="news-posts" className="relative z-10 py-6 md:py-8 lg:py-10 scroll-mt-20 w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8">
        <SectionHeader
          title="Tech World in 60 Seconds"
          category={category}
          sectionId="news-posts"
          theme="electric-blue"
        />

        {/* Content Area */}
        <div className="flex-1 flex flex-col gap-4 md:gap-6">
          {/* Headlines Section */}
          <div className="relative border-[0.5px] border-[var(--electric-blue)] p-4 md:p-6 rounded-none bg-[var(--card-bg)]/50 backdrop-blur-sm shadow-[0_0_20px_rgba(0,191,255,0.3),0_0_40px_rgba(0,191,255,0.15),inset_0_0_20px_rgba(0,191,255,0.1)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,191,255,0.4),0_0_60px_rgba(0,191,255,0.2),inset_0_0_30px_rgba(0,191,255,0.15)]">
            <h3 className="text-xs md:text-sm font-semibold text-[var(--electric-blue)] mb-2 md:mb-3 uppercase tracking-wide drop-shadow-[0_0_8px_rgba(0,191,255,0.6)]">
              Top Headlines
            </h3>
            <div className="space-y-4 md:space-y-5">
              {headlines.map((post) => {
                const slug = post.slug?.current;
                if (!slug || !isValidSlug(slug)) return null;

                return (
                  <Link
                    key={post._id || slug}
                    href={`/posts/${slug}`}
                    className="block group"
                  >
                    <h4 className="text-sm md:text-base lg:text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--electric-blue)] transition-all duration-300 leading-tight group-hover:drop-shadow-[0_0_8px_rgba(0,191,255,0.5)]">
                      {post.title}
                    </h4>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Regular News Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {remainingPosts.map((post) => (
              <NewsCard key={post._id || post.slug?.current} post={post} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

