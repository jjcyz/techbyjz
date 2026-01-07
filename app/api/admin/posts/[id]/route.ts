/**
 * Admin endpoint for fetching and updating individual posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { client } from '@/lib/sanity';
import { tiptapToPortableText } from '@/lib/tiptap-to-portable-text';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    if (!(await isAdminAuthenticated(request))) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Fetch post with full content
    const post = await client.fetch(`
      *[_type == "post" && _id == $id][0] {
        _id,
        title,
        excerpt,
        content,
        slug,
        publishedAt,
        categories[]->{_id, title, slug},
        tags[]->{_id, title, slug}
      }
    `, { id });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch post',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    if (!(await isAdminAuthenticated(request))) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { title, excerpt, content, categoryIds, tagIds } = body;

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      updateData.title = title;
    }

    if (excerpt !== undefined) {
      updateData.excerpt = excerpt;
    }

    if (content !== undefined) {
      // Content can be either PortableText blocks or Tiptap JSON
      let portableTextContent;

      if (Array.isArray(content)) {
        // Already PortableText format
        portableTextContent = content;
      } else if (content && typeof content === 'object' && 'type' in content) {
        // Tiptap JSON format - convert to PortableText
        portableTextContent = tiptapToPortableText(content);
      } else {
        throw new Error('Invalid content format');
      }

      updateData.content = portableTextContent;
    }

    if (categoryIds !== undefined) {
      updateData.categories = categoryIds.map((catId: string) => ({
        _type: 'reference',
        _ref: catId,
      }));
    }

    if (tagIds !== undefined) {
      updateData.tags = tagIds.map((tagId: string) => ({
        _type: 'reference',
        _ref: tagId,
      }));
    }

    // Update the post
    const updatedPost = await client
      .patch(id)
      .set(updateData)
      .commit();

    return NextResponse.json({
      success: true,
      data: updatedPost,
      message: 'Post updated successfully',
    });
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

