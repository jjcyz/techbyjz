import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { client } from '@/lib/sanity';
import { POST_BY_SLUG_QUERY, POST_SLUGS_QUERY, CATEGORIES_QUERY } from '@/lib/queries';
import { getImageUrl } from '@/lib/image';
import { isValidSlug } from '@/lib/utils';
import type { Post, Category, Tag } from '@/types/post';
import { PortableText } from '@portabletext/react';
import Footer from '@/components/Footer';

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

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;

  // Validate the incoming slug parameter - reject template strings and invalid slugs
  if (!isValidSlug(slug)) {
    notFound();
  }

  // Fetch the post and categories in parallel
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

  const imageUrl = getImageUrl(post.mainImage, 1200, 600);
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <main className="min-h-screen relative">
      {/* Header */}
      <header className="border-b border-[rgba(0,255,255,0.2)] bg-card-bg backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-4">
          <Link
            href="/"
            className="text-electric-blue hover:text-neon-cyan transition-colors inline-flex items-center gap-2"
          >
            ← Back to Posts
          </Link>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-16 md:py-24 lg:py-32">
        {/* Post Header */}
        <header className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-(--text-gray-400) mb-6">
            {post.authorName && (
              <span className="text-(--accent-blue)">By {post.authorName}</span>
            )}
            {formattedDate && (
              <time className="text-[var(--text-gray-500)]">{formattedDate}</time>
            )}
          </div>

          {/* Categories and Tags */}
          {(post.categories && post.categories.length > 0) || (post.tags && post.tags.length > 0) ? (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {post.categories?.map((category) => (
                <span
                  key={category._id}
                  className="px-3 py-1 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--accent-blue)] text-sm"
                >
                  {category.title}
                </span>
              ))}
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
          <div className="relative w-full h-64 md:h-96 mb-8 overflow-hidden bg-[var(--background-dark-navy)] border border-[var(--border-color)]">
            <Image
              src={imageUrl}
              alt={post.mainImage?.alt || post.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 896px"
            />
          </div>
        ) : null}

        {/* Post Excerpt */}
        {post.excerpt && (
          <p className="text-xl md:text-2xl text-[var(--foreground-low)] mb-12 leading-relaxed text-center max-w-3xl mx-auto">
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
                      <p className="text-lg md:text-xl text-[var(--foreground)] mb-6 leading-relaxed">{children}</p>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-6 mt-12 first:mt-0">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-4 mt-10 first:mt-0">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl md:text-2xl font-bold text-[var(--foreground)] mb-3 mt-8 first:mt-0">{children}</h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="text-lg md:text-xl font-bold text-[var(--foreground)] mb-2 mt-6 first:mt-0">{children}</h4>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-[var(--accent-blue)] pl-6 my-8 italic text-lg md:text-xl text-[var(--foreground-low)] bg-[var(--card-bg)]/30 py-4">
                        {children}
                      </blockquote>
                    ),
                  },
                  list: {
                    bullet: ({ children }) => (
                      <ul className="list-disc list-outside mb-6 text-lg md:text-xl text-[var(--foreground)] space-y-3 ml-6">{children}</ul>
                    ),
                    number: ({ children }) => (
                      <ol className="list-decimal list-outside mb-6 text-lg md:text-xl text-[var(--foreground)] space-y-3 ml-6">{children}</ol>
                    ),
                  },
                  listItem: {
                    bullet: ({ children }) => <li className="mb-2 leading-relaxed">{children}</li>,
                    number: ({ children }) => <li className="mb-2 leading-relaxed">{children}</li>,
                  },
                  marks: {
                    strong: ({ children }) => <strong className="font-bold text-[var(--foreground)]">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    code: ({ children }) => (
                      <code className="bg-[var(--card-bg)] px-2 py-1 text-[var(--accent-blue)] text-base font-mono">
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
                          className="text-[var(--accent-blue)] hover:text-[var(--neon-cyan)] underline transition-colors"
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
                        <div className="my-12">
                          <Image
                            src={imageUrl}
                            alt={value.alt || ''}
                            width={800}
                            height={600}
                            className="mx-auto"
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
      </article>

      {/* Footer */}
      <Footer categories={categories} />
    </main>
  );
}

