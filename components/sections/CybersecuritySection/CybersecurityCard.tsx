import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/image';
import { isValidSlug } from '@/lib/utils';
import type { Post } from '@/types/post';
import ViewCount from '@/components/posts/ViewCount';

interface CybersecurityCardProps {
  post: Post;
  featured?: boolean;
}

export default function CybersecurityCard({ post, featured = false }: CybersecurityCardProps) {
  if (!isValidSlug(post.slug?.current)) {
    return null;
  }

  const slug = post.slug!.current;
  const imageUrl = getImageUrl(post.mainImage, featured ? 500 : 200, featured ? 400 : 120);

  // Featured card uses overlay, regular cards use horizontal layout
  if (featured) {
    return (
      <Link
        href={`/posts/${slug}`}
        className="group block relative transition-all duration-300 h-full"
      >
        {/* Image with overlay for featured */}
        <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] overflow-hidden bg-[var(--background-dark-navy)] border-[0.5px] border-[var(--border-color)] group-hover:border-[#ff4444] group-hover:shadow-[0_0_25px_rgba(255,68,68,0.3)] transition-all duration-300">
          {imageUrl ? (
            <>
              <Image
                src={imageUrl}
                alt={post.mainImage?.alt || post.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              {/* Gradient overlay - darker for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--background-dark-navy)]/90 via-[var(--background-dark-navy)]/50 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-[#ff4444]/20 to-[#ff8800]/20 opacity-30 blur-xl" />
            </div>
          )}

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
            <h3 className="text-base md:text-lg lg:text-xl font-semibold text-[var(--foreground)] group-hover:text-[#ff4444] transition-colors duration-300 line-clamp-3 leading-tight drop-shadow-lg mb-2">
              {post.title}
            </h3>
            <ViewCount viewCount={post.viewCount} className="text-[var(--foreground)]/80" />
          </div>
        </div>
      </Link>
    );
  }

  // Regular horizontal cards with overlay (more horizontal)
  return (
    <Link
      href={`/posts/${slug}`}
      className="group block relative transition-all duration-300 h-full"
    >
      {/* Image with overlay - more horizontal aspect ratio */}
      <div className="relative w-full aspect-[3/1] overflow-hidden bg-[var(--background-dark-navy)] border-[0.5px] border-[var(--border-color)] group-hover:border-[#ff4444] group-hover:shadow-[0_0_25px_rgba(255,68,68,0.3)] transition-all duration-300">
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={post.mainImage?.alt || post.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {/* Gradient overlay - darker for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background-dark-navy)]/90 via-[var(--background-dark-navy)]/50 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-[#ff4444]/20 to-[#ff8800]/20 opacity-30 blur-xl" />
          </div>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3">
          <h3 className="text-sm md:text-base font-semibold text-[var(--foreground)] group-hover:text-[#ff4444] transition-colors duration-300 line-clamp-3 leading-tight drop-shadow-lg mb-1">
            {post.title}
          </h3>
          <ViewCount viewCount={post.viewCount} className="text-[var(--foreground)]/80" />
        </div>
      </div>
    </Link>
  );
}

