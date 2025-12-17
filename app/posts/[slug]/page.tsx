import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { client } from '@/lib/sanity';
import { POST_BY_SLUG_QUERY, POST_SLUGS_QUERY, CATEGORIES_QUERY, RELATED_POSTS_QUERY, RECENT_POSTS_QUERY } from '@/lib/queries';
import { getImageUrl } from '@/lib/image';
import { isValidSlug } from '@/lib/utils';
import type { Post, Category, Tag } from '@/types/post';
import { PortableText } from '@portabletext/react';
import Footer from '@/components/shared/Footer';
import RelatedPosts from '@/components/posts/RelatedPosts';
import SocialShareButtons from '@/components/posts/SocialShareButtons';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for all posts (for SSG)
export async function generateStaticParams() {
  const slugs = await client.fetch(POST_SLUGS_QUERY);

  return slugs
    .filter((item: { slug: { current: string } | null }) => isValidSlug(item.slug?.current))
    .map((item: { slug: { current: string } }) => ({
      slug: item.slug.current,
    }));
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
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pt-8 pb-4">
          <Link
            href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--electric-blue)] hover:border-[var(--electric-blue)] hover:bg-[var(--electric-blue)]/10 transition-all duration-300 text-sm font-medium"
          >
            ← Back to Posts
          </Link>
        </div>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 py-16 md:py-24 lg:py-32">
        {/* Post Header */}
        <header className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-6 leading-tight">
            {post.title}
          </h1>

          {formattedDate && (
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--text-gray-400)] mb-6">
              <time className="text-[var(--text-gray-500)]">{formattedDate}</time>
            </div>
          )}

          {/* Categories and Tags */}
          {(post.categories && post.categories.length > 0) || (post.tags && post.tags.length > 0) ? (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {post.categories?.map((categoryId) => {
                const category = categories.find((cat) => cat._id === categoryId);
                if (!category) return null;
                return (
                <span
                  key={category._id}
                  className="px-3 py-1 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--electric-blue)] text-sm"
                >
                  {category.title}
                </span>
                );
              })}
              {post.tags?.map((tag, index) => {
                // Handle both string tags and reference objects
                const tagValue = typeof tag === 'string' ? tag : (tag as Tag)?.title || String(tag);
                return (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[var(--dark-blue)] border border-[var(--border-color)] text-[var(--text-gray-300)] text-sm"
                  >
                    #{tagValue}
                  </span>
                );
              })}
            </div>
          ) : null}
        </header>

        {/* Featured Image */}
        {imageUrl ? (
          <div className="relative w-full h-64 md:h-96 lg:h-[500px] mb-8 overflow-hidden bg-[var(--background-dark-navy)] border border-[var(--border-color)]">
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
          <p className="text-lg md:text-xl lg:text-2xl text-[var(--foreground-low)] mb-12 leading-relaxed text-center max-w-3xl mx-auto">
            {post.excerpt}
          </p>
        )}

        {/* Post Body */}
        {(() => {
          const content = post.content || post.body;
          return content ? (
            Array.isArray(content) && content.length > 0 ? (
              <div className="prose prose-invert prose-xl max-w-none">
                <PortableText
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  value={content as any}
                components={{
                  block: {
                    normal: ({ children }) => (
                      <p className="text-base md:text-lg lg:text-xl text-[var(--foreground)] mb-6 leading-[1.75] max-w-[65ch] mx-auto">{children}</p>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-6 mt-12 first:mt-0 max-w-[65ch] mx-auto">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-4 mt-10 first:mt-0 max-w-[65ch] mx-auto">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3 mt-8 first:mt-0 max-w-[65ch] mx-auto">{children}</h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="text-lg md:text-xl font-bold text-[var(--foreground)] mb-2 mt-6 first:mt-0 max-w-[65ch] mx-auto">{children}</h4>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-[var(--electric-blue)] pl-6 my-8 italic text-base md:text-lg text-[var(--foreground-low)] bg-[var(--card-bg)]/30 py-4 max-w-[65ch] mx-auto leading-relaxed">
                        {children}
                      </blockquote>
                    ),
                  },
                  list: {
                    bullet: ({ children }) => (
                      <ul className="list-disc list-outside mb-6 text-base md:text-lg text-[var(--foreground)] space-y-3 ml-6 max-w-[65ch] mx-auto leading-relaxed">{children}</ul>
                    ),
                    number: ({ children }) => (
                      <ol className="list-decimal list-outside mb-6 text-base md:text-lg text-[var(--foreground)] space-y-3 ml-6 max-w-[65ch] mx-auto leading-relaxed">{children}</ol>
                    ),
                  },
                  listItem: {
                    bullet: ({ children }) => <li className="mb-2 leading-[1.75]">{children}</li>,
                    number: ({ children }) => <li className="mb-2 leading-[1.75]">{children}</li>,
                  },
                  marks: {
                    strong: ({ children }) => <strong className="font-bold text-[var(--foreground)]">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    code: ({ children }) => (
                      <code className="bg-[var(--card-bg)] px-2 py-1 text-[var(--electric-blue)] text-base font-mono">
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

