import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
import { POST_BY_SLUG_QUERY } from '@/lib/queries';
import { checkRateLimit, RATE_LIMITS, isBot } from '@/lib/rate-limit';
import { ApiErrors, successResponse } from '@/lib/api-response';
import type { Post } from '@/types/post';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Block bots
    const userAgent = request.headers.get('user-agent');
    if (isBot(userAgent)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Rate limiting
    const rateLimit = checkRateLimit(request, RATE_LIMITS.VIEW_COUNT);
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
            'X-RateLimit-Limit': String(RATE_LIMITS.VIEW_COUNT.maxRequests),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetTime),
          }
        }
      );
    }

    const { slug } = await params;

    // Input validation
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Validate slug length to prevent abuse
    if (slug.length > 200) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Check if Sanity token is configured
    if (!process.env.SANITY_API_TOKEN) {
      console.error('SANITY_API_TOKEN is not set. View count updates will fail.');
      return NextResponse.json(
        { error: 'Server configuration error: SANITY_API_TOKEN not set' },
        { status: 500 }
      );
    }

    // Fetch the post to get its ID
    const post = await client.fetch<Post | null>(POST_BY_SLUG_QUERY, { slug });

    if (!post || !post._id) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Increment view count atomically using Sanity's inc() method
    // This prevents race conditions by using atomic increment
    try {
      // Use inc() for atomic increment instead of read-then-write
      const updatedPost = await client
        .patch(post._id)
        .inc({ viewCount: 1 })
        .commit<Post>();

      const newViewCount = updatedPost.viewCount || 0;

      return successResponse({
        viewCount: newViewCount,
        postId: post._id,
      });
    } catch (patchError) {
      // Don't expose internal error details in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Error patching post in Sanity:', patchError);
      }
      return ApiErrors.internalError('Failed to update view count',
        process.env.NODE_ENV === 'development' ? patchError : undefined
      );
    }
  } catch (error) {
    // Don't expose internal error details in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Error incrementing view count:', error);
    }
    return ApiErrors.internalError('Failed to process request',
      process.env.NODE_ENV === 'development' ? error : undefined
    );
  }
}

