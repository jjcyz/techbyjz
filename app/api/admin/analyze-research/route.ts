/**
 * Research Analysis API Endpoint
 *
 * Analyzes research sources to identify gaps, unique perspectives, and angles
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { analyzeResearch } from '@/lib/research/analyze-research';

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
    const { articles, topic } = body;

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Articles array is required' },
        { status: 400 }
      );
    }

    const analysis = await analyzeResearch(articles, topic);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

