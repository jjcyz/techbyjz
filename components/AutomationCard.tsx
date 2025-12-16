import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/image';
import { isValidSlug } from '@/lib/utils';
import type { Post } from '@/types/post';

interface AutomationCardProps {
  post: Post;
}

export default function AutomationCard({ post }: AutomationCardProps) {
  if (!isValidSlug(post.slug?.current)) {
    return null;
  }

  const slug = post.slug!.current;
  const imageUrl = getImageUrl(post.mainImage, 280, 180);

  return (
    <Link
      href={`/posts/${slug}`}
      className="group block relative transition-all duration-300 h-full flex flex-col"
    >
      {/* Medium vertical image with magenta accent */}
      <div className="relative w-full aspect-[14/9] overflow-hidden bg-[var(--background-dark-navy)] border-[0.5px] border-[var(--border-color)] group-hover:border-[var(--magenta)] group-hover:shadow-[0_0_25px_rgba(255,0,255,0.3)] transition-all duration-300 mb-2">
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
            <div className="w-10 h-10 bg-gradient-to-br from-[var(--magenta)]/20 to-[var(--purple)]/20 opacity-30 blur-xl" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col space-y-1.5">
        <h3 className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[var(--magenta)] transition-colors duration-300 line-clamp-2 leading-tight">
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

