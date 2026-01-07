import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { client } from '@/lib/sanity';
import { POST_BY_SLUG_QUERY, POSTS_QUERY, CATEGORIES_QUERY, RELATED_POSTS_QUERY, RECENT_POSTS_QUERY } from '@/lib/queries';
import { getImageUrl } from '@/lib/image';
import { isValidSlug, parseViewCount, getSiteUrl } from '@/lib/utils';
import { getArticleSchema, getBreadcrumbSchema, StructuredData } from '@/lib/structured-data';
import type { Post, Category, Tag } from '@/types/post';
import Footer from '@/components/shared/Footer';
import Header from '@/components/shared/Header';
import RelatedPosts from '@/components/posts/RelatedPosts';
import SocialShareButtons from '@/components/posts/SocialShareButtons';
import ViewTracker from '@/components/posts/ViewTracker';
import PostContent from '@/components/posts/PostContent';
import PostTitle from '@/components/posts/PostTitle';
import PostExcerpt from '@/components/posts/PostExcerpt';
import { AdSenseSidebar } from '@/components/ads/AdSense';

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
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const post = await client.fetch<Post | null>(POST_BY_SLUG_QUERY, { slug });

  if (!post || !post.slug?.current || !isValidSlug(post.slug.current)) {
    return {
      title: 'Post Not Found',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const imageUrl = post.mainImage ? getImageUrl(post.mainImage, 1200, 600) : undefined;
  const siteUrl = getSiteUrl();
  const postSlug = post.slug?.current || '';
  const postUrl = postSlug ? `${siteUrl}/posts/${postSlug}` : siteUrl;

  return {
    title: post.title,
    description: post.excerpt || `Read ${post.title} on TechByJZ`,
    authors: post.authorName ? [{ name: post.authorName }] : undefined,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
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

  // Fetch the post, all posts (for search), categories, and related posts in parallel
  const [post, allPosts, categories] = await Promise.all([
    client.fetch<Post | null>(POST_BY_SLUG_QUERY, { slug }, {
      next: { revalidate: 60 }
    }),
    client.fetch<Post[]>(POSTS_QUERY, {}, {
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

  // Prepare valid categories for rendering
  // POST_BY_SLUG_QUERY dereferences categories to Category objects
  const validCategories: Category[] = post.categories && Array.isArray(post.categories) && post.categories.length > 0
    ? (post.categories as unknown as Category[])
        .filter((cat): cat is Category => {
          return cat !== null &&
                 typeof cat === 'object' &&
                 '_id' in cat &&
                 cat.slug?.current !== undefined;
        })
    : [];

  // Fetch related posts based on categories, fallback to recent posts if no matches
  // Extract category IDs from dereferenced category objects
  const categoryIds = validCategories.length > 0
    ? validCategories.map(cat => cat._id)
    : [];
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

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const siteUrl = getSiteUrl();
  const postSlug = post.slug?.current || '';
  const postUrl = postSlug ? `${siteUrl}/posts/${postSlug}` : siteUrl;

  // Generate structured data for SEO
  const articleSchema = getArticleSchema(post, validCategories);

  // Build breadcrumb items
  const breadcrumbItems = [
    { name: 'Home', url: siteUrl },
    ...(validCategories.length > 0
      ? [
          {
            name: validCategories[0].title,
            url: `${siteUrl}/category/${validCategories[0].slug!.current}`,
          },
        ]
      : []),
    { name: post.title, url: postUrl },
  ];
  const breadcrumbSchema = getBreadcrumbSchema(breadcrumbItems);

  // Combine all structured data
  const structuredData = [articleSchema, breadcrumbSchema].filter(Boolean);

  return (
    <>
      <StructuredData data={structuredData} />
      <Header posts={allPosts.filter((p) => isValidSlug(p.slug?.current))} categories={categories} />
      <main id="main-content" className="min-h-screen relative">
      {/* Track view count */}
      <ViewTracker slug={post.slug.current} />

      {/* Post Layout with Sidebar Ads */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 md:py-12 lg:py-16">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 xl:gap-12">
          {/* Left Sidebar Ad - Hidden on mobile/tablet, visible on desktop */}
          <aside className="hidden lg:flex lg:w-64 xl:w-72 2xl:w-80 flex-shrink-0 justify-center">
            <AdSenseSidebar
              adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_POST}
            />
          </aside>

          {/* Main Content */}
          <article className="flex-1 max-w-4xl mx-auto lg:mx-0">
            {/* Back Button - Aligned with content */}
            <div className="mb-6">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--electric-blue)] hover:border-[var(--electric-blue)] hover:bg-[var(--electric-blue)]/10 transition-all duration-300 text-xs font-medium"
              >
                ← Back to Posts
              </Link>
            </div>
            {/* Post Header */}
            <header className="mb-6 text-center">
              <PostTitle initialData={post} />

              {formattedDate && (
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-[var(--text-gray-400)] mb-4">
                  <time className="text-[var(--text-gray-500)]">{formattedDate}</time>
                  {(() => {
                    const viewCount = parseViewCount(post.viewCount);
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

              {/* Categories and Tags - Same size styling */}
              {(validCategories.length > 0 || (post.tags && Array.isArray(post.tags) && post.tags.length > 0)) && (
                <div className="mb-6">
                  <div className="flex flex-wrap justify-center items-center gap-1.5">
                    {/* Categories */}
                    {validCategories.map((category) => (
                      <Link
                        key={category._id}
                        href={`/category/${category.slug!.current}`}
                        className="inline-flex items-center px-2 py-0.5 bg-[var(--dark-blue)] border border-[var(--border-color)] text-[var(--text-gray-300)] hover:border-[var(--electric-blue)] hover:text-[var(--electric-blue)] hover:bg-[var(--card-bg)] transition-all duration-300 text-xs"
                      >
                        {category.title}
                      </Link>
                    ))}

                    {/* Tags */}
                    {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && post.tags.map((tag, index) => {
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
                          key={typeof tag === 'object' && tag !== null && '_id' in tag ? (tag as Tag)._id : index}
                          href={href}
                          className="inline-flex items-center px-2 py-0.5 bg-[var(--dark-blue)] border border-[var(--border-color)] text-[var(--text-gray-300)] hover:border-[var(--electric-blue)] hover:text-[var(--electric-blue)] hover:bg-[var(--card-bg)] transition-all duration-300 text-xs"
                        >
                          {tagTitle}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </header>

            {/* Post Excerpt */}
            <PostExcerpt initialData={post} />

            {/* Post Body */}
            <PostContent initialData={post} />

            {/* Social Share Buttons */}
            <SocialShareButtons
              title={post.title}
              url={postUrl}
              excerpt={post.excerpt}
            />

            {/* Related Posts */}
            <RelatedPosts posts={relatedPosts} currentPostSlug={post.slug.current} />
          </article>

          {/* Right Sidebar Ad - Hidden on mobile/tablet, visible on desktop */}
          <aside className="hidden lg:flex lg:w-64 xl:w-72 2xl:w-80 flex-shrink-0 justify-center">
            <AdSenseSidebar
              adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_POST}
            />
          </aside>
        </div>
      </div>

      {/* Footer */}
      <Footer categories={categories} />
      </main>
    </>
  );
}

