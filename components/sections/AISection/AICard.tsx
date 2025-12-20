import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/image';
import { isValidSlug } from '@/lib/utils';
import type { Post } from '@/types/post';
import ViewCount from '@/components/posts/ViewCount';

interface AICardProps {
  post: Post;
}

export default function AICard({ post }: AICardProps) {
  if (!isValidSlug(post.slug?.current)) {
    return null;
  }

  const slug = post.slug!.current;
  const imageUrl = getImageUrl(post.mainImage, 300, 300);

  return (
    <Link
      href={`/posts/${slug}`}
      className="group block relative transition-all duration-300 h-full"
    >
      {/* Square image with purple accent and title overlay */}
      <div className="relative w-full aspect-square overflow-hidden bg-[var(--background-dark-navy)] border-[0.5px] border-[var(--border-color)] group-hover:border-[var(--purple)] group-hover:shadow-[0_0_25px_rgba(157,78,221,0.3)] transition-all duration-300">
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
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 opacity-30 blur-xl" />
          </div>
        )}

        {/* Title overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3">
          <h3 className="text-sm md:text-base font-bold text-[var(--foreground)] group-hover:text-[var(--purple)] transition-colors duration-300 line-clamp-3 leading-tight drop-shadow-lg mb-1">
            {post.title}
          </h3>
          <ViewCount viewCount={post.viewCount} className="text-[var(--foreground)]/80" />
        </div>
      </div>
    </Link>
  );
}

