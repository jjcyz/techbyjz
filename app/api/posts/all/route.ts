import { NextRequest } from 'next/server';
import { client } from '@/lib/sanity';
import { checkRateLimit, RATE_LIMITS, isBot } from '@/lib/rate-limit';
import { ApiErrors, successResponse } from '@/lib/api-response';
import type { Post } from '@/types/post';

const POSTS_PER_PAGE = 12;
const MAX_PAGE = 100; // Maximum page number
const MAX_LIMIT = 50; // Maximum posts per page

export async function GET(request: NextRequest) {
  try {
    // Block bots (except search engines and AI search bots)
    const userAgent = request.headers.get('user-agent');
    const isSearchEngine = /googlebot|bingbot|slurp|duckduckbot|chatgpt-user|anthropic-ai|claude-web|perplexitybot|perplexity-ai/i.test(userAgent || '');
    if (isBot(userAgent) && !isSearchEngine) {
      return ApiErrors.forbidden();
    }

    // Rate limiting
    const rateLimit = checkRateLimit(request, RATE_LIMITS.API);
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      const response = ApiErrors.tooManyRequests(retryAfter);
      // Add rate limit headers
      response.headers.set('Retry-After', String(retryAfter));
      response.headers.set('X-RateLimit-Limit', String(RATE_LIMITS.API.maxRequests));
      response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
      response.headers.set('X-RateLimit-Reset', String(rateLimit.resetTime));
      return response;
    }

    const searchParams = request.nextUrl.searchParams;
    let page = parseInt(searchParams.get('page') || '1', 10);
    let limit = parseInt(searchParams.get('limit') || String(POSTS_PER_PAGE), 10);

    // Validate and limit pagination parameters
    if (isNaN(page) || page < 1) page = 1;
    if (page > MAX_PAGE) page = MAX_PAGE;
    if (isNaN(limit) || limit < 1) limit = POSTS_PER_PAGE;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    // Fetch posts with pagination
    const start = (page - 1) * limit;
    const end = start + limit;

    const posts = await client.fetch<Post[]>(
      `*[_type == "post"] | order(publishedAt desc) [${start}...${end}] {
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
      {},
      { next: { revalidate: 60 } }
    );

    // Get total count for pagination
    const totalCount = await client.fetch<number>(
      `count(*[_type == "post"])`,
      {},
      { next: { revalidate: 60 } }
    );

    const hasMore = end < totalCount;

    return successResponse({
      posts,
      pagination: {
        page,
        limit,
        total: totalCount,
        hasMore,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching all posts:', error);
    }
    return ApiErrors.internalError('Failed to fetch posts',
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
}

