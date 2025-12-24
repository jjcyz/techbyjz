/**
 * Structured Data (JSON-LD) utilities for SEO
 * These functions generate schema.org structured data for better search engine understanding
 * All data uses existing Sanity queries - no additional API calls needed
 */

import type { Post, Category } from '@/types/post';
import { getImageUrl } from './image';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://techbyjz.blog';
const SITE_NAME = 'TechByJZ';

/**
 * Get the base Organization schema
 * Used across all pages for brand recognition
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    description: 'A futuristic tech blog featuring cutting-edge tech insights on technology, AI, automation, and cybersecurity.',
    sameAs: [
      // Add your social media profiles here when available
      // 'https://twitter.com/techbyjz',
      // 'https://linkedin.com/company/techbyjz',
    ],
  };
}

/**
 * Get WebSite schema with search action
 * Helps Google understand your site structure
 */
export function getWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'A futuristic tech blog featuring cutting-edge tech insights on technology, AI, automation, and cybersecurity.',
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Get Blog schema for the homepage
 */
export function getBlogSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'A futuristic tech blog featuring cutting-edge tech insights on technology, AI, automation, and cybersecurity.',
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

/**
 * Get Article/BlogPosting schema for individual posts
 */
export function getArticleSchema(post: Post, categories: Category[] = []) {
  const postUrl = `${SITE_URL}/posts/${post.slug?.current}`;
  const imageUrl = post.mainImage ? getImageUrl(post.mainImage, 1200, 600) : undefined;

  // Get valid category names
  const validCategories = categories
    .filter(cat => post.categories?.includes(cat._id))
    .map(cat => cat.title);

  // Get tag names
  const tagNames = (post.tags || [])
    .map(tag => typeof tag === 'string' ? tag : tag.title)
    .filter(Boolean);

  // Build the schema object, ensuring required fields are present
  const schema: {
    '@context': string;
    '@type': string;
    headline: string;
    description?: string;
    image?: string | string[];
    datePublished: string;
    dateModified?: string;
    author?: {
      '@type': string;
      name: string;
    };
    publisher: {
      '@type': string;
      name: string;
      logo: {
        '@type': string;
        url: string;
      };
    };
    mainEntityOfPage: {
      '@type': string;
      '@id': string;
    };
    articleSection?: string | string[];
    keywords?: string | string[];
  } = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || `Read ${post.title} on ${SITE_NAME}`,
    datePublished: post.publishedAt,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/favicon.ico`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
  };

  // Add author only if available
  if (post.authorName) {
    schema.author = {
      '@type': 'Person',
      name: post.authorName,
    };
  }

  // Add image if available - must be absolute URL
  if (imageUrl) {
    // Ensure imageUrl is absolute
    const absoluteImageUrl = imageUrl.startsWith('http') ? imageUrl : `${SITE_URL}${imageUrl}`;
    schema.image = absoluteImageUrl;
  }

  // Add categories as articleSection
  if (validCategories.length > 0) {
    schema.articleSection = validCategories.length === 1 ? validCategories[0] : validCategories;
  }

  // Add tags as keywords
  if (tagNames.length > 0) {
    schema.keywords = tagNames.length === 1 ? tagNames[0] : tagNames;
  }

  // Remove undefined author to avoid JSON issues
  if (!schema.author) {
    delete schema.author;
  }

  return schema;
}

/**
 * Get BreadcrumbList schema for navigation
 */
export function getBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  if (items.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Get CollectionPage schema for category/tag pages
 */
export function getCollectionPageSchema(
  name: string,
  description: string,
  itemCount: number,
  url: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description: `${description} - ${itemCount} ${itemCount === 1 ? 'post' : 'posts'}`,
    url,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

/**
 * Clean object by removing undefined values
 * JSON.stringify omits undefined, but we want to ensure clean JSON-LD
 */
function cleanObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    return obj.map(cleanObject).filter(item => item !== null && item !== undefined);
  }

  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const cleanedValue = cleanObject(value);
      if (cleanedValue !== null && cleanedValue !== undefined) {
        cleaned[key] = cleanedValue;
      }
    }
    return cleaned;
  }

  return obj;
}

/**
 * Render structured data as a script tag
 * Use this in your page components to inject JSON-LD
 * In Next.js App Router, this can be placed in the body (Google reads JSON-LD from anywhere)
 */
export function StructuredData({ data }: { data: object | object[] | null }) {
  if (!data) return null;

  const jsonLd = Array.isArray(data) ? data : [data];

  return (
    <>
      {jsonLd.map((item, index) => {
        // Clean the object to remove undefined values
        const cleanedItem = cleanObject(item);

        // Skip if item is null or empty after cleaning
        if (!cleanedItem || (typeof cleanedItem === 'object' && Object.keys(cleanedItem).length === 0)) {
          return null;
        }

        return (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanedItem, null, 0) }}
          />
        );
      })}
    </>
  );
}
