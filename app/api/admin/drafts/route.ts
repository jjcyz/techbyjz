/**
 * Admin endpoint for managing drafts
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { client } from '@/lib/sanity';
import { getSanityStudioUrl } from '@/lib/sanity-studio-url';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    if (!(await isAdminAuthenticated(request))) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all draft posts (posts without publishedAt)
    const drafts = await client.fetch(`
      *[_type == "post" && !defined(publishedAt)] | order(_createdAt desc) {
        _id,
        title,
        excerpt,
        _createdAt,
        slug,
        categories[]->{title, slug},
        tags[]->{title, slug}
      }
    `);

    return NextResponse.json({
      success: true,
      data: drafts,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch drafts',
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

    if (action === 'publish') {
      // Publish the draft
      const result = await client
        .patch(postId)
        .set({
          publishedAt: new Date().toISOString(),
        })
        .commit();

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Post published successfully',
      });
    } else if (action === 'delete') {
      // Delete the draft
      await client.delete(postId);

      return NextResponse.json({
        success: true,
        message: 'Draft deleted successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "publish" or "delete"' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update draft',
      },
      { status: 500 }
    );
  }
}

