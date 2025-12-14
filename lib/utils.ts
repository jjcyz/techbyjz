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
 * Groups posts by category
 */
export function groupPostsByCategory<T extends { categories?: Array<{ _id: string }> }>(
  posts: T[]
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};

  posts.forEach((post) => {
    if (post.categories && post.categories.length > 0) {
      post.categories.forEach((category) => {
        if (!grouped[category._id]) {
          grouped[category._id] = [];
        }
        grouped[category._id].push(post);
      });
    }
  });

  return grouped;
}

/**
 * Gets a random post from an array
 */
export function getRandomPost<T>(posts: T[]): T | null {
  if (posts.length === 0) return null;
  return posts[Math.floor(Math.random() * posts.length)];
}

