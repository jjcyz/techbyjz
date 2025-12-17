import type { Post, Category, PostWithCategoryDetails } from '@/types/post';

/**
 * Validates if a slug is valid and not a template string
 */
export function isValidSlug(slug: string | null | undefined): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  // Decode URL-encoded strings to check for template patterns
  let decodedSlug: string;
  try {
    decodedSlug = decodeURIComponent(slug);
  } catch {
    // If decoding fails, use original slug
    decodedSlug = slug;
  }

  // Filter out template strings (contains {{ or }})
  if (decodedSlug.includes('{{') || decodedSlug.includes('}}')) {
    return false;
  }

  // Filter out JavaScript code patterns (check both encoded and decoded)
  const patternsToCheck = [slug, decodedSlug];
  for (const slugToCheck of patternsToCheck) {
    if (
      slugToCheck.includes('$json') ||
      slugToCheck.includes('.toLowerCase') ||
      slugToCheck.includes('.replace') ||
      slugToCheck.includes('%7B%7B') || // URL-encoded {{
      slugToCheck.includes('%7D%7D')     // URL-encoded }}
    ) {
      return false;
    }
  }

  // Filter out URLs that start with = (encoded template strings)
  if (slug.startsWith('=')) {
    return false;
  }

  // Basic validation: slug should be URL-safe
  // Allow alphanumeric, hyphens, underscores, and forward slashes
  const validSlugPattern = /^[a-z0-9\-_\/]+$/i;
  if (!validSlugPattern.test(slug)) {
    return false;
  }

  return true;
}

/**
 * Groups posts by category ID
 */
export function groupPostsByCategory<T extends { categories?: string[] }>(
  posts: T[]
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};

  posts.forEach((post) => {
    if (post.categories && post.categories.length > 0) {
      post.categories.forEach((categoryId) => {
        if (!grouped[categoryId]) {
          grouped[categoryId] = [];
        }
        grouped[categoryId].push(post);
      });
    }
  });

  return grouped;
}

/**
 * Enriches a post with full category details from category objects
 */
export function enrichPostWithCategories(
  post: Post,
  categories: Category[]
): PostWithCategoryDetails {
  const enrichedCategories = post.categories
    ?.map((categoryId) => categories.find((cat) => cat._id === categoryId))
    .filter((cat): cat is Category => cat !== undefined) || [];

  return {
    ...post,
    categories: enrichedCategories,
  };
}

/**
 * Enriches multiple posts with category details
 */
export function enrichPostsWithCategories(
  posts: Post[],
  categories: Category[]
): PostWithCategoryDetails[] {
  return posts.map((post) => enrichPostWithCategories(post, categories));
}

/**
 * Gets a random post from an array
 */
export function getRandomPost<T>(posts: T[]): T | null {
  if (posts.length === 0) return null;
  return posts[Math.floor(Math.random() * posts.length)];
}

