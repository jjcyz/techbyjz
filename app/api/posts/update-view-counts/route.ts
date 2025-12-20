import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';

/**
 * API endpoint to update all posts to have viewCount: 0
 * This is a one-time migration script
 * POST /api/posts/update-view-counts
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Add API key authentication
    const apiKey = request.headers.get('x-api-key');
    const expectedApiKey = process.env.API_KEY;

    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all posts (including those with null or missing viewCount)
    const posts = await client.fetch<Array<{ _id: string; viewCount?: number | null }>>(
      `*[_type == "post"] { _id, viewCount }`
    );

    console.log(`Found ${posts.length} posts to update`);

    // Update each post to set viewCount to 0 (handles null, undefined, or missing values)
    const updates = posts.map((post) =>
      client
        .patch(post._id)
        .set({ viewCount: 0 })
        .commit()
    );

    // Execute all updates in parallel
    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      message: `Updated ${posts.length} posts to have viewCount: 0`,
      count: posts.length,
    });
  } catch (error) {
    console.error('Error updating view counts:', error);
    return NextResponse.json(
      { error: 'Failed to update view counts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

