/**
 * API endpoint for importing markdown content from AI models
 * POST /api/import-markdown
 * Body: { markdown: string, postId?: string, title?: string, excerpt?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
import { markdownToPortableText } from '@/lib/markdown-to-portable-text';

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

    const body = await request.json();
    const { markdown, postId, title, excerpt, categoryIds, tagIds } = body;

    if (!markdown || typeof markdown !== 'string') {
      return NextResponse.json(
        { error: 'Markdown content is required' },
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
    console.error('Error importing markdown:', error);
    return NextResponse.json(
      { error: 'Failed to import markdown', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

