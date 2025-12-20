/**
 * API endpoint for importing markdown content from AI models
 * POST /api/import-markdown
 * Body: { markdown: string, postId?: string, title?: string, excerpt?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
import { markdownToPortableText } from '@/lib/markdown-to-portable-text';
import { checkRateLimit, RATE_LIMITS, isBot } from '@/lib/rate-limit';

// Maximum request body size (10MB)
const MAX_BODY_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
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
    const rateLimit = checkRateLimit(request, RATE_LIMITS.IMPORT);
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
            'X-RateLimit-Limit': String(RATE_LIMITS.IMPORT.maxRequests),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetTime),
          }
        }
      );
    }

    // Require API key authentication for this sensitive endpoint
    const apiKey = request.headers.get('x-api-key');
    const expectedApiKey = process.env.API_KEY;

    if (!expectedApiKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check content length
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      );
    }

    const body = await request.json();
    const { markdown, postId, title, excerpt, categoryIds, tagIds } = body;

    // Input validation with size limits
    if (!markdown || typeof markdown !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Validate markdown size (max 5MB)
    if (markdown.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Content too large' },
        { status: 400 }
      );
    }

    // Validate title length
    if (title && (typeof title !== 'string' || title.length > 200)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Validate excerpt length
    if (excerpt && (typeof excerpt !== 'string' || excerpt.length > 500)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Validate postId format if provided
    if (postId && (typeof postId !== 'string' || postId.length > 100)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Convert markdown to Portable Text
    const portableTextContent = markdownToPortableText(markdown);

    // If postId is provided, update existing post
    if (postId) {
      const updatedPost = await client
        .patch(postId)
        .set({
          content: portableTextContent,
          ...(title && { title }),
          ...(excerpt && { excerpt }),
        })
        .commit();

      return NextResponse.json({
        success: true,
        post: updatedPost,
        message: 'Post updated successfully',
      });
    }

    // Otherwise, create a new draft post
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required for new posts' },
        { status: 400 }
      );
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newPost = await client.create({
      _type: 'post',
      title,
      excerpt: excerpt || '',
      content: portableTextContent,
      publishedAt: new Date().toISOString(),
      viewCount: 0,
      slug: {
        _type: 'slug',
        current: slug,
      },
      ...(categoryIds && categoryIds.length > 0 && {
        categories: categoryIds.map((id: string) => ({
          _type: 'reference',
          _ref: id,
        })),
      }),
      ...(tagIds && tagIds.length > 0 && {
        tags: tagIds.map((id: string) => ({
          _type: 'reference',
          _ref: id,
        })),
      }),
    });

    return NextResponse.json({
      success: true,
      post: newPost,
      message: 'Post created successfully',
    });
  } catch (error) {
    // Don't expose internal error details in production
    if (process.env.NODE_ENV === 'development') {
      console.error('Error importing markdown:', error);
    }
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

