/**
 * Admin endpoint for content generation statistics
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

    // Fetch statistics
    const [totalPosts, publishedPosts, draftPosts, totalCategories, totalTags, recentPosts] = await Promise.all([
      // Total posts
      client.fetch(`count(*[_type == "post"])`),
      // Published posts
      client.fetch(`count(*[_type == "post" && defined(publishedAt)])`),
      // Draft posts
      client.fetch(`count(*[_type == "post" && !defined(publishedAt)])`),
      // Total categories
      client.fetch(`count(*[_type == "category"])`),
      // Total tags
      client.fetch(`count(*[_type == "tag"])`),
      // Recent posts (last 7 days)
      client.fetch(`
        *[_type == "post" && _createdAt >= $date] | order(_createdAt desc) {
          _id,
          title,
          _createdAt,
          publishedAt,
          "isDraft": !defined(publishedAt)
        }
      `, {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalPosts,
        publishedPosts,
        draftPosts,
        totalCategories,
        totalTags,
        recentPosts,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch statistics',
      },
      { status: 500 }
    );
  }
}

