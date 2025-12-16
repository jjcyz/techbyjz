import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/image';
import { isValidSlug } from '@/lib/utils';
import type { Post } from '@/types/post';

interface FeaturedCardProps {
  post: Post;
}

export default function FeaturedCard({ post }: FeaturedCardProps) {
  if (!isValidSlug(post.slug?.current)) {
    return null;
  }

  const slug = post.slug!.current;
  const imageUrl = getImageUrl(post.mainImage, 400, 250);

  return (
    <Link
      href={`/posts/${slug}`}
      className="group block relative transition-all duration-300 h-full flex flex-col"
    >
      {/* Large prominent image */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-[var(--background-dark-navy)] border-[0.5px] border-[var(--border-color)] group-hover:border-[var(--neon-cyan)] group-hover:shadow-[0_0_30px_var(--glow-cyan)] transition-all duration-300 mb-3">
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={post.mainImage?.alt || post.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background-dark-navy)]/40 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 opacity-30 blur-xl" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col space-y-2">
        <h3 className="text-lg font-bold text-[var(--foreground)] group-hover:text-[var(--neon-cyan)] transition-colors duration-300 line-clamp-2 leading-tight">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-xs text-[var(--foreground-low)] line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}

