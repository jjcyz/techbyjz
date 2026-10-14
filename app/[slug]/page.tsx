import { redirect, notFound } from 'next/navigation';
import { client } from '@/lib/sanity';
import { POST_BY_SLUG_QUERY } from '@/lib/queries';
import { isValidSlug } from '@/lib/utils';
import { fetchOptions } from '@/lib/revalidation-config';
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
export const dynamicParams = false;
export const revalidate = 86400; // 24 hours - update in lib/revalidation-config.ts if needed

export async function generateStaticParams() {
  // Pre-generate every known post slug. Any other root-level slug is a plain
  // 404 at the routing layer (dynamicParams = false), so crawlers hitting
  // invented URLs no longer trigger Sanity lookups or ISR writes.
  try {
    const posts = await client.fetch<Array<{ slug: { current: string } | null }>>(
      `*[_type == "post"] {
        slug { current }
      }`
    );

    return posts
      .filter((item) => isValidSlug(item.slug?.current))
      .map((item) => ({
        slug: item.slug!.current,
      }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Skip if slug is a known static route (these should be handled by their own routes)
  // But this is a safety check - Next.js will prioritize static routes anyway
  const staticRoutes = ['about', 'privacy', 'terms', 'contact', 'studio', 'category', 'tag', 'posts', 'page', 'admin', 'api'];
  if (staticRoutes.includes(slug.toLowerCase())) {
    notFound(); // These routes should be handled elsewhere
  }

  // Handle pagination URLs (e.g., /page/2/)
  if (slug.toLowerCase() === 'page') {
    // Redirect to home page - pagination should be handled via query params or dedicated route
    redirect('/');
  }

  // Validate slug format
  if (!isValidSlug(slug)) {
    notFound(); // Invalid slug format
  }

  try {
    // Check if this slug exists as a post (including drafts for better matching)
    // First try exact match
    let post = await client.fetch<Post | null>(POST_BY_SLUG_QUERY, { slug }, fetchOptions.fetch);

    // If not found, try case-insensitive match or with different separators
    if (!post) {
      // Try to find posts with similar slugs (handles URL encoding issues)
      const allPosts = await client.fetch<Array<{ slug: { current: string } | null }>>(
        `*[_type == "post"] {
          slug { current }
        }`,
        {},
        fetchOptions.fetch
      );

      // Find post with matching slug (case-insensitive, handle URL encoding)
      const normalizedSlug = decodeURIComponent(slug).toLowerCase();
      const matchingPost = allPosts.find(p => {
        if (!p.slug?.current) return false;
        const postSlug = decodeURIComponent(p.slug.current).toLowerCase();
        return postSlug === normalizedSlug || postSlug.replace(/-/g, '_') === normalizedSlug.replace(/-/g, '_');
      });

      if (matchingPost?.slug?.current) {
        post = await client.fetch<Post | null>(POST_BY_SLUG_QUERY, { slug: matchingPost.slug.current }, fetchOptions.fetch);
      }
    }

    // If post exists, redirect to the correct URL with /posts/ prefix
    if (post && post.slug?.current && isValidSlug(post.slug.current)) {
      redirect(`/posts/${post.slug.current}`); // Redirect to correct URL
    }
  } catch (error) {
    // If there's an error, log it and return 404
    console.error('Error checking slug:', slug, error);
  }

  // If no post found, return 404
  notFound();
}

