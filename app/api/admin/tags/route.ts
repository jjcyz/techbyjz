/**
 * Admin endpoint for fetching and creating tags
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { client } from '@/lib/sanity';
import { TAGS_QUERY } from '@/lib/queries';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    if (!(await isAdminAuthenticated(request))) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tags = await client.fetch(TAGS_QUERY);

    return NextResponse.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch tags',
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

    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // Check if tag already exists
    const existing = await client.fetch(
      `*[_type == "tag" && title == $title][0]`,
      { title }
    );

    if (existing) {
      return NextResponse.json({
        success: true,
        data: existing,
        message: 'Tag already exists',
      });
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Create new tag
    const newTag = await client.create({
      _type: 'tag',
      title,
      slug: {
        _type: 'slug',
        current: slug,
      },
    });

    return NextResponse.json({
      success: true,
      data: newTag,
      message: 'Tag created successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create tag',
      },
      { status: 500 }
    );
  }
}

