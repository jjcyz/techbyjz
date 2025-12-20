import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { client } from '@/lib/sanity';
import { POST_BY_SLUG_QUERY, CATEGORIES_QUERY, RELATED_POSTS_QUERY, RECENT_POSTS_QUERY } from '@/lib/queries';
import { getImageUrl } from '@/lib/image';
import { isValidSlug } from '@/lib/utils';
import type { Post, Category, Tag } from '@/types/post';
import { PortableText } from '@portabletext/react';
import Footer from '@/components/shared/Footer';
import RelatedPosts from '@/components/posts/RelatedPosts';
import SocialShareButtons from '@/components/posts/SocialShareButtons';
import ViewTracker from '@/components/posts/ViewTracker';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Use on-demand ISR: posts are generated on first request, then cached
// This makes builds scalable - no need to generate all posts at build time
export const dynamicParams = true; // Allow dynamic params not in generateStaticParams
export const revalidate = 60; // Revalidate every 60 seconds (ISR)
export const runtime = 'nodejs'; // Ensure Node.js runtime for Vercel

// Optional: Pre-generate only the most recent posts for faster initial load
// This is optional - if removed, all posts will be generated on-demand
export async function generateStaticParams() {
  try {
    // Only pre-generate the latest 10 posts for faster initial load
    // All other posts will be generated on first request (on-demand ISR)
    const recentPosts = await client.fetch<Array<{ slug: { current: string } | null }>>(
      `*[_type == "post"] | order(publishedAt desc) [0...10] {
        slug { current }
      }`
    );

    return recentPosts
      .filter((item) => isValidSlug(item.slug?.current))
      .map((item) => ({
        slug: item.slug!.current,
      }));
  } catch (error) {
    console.error('Error generating static params:', error);
    // Return empty array if there's an error - pages will still work with on-demand generation
    return [];
  }
}

