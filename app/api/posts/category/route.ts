import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
import { CATEGORY_BY_SLUG_QUERY } from '@/lib/queries';
import { isValidSlug } from '@/lib/utils';
import { checkRateLimit, RATE_LIMITS, isBot } from '@/lib/rate-limit';
import type { Post, Category } from '@/types/post';

const POSTS_PER_PAGE = 12;
const MAX_PAGE = 100; // Maximum page number
const MAX_LIMIT = 50; // Maximum posts per page

export async function GET(request: NextRequest) {
  try {
    // Block bots (except search engines and AI search bots)
    const userAgent = request.headers.get('user-agent');
    const isSearchEngine = /googlebot|bingbot|slurp|duckduckbot|chatgpt-user|anthropic-ai|claude-web|perplexitybot|perplexity-ai/i.test(userAgent || '');
    if (isBot(userAgent) && !isSearchEngine) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Rate limiting
    const rateLimit = checkRateLimit(request, RATE_LIMITS.API);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(RATE_LIMITS.API.maxRequests),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetTime),
          }
        }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');
    let page = parseInt(searchParams.get('page') || '1', 10);
    let limit = parseInt(searchParams.get('limit') || String(POSTS_PER_PAGE), 10);

    // Validate and limit pagination parameters
    if (isNaN(page) || page < 1) page = 1;
    if (page > MAX_PAGE) page = MAX_PAGE;
    if (isNaN(limit) || limit < 1) limit = POSTS_PER_PAGE;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    if (!slug || !isValidSlug(slug)) {
      return NextResponse.json(
        { error: 'Invalid category slug' },
        { status: 400 }
      );
    }

    // Fetch category to get its ID
    const category = await client.fetch<Category | null>(
      CATEGORY_BY_SLUG_QUERY,
      { slug },
      { next: { revalidate: 60 } }
    );

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Fetch posts with pagination
    const start = (page - 1) * limit;
    const end = start + limit;

    const posts = await client.fetch<Post[]>(
      `*[_type == "post" && $categoryId in categories] | order(publishedAt desc) [${start}...${end}] {
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
    );

    // Get total count for pagination
    const totalCount = await client.fetch<number>(
      `count(*[_type == "post" && $categoryId in categories])`,
      { categoryId: category._id },
      { next: { revalidate: 60 } }
    );

    const hasMore = end < totalCount;

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore,
      },
    });
  } catch (error) {
    console.error('Error fetching category posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

