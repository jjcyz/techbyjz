/**
 * Admin endpoint for managing published posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { client } from '@/lib/sanity';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    if (!(await isAdminAuthenticated(request))) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all published posts (posts with publishedAt)
    const publishedPosts = await client.fetch(`
      *[_type == "post" && defined(publishedAt)] | order(publishedAt desc) {
        _id,
        title,
        excerpt,
        _createdAt,
        publishedAt,
        viewCount,
        slug,
        categories[]->{_id, title, slug},
        tags[]->{_id, title, slug}
      }
    `);

    return NextResponse.json({
      success: true,
      data: publishedPosts,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch published posts',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    if (!(await isAdminAuthenticated(request))) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { postId, action } = await request.json();

    if (!postId || !action) {
      return NextResponse.json(
        { success: false, error: 'postId and action are required' },
        { status: 400 }
      );
    }

    if (action === 'unpublish') {
      // Unpublish the post (remove publishedAt)
      const result = await client
        .patch(postId)
        .unset(['publishedAt'])
        .commit();

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Post unpublished successfully',
      });
    } else if (action === 'delete') {
      // Delete the published post
      await client.delete(postId);

      return NextResponse.json({
        success: true,
        message: 'Post deleted successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "unpublish" or "delete"' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update post',
      },
      { status: 500 }
    );
  }
}
