/**
 * Centralized revalidation configuration
 * 
 * This file manages all ISR (Incremental Static Regeneration) revalidation times
 * for fetch calls in the application. Update values here to change cache durations site-wide.
 * 
 * NOTE: For `export const revalidate` in page files, you must use literal numbers
 * (e.g., `export const revalidate = 3600`) as Next.js requires compile-time constants.
 * Update those values manually in each page file if needed.
 * 
 * Revalidation times are in seconds:
 * - 60 = 1 minute
 * - 300 = 5 minutes
 * - 3600 = 1 hour
 * - 86400 = 24 hours
 */

// API route revalidation (for fetch calls in API routes)
export const API_REVALIDATE = 3600; // 1 hour - matches page revalidation

// Fetch call revalidation (for client.fetch calls in server components)
export const FETCH_REVALIDATE = 3600; // 1 hour - matches page revalidation

// Research sources revalidation (for external API calls)
export const RESEARCH_REVALIDATE = 300; // 5 minutes - external data changes more frequently

// Sitemap revalidation (for sitemap generation)
export const SITEMAP_REVALIDATE = 86400; // 24 hours - sitemaps don't need frequent updates

// Static page revalidation (about, privacy, terms, contact)
export const STATIC_PAGE_REVALIDATE = 3600; // 1 hour - these rarely change

/**
 * Helper function to get revalidate config for Next.js fetch options
 */
export function getRevalidateConfig(revalidate: number = FETCH_REVALIDATE) {
  return { next: { revalidate } };
}

/**
 * Pre-configured fetch options for common use cases
 */
export const fetchOptions = {
  api: getRevalidateConfig(API_REVALIDATE),
  fetch: getRevalidateConfig(FETCH_REVALIDATE),
  research: getRevalidateConfig(RESEARCH_REVALIDATE),
  sitemap: getRevalidateConfig(SITEMAP_REVALIDATE),
  static: getRevalidateConfig(STATIC_PAGE_REVALIDATE),
};