// Generate SEO metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!isValidSlug(slug)) {
    return {
      title: 'Post Not Found',
    };
  }

  const post = await client.fetch<Post | null>(POST_BY_SLUG_QUERY, { slug });

  if (!post || !post.slug?.current || !isValidSlug(post.slug.current)) {
    return {
      title: 'Post Not Found',
    };
  }

  const imageUrl = post.mainImage ? getImageUrl(post.mainImage, 1200, 600) : undefined;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techbyjz.com';
  const postUrl = `${siteUrl}/posts/${post.slug.current}`;

  return {
    title: post.title,
    description: post.excerpt || `Read ${post.title} on TechByJZ`,
    authors: post.authorName ? [{ name: post.authorName }] : undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt || `Read ${post.title} on TechByJZ`,
      url: postUrl,
      siteName: 'TechByJZ',
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 600,
              alt: post.mainImage?.alt || post.title,
            },
          ]
        : [],
      locale: 'en_US',
      type: 'article',
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || `Read ${post.title} on TechByJZ`,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: postUrl,
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;

  // Validate the incoming slug parameter - reject template strings and invalid slugs
  if (!isValidSlug(slug)) {
    notFound();
  }

  // Fetch the post, categories, and related posts in parallel
  const [post, categories] = await Promise.all([
    client.fetch<Post | null>(POST_BY_SLUG_QUERY, { slug }, {
      next: { revalidate: 60 }
    }),
    client.fetch<Category[]>(CATEGORIES_QUERY, {}, {
      next: { revalidate: 60 }
    })
  ]);

  // If post not found or has invalid slug, show 404
  if (!post || !post.slug?.current || !isValidSlug(post.slug.current)) {
    notFound();
  }

  // Fetch related posts based on categories, fallback to recent posts if no matches
  const categoryIds = post.categories || []; // Now categories is already an array of strings
  let relatedPosts: Post[] = [];

  if (categoryIds.length > 0) {
    relatedPosts = await client.fetch<Post[]>(RELATED_POSTS_QUERY, {
      postId: post._id,
      categoryIds,
    }, {
      next: { revalidate: 60 }
    });
  }

  // If no related posts found by category, show recent posts instead
  if (relatedPosts.length === 0) {
    relatedPosts = await client.fetch<Post[]>(RECENT_POSTS_QUERY, {
      postId: post._id,
    }, {
      next: { revalidate: 60 }
    });
  }

  const imageUrl = getImageUrl(post.mainImage, 1200, 600);
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techbyjz.com';
  const postUrl = `${siteUrl}/posts/${post.slug.current}`;

  return (
    <main className="min-h-screen relative">
      {/* Track view count */}
      <ViewTracker slug={post.slug.current} />

      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pt-6 pb-3">
          <Link
            href="/"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--electric-blue)] hover:border-[var(--electric-blue)] hover:bg-[var(--electric-blue)]/10 transition-all duration-300 text-xs font-medium"
          >
            ← Back to Posts
          </Link>
        </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-8 md:py-12 lg:py-16">
        {/* Post Header */}
        <header className="mb-6 text-center">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-3 leading-tight">
            {post.title}
          </h1>

          {formattedDate && (
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-[var(--text-gray-400)] mb-4">
              <time className="text-[var(--text-gray-500)]">{formattedDate}</time>
              {(() => {
                // Safely get view count, defaulting to 0 if null/undefined/invalid
                let viewCount = 0;
                if (typeof post.viewCount === 'number' && !isNaN(post.viewCount)) {
                  viewCount = post.viewCount;
                } else if (post.viewCount != null) {
                  const parsed = Number(post.viewCount);
                  viewCount = isNaN(parsed) ? 0 : parsed;
                }
                return (
                  <>
                    <span className="text-[var(--text-gray-500)]">•</span>
                    <span className="text-[var(--text-gray-500)]">
                      {viewCount.toLocaleString()} {viewCount === 1 ? 'view' : 'views'}
                    </span>
                  </>
                );
              })()}
            </div>
          )}

          {/* Categories - More prominent, above tags */}
          {post.categories && post.categories.length > 0 ? (
            <div className="mb-4">
              <div className="flex flex-wrap justify-center items-center gap-2">
                {post.categories.map((categoryId) => {
                  const category = categories.find((cat) => cat._id === categoryId);
                  if (!category || !category.slug?.current) return null;

                  return (
                    <Link
                      key={category._id}
                      href={`/category/${category.slug.current}`}
                      className="inline-flex items-center px-3 py-1.5 bg-[var(--card-bg)] border-2 border-[var(--electric-blue)] text-[var(--electric-blue)] hover:bg-[var(--electric-blue)] hover:text-[var(--background-dark-navy)] transition-all duration-300 text-sm font-semibold shadow-[0_0_10px_rgba(0,191,255,0.2)] hover:shadow-[0_0_15px_rgba(0,191,255,0.4)]"
                    >
                      {category.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Tags - Secondary, smaller, below categories */}
          {post.tags && post.tags.length > 0 ? (
            <div className="mb-6">
              <div className="flex flex-wrap justify-center items-center gap-1.5">
                {post.tags.map((tag, index) => {
                  // Handle both string tags and reference objects
                  const tagObj = typeof tag === 'string' ? null : (tag as Tag);
                  const tagTitle = typeof tag === 'string' ? tag : tagObj?.title || String(tag);
                  const tagSlug = tagObj?.slug?.current;

                  // If tag has a slug, link to tag page, otherwise fallback to search
                  const href = tagSlug && isValidSlug(tagSlug)
                    ? `/tag/${tagSlug}`
                    : `/?search=${encodeURIComponent(tagTitle)}`;

                  return (
                    <Link
                      key={index}
                      href={href}
                      className="inline-flex items-center px-2 py-0.5 bg-[var(--dark-blue)] border border-[var(--border-color)] text-[var(--text-gray-300)] hover:border-[var(--electric-blue)] hover:text-[var(--electric-blue)] hover:bg-[var(--card-bg)] transition-all duration-300 text-xs"
                    >
                      {tagTitle}
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : null}
        </header>

        {/* Featured Image */}
        {imageUrl ? (
          <div className="relative w-full h-40 md:h-56 lg:h-72 mb-4 overflow-hidden bg-[var(--background-dark-navy)] border border-[var(--border-color)]">
            <Image
              src={imageUrl}
              alt={post.mainImage?.alt || post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 896px, 1280px"
            />
          </div>
        ) : null}

        {/* Post Excerpt */}
        {post.excerpt && (
          <p className="text-xs sm:text-sm md:text-base text-[var(--foreground-low)] mb-6 leading-relaxed text-center max-w-3xl mx-auto">
            {post.excerpt}
          </p>
        )}

        {/* Post Body */}
        {(() => {
          const content = post.content || post.body;

          // Debug: Log content structure
          if (process.env.NODE_ENV === 'development') {
            console.log('Post content:', JSON.stringify(content, null, 2));
          }

          return content ? (
            Array.isArray(content) && content.length > 0 ? (
              <div className="max-w-none">
                <PortableText
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  value={content as any}
                components={{
                  block: {
                    normal: ({ children }) => (
                      <p className="text-xs sm:text-sm md:text-base text-[var(--foreground)] mb-3 leading-relaxed max-w-[65ch] mx-auto">{children}</p>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-[var(--foreground)] mb-3 mt-6 first:mt-0 max-w-[65ch] mx-auto">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-base md:text-lg lg:text-xl font-bold text-[var(--foreground)] mb-2 mt-5 first:mt-0 max-w-[65ch] mx-auto">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm md:text-base lg:text-lg font-bold text-[var(--foreground)] mb-2 mt-4 first:mt-0 max-w-[65ch] mx-auto">{children}</h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="text-sm md:text-base font-bold text-[var(--foreground)] mb-1.5 mt-3 first:mt-0 max-w-[65ch] mx-auto">{children}</h4>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-[var(--electric-blue)] pl-3 my-4 italic text-xs sm:text-sm text-[var(--foreground-low)] bg-[var(--card-bg)]/30 py-2 max-w-[65ch] mx-auto leading-relaxed">
                        {children}
                      </blockquote>
                    ),
                  },
                  list: {
                    bullet: ({ children }) => (
                      <ul className="list-disc list-outside mb-3 text-xs sm:text-sm md:text-base text-[var(--foreground)] space-y-1.5 ml-5 max-w-[65ch] mx-auto leading-relaxed">{children}</ul>
                    ),
                    number: ({ children }) => (
                      <ol className="list-decimal list-outside mb-3 text-xs sm:text-sm md:text-base text-[var(--foreground)] space-y-1.5 ml-5 max-w-[65ch] mx-auto leading-relaxed">{children}</ol>
                    ),
                  },
                  listItem: {
                    bullet: ({ children }) => <li className="mb-1 leading-relaxed">{children}</li>,
                    number: ({ children }) => <li className="mb-1 leading-relaxed">{children}</li>,
                  },
                  marks: {
                    strong: ({ children }) => <strong className="font-bold text-[var(--foreground)]">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    code: ({ children }) => (
                      <code className="bg-[var(--card-bg)] px-1.5 py-0.5 text-[var(--electric-blue)] text-xs font-mono">
                        {children}
                      </code>
                    ),
                    link: ({ children, value }) => {
                      const href = value?.href || '#';
                      return (
                        <a
                          href={href}
                          target={href.startsWith('http') ? '_blank' : undefined}
                          rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="text-[var(--electric-blue)] hover:text-[var(--electric-blue)] underline transition-colors"
                        >
                          {children}
                        </a>
                      );
                    },
                  },
                  types: {
                    image: ({ value }) => {
                      const imageUrl = getImageUrl(value, 800);
                      if (!imageUrl) return null;
                      return (
                        <div className="my-12 max-w-full">
                          <Image
                            src={imageUrl}
                            alt={value.alt || ''}
                            width={800}
                            height={600}
                            className="mx-auto rounded-lg"
                          />
                        </div>
                      );
                    },
                  },
                }}
              />
            </div>
          ) : (
            <div className="text-[var(--foreground-muted)] italic mb-8">
              <p>No content available for this post.</p>
            </div>
          )
          ) : (
            <div className="text-[var(--foreground-muted)] italic mb-8">
              <p>This post does not have any content yet.</p>
            </div>
          );
        })()}

        {/* Social Share Buttons */}
        <SocialShareButtons
          title={post.title}
          url={postUrl}
          excerpt={post.excerpt}
        />

        {/* Related Posts */}
        <RelatedPosts posts={relatedPosts} currentPostSlug={post.slug.current} />
      </article>

      {/* Footer */}
      <Footer categories={categories} />
    </main>
  );
}

