import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/image';
import { isValidSlug } from '@/lib/utils';
import type { Post } from '@/types/post';

interface NewsCardProps {
  post: Post;
  featured?: boolean;
}

export default function NewsCard({ post, featured = false }: NewsCardProps) {
  if (!isValidSlug(post.slug?.current)) {
    return null;
  }

  const slug = post.slug!.current;
  const imageUrl = getImageUrl(post.mainImage, featured ? 400 : 200, featured ? 240 : 120);

  return (
    <Link
      href={`/posts/${slug}`}
      className={`group block relative transition-all duration-300 h-full flex ${featured ? 'flex-col' : 'flex-row'} gap-3 border-[0.5px] border-[var(--border-color)] group-hover:border-[var(--electric-blue)] group-hover:shadow-[0_0_20px_var(--electric-blue)] transition-all duration-300 ${featured ? 'p-4' : 'p-2'}`}
    >
      {/* Compact horizontal image */}
      <div className={`relative ${featured ? 'w-full aspect-[16/9]' : 'w-32 sm:w-40 flex-shrink-0 aspect-[4/3]'} overflow-hidden bg-[var(--background-dark-navy)]`}>
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={post.mainImage?.alt || post.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="160px"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--background-dark-navy)]/40 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 opacity-30 blur-xl" />
          </div>
        )}
      </div>

      {/* Content - Title only for quick scanning */}
      <div className={`flex-1 flex flex-col ${featured ? '' : 'justify-center'} min-w-0`}>
        <h3 className={`${featured ? 'text-base md:text-lg lg:text-xl' : 'text-sm md:text-base'} font-semibold text-[var(--foreground)] group-hover:text-[var(--electric-blue)] transition-colors duration-300 ${featured ? 'line-clamp-3' : 'line-clamp-3'} leading-tight`}>
          {post.title}
        </h3>
        {featured && post.excerpt && (
          <p className="text-sm md:text-base text-[var(--foreground-low)] line-clamp-2 mt-2">
            {post.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}

