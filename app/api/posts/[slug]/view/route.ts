import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
import { POST_BY_SLUG_QUERY } from '@/lib/queries';
import { checkRateLimit, RATE_LIMITS, isBot } from '@/lib/rate-limit';
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

    // Increment view count atomically
    // Safely get current view count, defaulting to 0 if null/undefined/invalid
    let currentViewCount = 0;
    if (typeof post.viewCount === 'number' && !isNaN(post.viewCount)) {
      currentViewCount = post.viewCount;
    }

    const newViewCount = currentViewCount + 1;

    try {
      await client
        .patch(post._id)
        .set({ viewCount: newViewCount })
        .commit();

      if (process.env.NODE_ENV === 'development') {
        console.log(`Updated view count for post ${post._id} (${slug}): ${currentViewCount} -> ${newViewCount}`);
      }

      return NextResponse.json({
        success: true,
        viewCount: newViewCount,
        postId: post._id,
      });
    } catch (patchError) {
      // Don't expose internal error details in production
      if (process.env.NODE_ENV === 'development') {
        console.error('Error patching post in Sanity:', patchError);
      }
      return NextResponse.json(
        {
          error: 'Failed to update view count'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // Don't expose internal error details in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Error incrementing view count:', error);
    }
    return NextResponse.json(
      {
        error: 'Failed to process request'
      },
      { status: 500 }
    );
  }
}

