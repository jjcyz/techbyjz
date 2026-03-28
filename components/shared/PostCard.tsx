import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/image';
import { isValidSlug } from '@/lib/utils';
import type { Post } from '@/types/post';
import ViewCount from '@/components/posts/ViewCount';

export type PostCardVariant =
  | 'overlay-square'
  | 'overlay-featured'
  | 'overlay-horizontal'
  | 'horizontal-content';

const cardAccent = {
  hoverBorder: 'group-hover:border-[var(--electric-blue)]',
  hoverShadow: 'group-hover:shadow-md group-hover:shadow-blue-500/10',
  hoverText: 'group-hover:text-[var(--electric-blue)]',
  placeholderGradient: 'from-[var(--electric-blue)]/15 to-[var(--electric-blue)]/5',
};

interface PostCardProps {
  post: Post;
  variant?: PostCardVariant;
  featured?: boolean;
  imageWidth?: number;
  imageHeight?: number;
  className?: string;
}

export default function PostCard({
  post,
  variant = 'overlay-square',
  featured = false,
  imageWidth,
  imageHeight,
  className = '',
}: PostCardProps) {
  if (!isValidSlug(post.slug?.current)) {
    return null;
  }

  const slug = post.slug!.current;

  const defaultDims = {
    'overlay-square': { width: 300, height: 300 },
    'overlay-featured': { width: 500, height: 400 },
    'overlay-horizontal': { width: 200, height: 120 },
    'horizontal-content': { width: 200, height: 120 },
  };

  const finalWidth = imageWidth ?? (featured && variant === 'overlay-featured' ? 500 : defaultDims[variant].width);
  const finalHeight = imageHeight ?? (featured && variant === 'overlay-featured' ? 400 : defaultDims[variant].height);

  const imageUrl = getImageUrl(post.mainImage, finalWidth, finalHeight);

  if (variant === 'horizontal-content') {
    return (
      <Link
        href={`/posts/${slug}`}
        className={`group block relative transition-all duration-300 h-full flex ${featured ? 'flex-col' : 'flex-row'} gap-3 border border-[var(--border-color)] rounded-sm ${cardAccent.hoverBorder} ${cardAccent.hoverShadow} transition-all duration-300 ${featured ? 'p-4' : 'p-2'} bg-[var(--card-bg)] ${className}`}
      >
        <div className={`relative ${featured ? 'w-full aspect-[16/9]' : 'w-32 sm:w-40 flex-shrink-0 aspect-[4/3]'} overflow-hidden bg-[var(--surface-muted)] rounded-sm`}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={post.mainImage?.alt || post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes={featured ? "(max-width: 640px) 100vw, 100vw" : "160px"}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className={`w-8 h-8 bg-gradient-to-br ${cardAccent.placeholderGradient} opacity-40 blur-xl rounded-full`} />
            </div>
          )}
        </div>

        <div className={`flex-1 flex flex-col ${featured ? '' : 'justify-center'} min-w-0`}>
          <h3 className={`${featured ? 'text-base md:text-lg lg:text-xl' : 'text-sm md:text-base'} font-semibold text-[var(--foreground)] ${cardAccent.hoverText} transition-colors duration-300 line-clamp-3 leading-tight`}>
            {post.title}
          </h3>
          {featured && post.excerpt && (
            <p className="text-sm md:text-base text-[var(--foreground-low)] line-clamp-2 mt-2">
              {post.excerpt}
            </p>
          )}
          <ViewCount viewCount={post.viewCount} className={featured ? 'mt-2' : 'mt-1'} />
        </div>
      </Link>
    );
  }

  const aspectRatioClasses = {
    'overlay-square': 'aspect-square',
    'overlay-featured': 'aspect-[16/9] sm:aspect-[2/1]',
    'overlay-horizontal': 'aspect-[3/1]',
  };

  const paddingClasses = featured
    ? 'p-3 md:p-4'
    : variant === 'overlay-horizontal'
      ? 'p-2 md:p-3'
      : 'p-2 md:p-3';

  const titleSizeClasses = featured
    ? 'text-base md:text-lg lg:text-xl'
    : variant === 'overlay-horizontal'
      ? 'text-sm md:text-base'
      : 'text-sm md:text-base';

  return (
    <Link
      href={`/posts/${slug}`}
      className={`group block h-full ${className}`}
    >
      <div className={`flex h-full min-h-0 flex-col overflow-hidden rounded-sm border border-[var(--border-color)] bg-[var(--card-bg)] ${cardAccent.hoverBorder} ${cardAccent.hoverShadow} transition-all duration-300`}>
        <div className={`relative w-full shrink-0 ${aspectRatioClasses[variant]} bg-[var(--surface-muted)]`}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={post.mainImage?.alt || post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`${variant === 'overlay-square' ? 'w-12 h-12' : 'w-10 h-10'} bg-gradient-to-br ${cardAccent.placeholderGradient} opacity-40 blur-xl rounded-full`} />
            </div>
          )}
        </div>

        <div className={`flex min-h-0 flex-1 flex-col justify-center border-t border-[var(--border-color)] bg-[var(--card-bg)] ${paddingClasses}`}>
          <h3 className={`${titleSizeClasses} ${variant === 'overlay-square' && !featured ? 'font-bold' : 'font-semibold'} text-[var(--foreground)] ${cardAccent.hoverText} transition-colors duration-300 line-clamp-3 leading-tight ${featured ? 'mb-2' : 'mb-1'}`}>
            {post.title}
          </h3>
          <ViewCount viewCount={post.viewCount} />
        </div>
      </div>
    </Link>
  );
}
