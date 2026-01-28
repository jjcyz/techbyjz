import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { client } from '@/lib/sanity';
import { POSTS_QUERY, CATEGORIES_QUERY } from '@/lib/queries';
import { isValidSlug, getSiteUrl } from '@/lib/utils';
import { getCollectionPageSchema, StructuredData } from '@/lib/structured-data';
import { fetchOptions } from '@/lib/revalidation-config';
import type { Post, Category } from '@/types/post';
import Footer from '@/components/shared/Footer';
import Header from '@/components/shared/Header';
import InfiniteScrollPosts from '@/components/posts/InfiniteScrollPosts';
import Link from 'next/link';

const SITE_URL = getSiteUrl();

// Use ISR for posts listing page
export const revalidate = 3600; // 1 hour - update in lib/revalidation-config.ts if needed
export const runtime = 'nodejs';

// Generate metadata
export const metadata: Metadata = {
  title: 'All Posts - TechByJZ',
  description: 'Browse all posts on TechByJZ. Discover the latest insights on technology, AI, automation, and cybersecurity.',
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
    title: 'All Posts - TechByJZ',
    description: 'Browse all posts on TechByJZ. Discover the latest insights on technology, AI, automation, and cybersecurity.',
    url: `${SITE_URL}/posts`,
    siteName: 'TechByJZ',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'All Posts - TechByJZ',
    description: 'Browse all posts on TechByJZ. Discover the latest insights on technology, AI, automation, and cybersecurity.',
  },
  alternates: {
    canonical: `${SITE_URL}/posts`,
  },
};

export default async function PostsPage() {
  // Fetch first page of posts, all posts (for search), total count, and categories in parallel
  const [posts, allPosts, totalCount, categories] = await Promise.all([
    client.fetch<Post[]>(
      `*[_type == "post"] | order(publishedAt desc) [0...12] {
        _id,
        title,
        slug,
        excerpt,
        publishedAt,
        viewCount,
        mainImage {
          _type,
          asset {
            _ref,
            _type
          },
          alt
        },
        "authorName": author->name,
        categories,
        tags[]->{
          _id,
          title,
          slug
        }
      }`,
      {},
      fetchOptions.fetch
    ),
    client.fetch<Post[]>(POSTS_QUERY, {}, fetchOptions.fetch),
    client.fetch<number>(
      `count(*[_type == "post"])`,
      {},
      fetchOptions.fetch
    ),
    client.fetch<Category[]>(CATEGORIES_QUERY, {}, fetchOptions.fetch)
  ]);

  // Filter posts to only show those with valid slugs
  const validPosts = posts.filter((post) => isValidSlug(post.slug?.current));

  // Generate structured data
  const postsUrl = `${SITE_URL}/posts`;
  const collectionPageSchema = getCollectionPageSchema(
    'All Posts',
    'Browse all posts on TechByJZ',
    totalCount,
    postsUrl
  );

  return (
    <>
      <StructuredData data={collectionPageSchema} />
      <Header posts={allPosts.filter((p) => isValidSlug(p.slug?.current))} categories={categories} />
      <main id="main-content" className="min-h-screen relative">
        {/* Back Button */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pt-6 pb-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--electric-blue)] hover:border-[var(--electric-blue)] hover:bg-[var(--electric-blue)]/10 transition-all duration-300 text-xs font-medium"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Posts Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-8 md:py-12">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--electric-blue)] mb-2">
            All Posts
          </h1>
          <p className="text-sm md:text-base text-[var(--foreground-low)]">
            {totalCount} {totalCount === 1 ? 'post' : 'posts'}
          </p>
        </div>

        {/* Posts Grid with Infinite Scroll */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pb-12 md:pb-16">
          {validPosts.length > 0 ? (
            <InfiniteScrollPosts
              initialPosts={validPosts}
              fetchUrl="/api/posts/all"
              slug=""
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-[var(--foreground-muted)] text-lg mb-4">
                No posts found.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] border border-[var(--electric-blue)] text-[var(--electric-blue)] hover:bg-[var(--electric-blue)] hover:text-[var(--background-dark-navy)] transition-all duration-300 text-sm font-semibold"
              >
                ← Back to Home
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <Footer categories={categories} />
      </main>
    </>
  );
}

