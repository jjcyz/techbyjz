import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
import { POST_BY_SLUG_QUERY } from '@/lib/queries';
import type { Post } from '@/types/post';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
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
      console.error('Error patching post in Sanity:', patchError);
      return NextResponse.json(
        {
          error: 'Failed to update view count in Sanity',
          details: patchError instanceof Error ? patchError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return NextResponse.json(
      {
        error: 'Failed to increment view count',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

