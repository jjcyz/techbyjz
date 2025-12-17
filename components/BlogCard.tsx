import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/image';
import { isValidSlug } from '@/lib/utils';
import type { Post } from '@/types/post';

interface BlogCardProps {
  post: Post;
  featured?: boolean;
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  // Skip rendering if post doesn't have a valid slug
  if (!isValidSlug(post.slug?.current)) {
    return null;
  }

  const slug = post.slug!.current;
  const imageUrl = getImageUrl(post.mainImage, 250, 150);

  // Size classes based on featured prop
  const titleSize = featured ? 'text-lg' : 'text-xl';
  const descriptionSize = featured ? 'text-xs' : 'text-sm';
  const contentSpacing = featured ? 'space-y-2' : 'space-y-3';

  return (
    <Link
      href={`/posts/${slug}`}
      className="group block relative transition-all duration-300 h-full flex flex-col"
    >
      {/* Image container - separate from title, hover outline only on image */}
      <div className="relative w-full aspect-[21/9] overflow-hidden bg-[var(--background-dark-navy)] border-[0.5px] border-[var(--border-color)] group-hover:border-[var(--neon-cyan)] group-hover:shadow-[0_0_30px_var(--glow-cyan)] transition-all duration-300 mb-2">
        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt={post.mainImage?.alt || post.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {/* Subtle overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--background-dark-navy)]/40 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 opacity-30 blur-xl" />
          </div>
        )}
      </div>

      {/* Content - Title and Description */}
      <div className={`flex-1 flex flex-col ${contentSpacing}`}>
        {/* Title with transparent background */}
        <h3 className={`${titleSize} font-bold text-[var(--foreground)] group-hover:text-[var(--electric-blue)] transition-colors duration-300 line-clamp-2 leading-tight`}>
          {post.title}
        </h3>

        {/* Short Description */}
        {post.excerpt && (
          <p className={`${descriptionSize} text-[var(--foreground-low)] line-clamp-3 leading-relaxed flex-1`}>
            {post.excerpt}
          </p>
        )}
      </div>
    </Link>
  );
}
