/**
 * Admin endpoint for fetching research sources
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { fetchAllResearchSources } from '@/lib/research-sources';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    if (!(await isAdminAuthenticated(request))) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const topic = request.nextUrl.searchParams.get('topic') || undefined;

    // Fetch research sources
    const articles = await fetchAllResearchSources(topic);

    // Group by source
    const sources = articles.reduce((acc, article) => {
      if (!acc[article.source]) {
        acc[article.source] = [];
      }
      acc[article.source].push(article);
      return acc;
    }, {} as Record<string, typeof articles>);

    return NextResponse.json({
      success: true,
      data: {
        articles,
        sources,
        totalCount: articles.length,
      },
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

