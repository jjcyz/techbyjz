/**
 * Admin endpoint for triggering content generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { generatePostContent } from '@/app/api/cron/create-post/route';
import { importPost } from '@/lib/import-post';
import {
  logGenerationStart,
  logGenerationComplete,
  logError,
} from '@/lib/content-logging';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    if (!(await isAdminAuthenticated(request))) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      topic,
      draft = true,
      validate = true,
      checkDuplicates = true,
      minQualityScore = 50,
      allowWarnings = false,
    } = body;

    // Log generation start
    logGenerationStart(topic);

    // Generate post content
    const { markdown, title, excerpt, categoryIds, tagIds } = await generatePostContent(topic);

    // Calculate word count
    const wordCount = markdown
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]+`/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[#*_`>\[\]()]/g, '')
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 0).length;

    // Import post - note: importPost doesn't support qualityControl anymore
    // So we'll just import directly
    const result = await importPost({
      markdown,
      title,
      excerpt,
      categoryIds,
      tagIds,
    });

    // Log generation completion
    logGenerationComplete(wordCount, title);

    return NextResponse.json({
      success: true,
      data: {
        post: result.post,
        wordCount,
        published: true, // importPost always publishes now
      },
      message: 'Post created successfully',
    });
  } catch (error) {
    // Log detailed error information
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error('Admin generate error:', {
      message: errorMessage,
      stack: errorStack,
      error: error,
    });

    logError('generation', 'admin_generate', error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        ...(process.env.NODE_ENV === 'development' && {
          details: errorStack,
        }),
      },
      { status: 500 }
    );
  }
}

