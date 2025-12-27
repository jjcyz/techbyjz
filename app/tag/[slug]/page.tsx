import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { client } from '@/lib/sanity';
import { TAG_BY_SLUG_QUERY, POSTS_QUERY, CATEGORIES_QUERY } from '@/lib/queries';
import { isValidSlug } from '@/lib/utils';
import { getCollectionPageSchema, StructuredData } from '@/lib/structured-data';
import type { Post, Tag, Category } from '@/types/post';
import Footer from '@/components/shared/Footer';
import Header from '@/components/shared/Header';
import InfiniteScrollPosts from '@/components/posts/InfiniteScrollPosts';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://techbyjz.blog';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Use ISR for tag pages
export const revalidate = 60; // Revalidate every 60 seconds
export const runtime = 'nodejs';

// Generate static params for all tags
export async function generateStaticParams() {
  try {
    const tags = await client.fetch<Tag[]>(`*[_type == "tag"] | order(title asc) {
      _id,
      title,
      slug
    }`);
    return tags
      .filter((tag) => isValidSlug(tag.slug?.current))
      .map((tag) => ({
        slug: tag.slug!.current,
      }));
  } catch (error) {
    console.error('Error generating static params for tags:', error);
    return [];
  }
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!isValidSlug(slug)) {
    return {
      title: 'Tag Not Found',
    };
  }

  const tag = await client.fetch<Tag | null>(TAG_BY_SLUG_QUERY, { slug });

  if (!tag) {
    return {
      title: 'Tag Not Found',
    };
  }

  // Get post count for better description
  const postCount = await client.fetch<number>(
    `count(*[_type == "post" && $tagId in tags[]._ref])`,
    { tagId: tag._id }
  );

  const tagUrl = `${SITE_URL}/tag/${tag.slug!.current}`;
  const description = `Browse ${postCount} ${postCount === 1 ? 'post' : 'posts'} tagged with ${tag.title} on TechByJZ`;

  return {
    title: `${tag.title} - TechByJZ`,
    description,
    openGraph: {
      title: `${tag.title} - TechByJZ`,
      description,
      url: tagUrl,
      siteName: 'TechByJZ',
      locale: 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${tag.title} - TechByJZ`,
      description,
    },
    alternates: {
      canonical: tagUrl,
    },
  };
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params;

  // Validate slug
  if (!isValidSlug(slug)) {
    notFound();
  }

  // First fetch tag to get its ID
  const tag = await client.fetch<Tag | null>(TAG_BY_SLUG_QUERY, { slug }, {
    next: { revalidate: 60 }
  });

  // If tag not found, show 404
  if (!tag || !tag.slug?.current || !isValidSlug(tag.slug.current)) {
    notFound();
  }

  // Fetch first page of posts, all posts (for search), total count, and categories in parallel
  const [posts, allPosts, totalCount, categories] = await Promise.all([
    client.fetch<Post[]>(
      `*[_type == "post" && $tagId in tags[]._ref] | order(publishedAt desc) [0...12] {
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
      { tagId: tag._id },
      { next: { revalidate: 60 } }
    ),
    client.fetch<Post[]>(POSTS_QUERY, {}, {
      next: { revalidate: 60 }
    }),
    client.fetch<number>(
      `count(*[_type == "post" && $tagId in tags[]._ref])`,
      { tagId: tag._id },
      { next: { revalidate: 60 } }
    ),
    client.fetch<Category[]>(CATEGORIES_QUERY, {}, {
      next: { revalidate: 60 }
    })
  ]);

  // Filter posts to only show those with valid slugs
  const validPosts = posts.filter((post) => isValidSlug(post.slug?.current));

  // Generate structured data
  const tagUrl = `${SITE_URL}/tag/${tag.slug!.current}`;
  const collectionPageSchema = getCollectionPageSchema(
    tag.title,
    `Browse all posts tagged with ${tag.title}`,
    totalCount,
    tagUrl
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

      {/* Tag Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--electric-blue)] mb-2">
          {tag.title}
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
            fetchUrl="/api/posts/tag"
            slug={slug}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-[var(--foreground-muted)] text-lg mb-4">
              No posts found with this tag.
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

