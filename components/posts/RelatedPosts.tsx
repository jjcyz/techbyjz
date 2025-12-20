import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl } from '@/lib/image';
import { isValidSlug } from '@/lib/utils';
import type { Post } from '@/types/post';
import ViewCount from '@/components/posts/ViewCount';

interface RelatedPostsProps {
  posts: Post[];
  currentPostSlug: string;
}

export default function RelatedPosts({ posts, currentPostSlug }: RelatedPostsProps) {
  // Filter out the current post and invalid slugs
  const validPosts = posts.filter((post) => {
    const slug = post.slug?.current;
    const isValid = isValidSlug(slug);
    const isNotCurrent = slug !== currentPostSlug;
    return isValid && isNotCurrent;
  });

  // Don't render if no related posts
  if (validPosts.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 pt-12">
      <h2 className="text-xl md:text-2xl font-bold text-[var(--electric-blue)] mb-6">
        Related Posts
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {validPosts.map((post) => {
          const slug = post.slug!.current;
          const imageUrl = getImageUrl(post.mainImage, 400, 250);

          return (
            <Link
              key={post._id}
              href={`/posts/${slug}`}
              className="group relative transition-all duration-300 h-full flex flex-col border border-[var(--border-color)] hover:border-[var(--electric-blue)] hover:shadow-[0_0_20px_rgba(0,191,255,0.3)] p-3"
            >
              {imageUrl && (
                <div className="relative w-full aspect-[16/9] overflow-hidden bg-[var(--background-dark-navy)] mb-3">
                  <Image
                    src={imageUrl}
                    alt={post.mainImage?.alt || post.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              )}
              <h3 className="text-base font-bold text-[var(--foreground)] group-hover:text-[var(--electric-blue)] transition-colors duration-300 line-clamp-2 mb-2">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-xs text-[var(--foreground-low)] line-clamp-2 mb-2">
                  {post.excerpt}
                </p>
              )}
              <div className="mt-auto">
                <ViewCount viewCount={post.viewCount} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

