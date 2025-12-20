import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/image';
import { isValidSlug } from '@/lib/utils';
import type { Post } from '@/types/post';
import ViewCount from '@/components/posts/ViewCount';

export type PostCardVariant =
  | 'overlay-square'      // Square with overlay (AICard style)
  | 'overlay-featured'    // Featured wide with overlay (FeaturedCard, AutomationCard featured)
  | 'overlay-horizontal'  // Horizontal with overlay (CybersecurityCard regular)
  | 'horizontal-content'; // Horizontal with content beside (NewsCard)

export type PostCardTheme =
  | 'electric-blue'
  | 'purple'
  | 'red';

interface PostCardProps {
  post: Post;
  variant?: PostCardVariant;
  theme?: PostCardTheme;
  featured?: boolean;
  imageWidth?: number;
  imageHeight?: number;
  className?: string;
}

const themeConfig = {
  'electric-blue': {
    hoverBorder: 'group-hover:border-[var(--electric-blue)]',
    hoverShadow: 'group-hover:shadow-[0_0_25px_rgba(0,150,255,0.3)]',
    hoverText: 'group-hover:text-[var(--electric-blue)]',
    placeholderGradient: 'from-[var(--electric-blue)]/20 to-[var(--electric-blue)]/20',
  },
  purple: {
    hoverBorder: 'group-hover:border-[var(--purple)]',
    hoverShadow: 'group-hover:shadow-[0_0_25px_rgba(157,78,221,0.3)]',
    hoverText: 'group-hover:text-[var(--purple)]',
    placeholderGradient: 'from-purple-500/20 to-cyan-500/20',
  },
  red: {
    hoverBorder: 'group-hover:border-[#ff4444]',
    hoverShadow: 'group-hover:shadow-[0_0_25px_rgba(255,68,68,0.3)]',
    hoverText: 'group-hover:text-[#ff4444]',
    placeholderGradient: 'from-[#ff4444]/20 to-[#ff8800]/20',
  },
};

export default function PostCard({
  post,
  variant = 'overlay-square',
  theme = 'electric-blue',
  featured = false,
  imageWidth,
  imageHeight,
  className = '',
}: PostCardProps) {
  if (!isValidSlug(post.slug?.current)) {
    return null;
  }

  const slug = post.slug!.current;
  const themeStyles = themeConfig[theme];

  // Default image dimensions based on variant
  const defaultDims = {
    'overlay-square': { width: 300, height: 300 },
    'overlay-featured': { width: 500, height: 400 },
    'overlay-horizontal': { width: 200, height: 120 },
    'horizontal-content': { width: 200, height: 120 },
  };

  const finalWidth = imageWidth ?? (featured && variant === 'overlay-featured' ? 500 : defaultDims[variant].width);
  const finalHeight = imageHeight ?? (featured && variant === 'overlay-featured' ? 400 : defaultDims[variant].height);

  const imageUrl = getImageUrl(post.mainImage, finalWidth, finalHeight);

  // Horizontal content variant (NewsCard style)
  if (variant === 'horizontal-content') {
    return (
      <Link
        href={`/posts/${slug}`}
        className={`group block relative transition-all duration-300 h-full flex ${featured ? 'flex-col' : 'flex-row'} gap-3 border-[0.5px] border-[var(--border-color)] ${themeStyles.hoverBorder} ${themeStyles.hoverShadow} transition-all duration-300 ${featured ? 'p-4' : 'p-2'} ${className}`}
      >
        <div className={`relative ${featured ? 'w-full aspect-[16/9]' : 'w-32 sm:w-40 flex-shrink-0 aspect-[4/3]'} overflow-hidden bg-[var(--background-dark-navy)]`}>
          {imageUrl ? (
            <>
              <Image
                src={imageUrl}
                alt={post.mainImage?.alt || post.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                sizes={featured ? "(max-width: 640px) 100vw, 100vw" : "160px"}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--background-dark-navy)]/40 via-transparent to-transparent" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className={`w-8 h-8 bg-gradient-to-br ${themeStyles.placeholderGradient} opacity-30 blur-xl`} />
            </div>
          )}
        </div>

        <div className={`flex-1 flex flex-col ${featured ? '' : 'justify-center'} min-w-0`}>
          <h3 className={`${featured ? 'text-base md:text-lg lg:text-xl' : 'text-sm md:text-base'} font-semibold text-[var(--foreground)] ${themeStyles.hoverText} transition-colors duration-300 line-clamp-3 leading-tight`}>
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

  // All overlay variants share similar structure
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
      className={`group block relative transition-all duration-300 h-full ${className}`}
    >
      <div className={`relative w-full ${aspectRatioClasses[variant]} overflow-hidden bg-[var(--background-dark-navy)] border-[0.5px] border-[var(--border-color)] ${themeStyles.hoverBorder} ${themeStyles.hoverShadow} transition-all duration-300`}>
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={post.mainImage?.alt || post.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background-dark-navy)]/90 via-[var(--background-dark-navy)]/50 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className={`${variant === 'overlay-square' ? 'w-12 h-12' : 'w-10 h-10'} bg-gradient-to-br ${themeStyles.placeholderGradient} opacity-30 blur-xl`} />
          </div>
        )}

        <div className={`absolute bottom-0 left-0 right-0 ${paddingClasses}`}>
          <h3 className={`${titleSizeClasses} ${variant === 'overlay-square' && !featured ? 'font-bold' : 'font-semibold'} text-[var(--foreground)] ${themeStyles.hoverText} transition-colors duration-300 line-clamp-3 leading-tight drop-shadow-lg ${featured ? 'mb-2' : 'mb-1'}`}>
            {post.title}
          </h3>
          <ViewCount viewCount={post.viewCount} className="text-[var(--foreground)]/80" />
        </div>
      </div>
    </Link>
  );
}

