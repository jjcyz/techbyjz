import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { client } from '@/lib/sanity';
import { CATEGORY_BY_SLUG_QUERY, CATEGORIES_QUERY } from '@/lib/queries';
import { isValidSlug } from '@/lib/utils';
import type { Post, Category } from '@/types/post';
import Footer from '@/components/shared/Footer';
import InfiniteScrollPosts from '@/components/posts/InfiniteScrollPosts';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Use ISR for category pages
export const revalidate = 60; // Revalidate every 60 seconds
export const runtime = 'nodejs';

// Generate static params for all categories
export async function generateStaticParams() {
  try {
    const categories = await client.fetch<Category[]>(CATEGORIES_QUERY);
    return categories
      .filter((cat) => isValidSlug(cat.slug?.current))
      .map((category) => ({
        slug: category.slug!.current,
      }));
  } catch (error) {
    console.error('Error generating static params for categories:', error);
    return [];
  }
}

// Generate metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!isValidSlug(slug)) {
    return {
      title: 'Category Not Found',
    };
  }

  const category = await client.fetch<Category | null>(CATEGORY_BY_SLUG_QUERY, { slug });

  if (!category) {
    return {
      title: 'Category Not Found',
    };
  }

  return {
    title: `${category.title} - TechByJZ`,
    description: `Browse all posts in the ${category.title} category`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  // Validate slug
  if (!isValidSlug(slug)) {
    notFound();
  }

  // First fetch category to get its ID
  const category = await client.fetch<Category | null>(CATEGORY_BY_SLUG_QUERY, { slug }, {
    next: { revalidate: 60 }
  });

  // If category not found, show 404
  if (!category || !category.slug?.current || !isValidSlug(category.slug.current)) {
    notFound();
  }

  // Fetch only first page of posts (12 posts) and categories in parallel
  const [posts, totalCount, categories] = await Promise.all([
    client.fetch<Post[]>(
      `*[_type == "post" && $categoryId in categories] | order(publishedAt desc) [0...12] {
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
      { categoryId: category._id },
      { next: { revalidate: 60 } }
    ),
    client.fetch<number>(
      `count(*[_type == "post" && $categoryId in categories])`,
      { categoryId: category._id },
      { next: { revalidate: 60 } }
    ),
    client.fetch<Category[]>(CATEGORIES_QUERY, {}, {
      next: { revalidate: 60 }
    })
  ]);

  // Filter posts to only show those with valid slugs
  const validPosts = posts.filter((post) => isValidSlug(post.slug?.current));

  return (
    <main className="min-h-screen relative">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 pt-6 pb-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--card-bg)] border border-[var(--border-color)] text-[var(--electric-blue)] hover:border-[var(--electric-blue)] hover:bg-[var(--electric-blue)]/10 transition-all duration-300 text-xs font-medium"
        >
          ← Back to Home
        </Link>
      </div>

      {/* Category Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--electric-blue)] mb-2">
          {category.title}
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
            fetchUrl="/api/posts/category"
            slug={slug}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-[var(--foreground-muted)] text-lg mb-4">
              No posts found in this category.
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
  );
}

