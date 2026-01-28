import { MetadataRoute } from 'next'
import { client } from '@/lib/sanity'
import { POSTS_SITEMAP_QUERY, CATEGORIES_QUERY, TAGS_QUERY } from '@/lib/queries'
import { fetchOptions } from '@/lib/revalidation-config'
import type { Category, Tag } from '@/types/post'

// Lightweight interface for sitemap posts (only what we need)
interface SitemapPost {
  slug: {
    current: string
  } | null
  publishedAt?: string
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://techbyjz.blog'

  // Static pages (defined outside try block so it's available in catch)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  try {
    // Fetch all posts, categories, and tags in parallel
    // Using lightweight query for posts to improve performance
    const [posts, categories, tags] = await Promise.all([
      client.fetch<SitemapPost[]>(POSTS_SITEMAP_QUERY, {}, fetchOptions.sitemap),
      client.fetch<Category[]>(CATEGORIES_QUERY, {}, fetchOptions.sitemap),
      client.fetch<Tag[]>(TAGS_QUERY, {}, fetchOptions.sitemap)
    ])

    // Dynamic post pages
    // IMPORTANT: Always use /posts/ prefix to ensure correct URL structure
    const postPages: MetadataRoute.Sitemap = (posts || [])
      .filter((post) => post.slug?.current) // Only include posts with valid slugs
      .map((post) => {
        const slug = post.slug!.current;
        // Ensure URL always has /posts/ prefix - never generate root-level URLs
        const postUrl = `${siteUrl}/posts/${slug}`;
        return {
          url: postUrl,
          lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.9,
        };
      })

    // Dynamic category pages
    const categoryPages: MetadataRoute.Sitemap = (categories || [])
      .filter((category) => category.slug?.current) // Only include categories with valid slugs
      .map((category) => ({
        url: `${siteUrl}/category/${category.slug!.current}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))

    // Dynamic tag pages
    const tagPages: MetadataRoute.Sitemap = (tags || [])
      .filter((tag) => tag.slug?.current) // Only include tags with valid slugs
      .map((tag) => ({
        url: `${siteUrl}/tag/${tag.slug!.current}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))

    // Combine all pages
    return [...staticPages, ...postPages, ...categoryPages, ...tagPages]
  } catch (error) {
    // If there's an error fetching data, return at least the static pages
    // This prevents the sitemap from completely failing
    console.error('Error generating sitemap:', error)
    return staticPages
  }
}

