import { redirect, notFound } from 'next/navigation';
import { client } from '@/lib/sanity';
import { POST_BY_SLUG_QUERY } from '@/lib/queries';
import { isValidSlug } from '@/lib/utils';
import type { Post } from '@/types/post';

/**
 * Catch-all route for root-level slugs
 * If a slug exists as a post, redirect to /posts/[slug]
 * Otherwise, return 404
 *
 * This handles cases where Google or external sites link to posts
 * without the /posts/ prefix (e.g., /future-ai-scanning-apps-predictions/)
 *
 * Note: This route won't interfere with existing static routes like /about, /contact, etc.
 * because Next.js prioritizes static routes over dynamic catch-all routes.
 */
export async function generateStaticParams() {
  // Don't pre-generate any params - let this be dynamic
  return [];
}

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Skip if slug is a known static route (these should be handled by their own routes)
  // But this is a safety check - Next.js will prioritize static routes anyway
  const staticRoutes = ['about', 'privacy', 'terms', 'contact', 'studio', 'category', 'tag', 'posts'];
  if (staticRoutes.includes(slug.toLowerCase())) {
    notFound(); // These routes should be handled elsewhere
  }

  // Validate slug format
  if (!isValidSlug(slug)) {
    notFound(); // Invalid slug format
  }

  try {
    // Check if this slug exists as a post
    const post = await client.fetch<Post | null>(POST_BY_SLUG_QUERY, { slug }, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    // If post exists, redirect to the correct URL with /posts/ prefix
    if (post && post.slug?.current && isValidSlug(post.slug.current)) {
      redirect(`/posts/${post.slug.current}`); // Redirect to correct URL
    }
  } catch (error) {
    // If there's an error, return 404
    console.error('Error checking slug:', error);
  }

  // If no post found, return 404
  notFound();
}

