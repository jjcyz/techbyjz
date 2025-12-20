import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/image';
import { isValidSlug } from '@/lib/utils';
import type { Post } from '@/types/post';
import ViewCount from '@/components/posts/ViewCount';

interface AutomationCardProps {
  post: Post;
  featured?: boolean;
}

export default function AutomationCard({ post, featured = false }: AutomationCardProps) {
  if (!isValidSlug(post.slug?.current)) {
    return null;
  }

  const slug = post.slug!.current;
  const imageUrl = getImageUrl(post.mainImage, featured ? 500 : 150, featured ? 400 : 150);

  return (
    <Link
      href={`/posts/${slug}`}
      className="group block relative transition-all duration-300 h-full"
    >
      {/* Medium vertical image with blue accent */}
      <div className={`relative w-full ${featured ? 'aspect-[16/9] sm:aspect-[2/1]' : 'aspect-square'} overflow-hidden bg-[var(--background-dark-navy)] border-[0.5px] border-[var(--border-color)] group-hover:border-[var(--electric-blue)] group-hover:shadow-[0_0_25px_rgba(0,150,255,0.3)] transition-all duration-300`}>
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
            <div className={`absolute inset-0 ${featured ? 'bg-gradient-to-t from-[var(--background-dark-navy)]/90 via-[var(--background-dark-navy)]/50 to-transparent' : 'bg-gradient-to-t from-[var(--background-dark-navy)]/85 via-[var(--background-dark-navy)]/40 to-transparent'}`} />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--electric-blue)]/20 to-[var(--electric-blue)]/20 opacity-30 blur-xl" />
          </div>
        )}

        {/* Title overlay for all cards */}
        <div className={`absolute bottom-0 left-0 right-0 ${featured ? 'p-3 md:p-4' : 'p-2 md:p-2.5'}`}>
          <h3 className={`${featured ? 'text-base md:text-lg lg:text-xl' : 'text-sm md:text-base'} font-semibold text-[var(--foreground)] group-hover:text-[var(--electric-blue)] transition-colors duration-300 ${featured ? 'line-clamp-3' : 'line-clamp-3'} leading-tight drop-shadow-lg ${featured ? 'mb-2' : 'mb-1'}`}>
            {post.title}
          </h3>
          <ViewCount viewCount={post.viewCount} className="text-[var(--foreground)]/80" />
        </div>
      </div>
    </Link>
  );
}

