/**
 * Web Research API Endpoint
 *
 * Allows on-demand web research on specific topics.
 * Useful for deep diving into topics found in RSS articles.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { searchWeb, deepDiveOnTopic, findAdditionalSources } from '@/lib/research/web-search';

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
    const { topic, query, context, excludeUrls, maxResults = 10, mode = 'search', provider } = body;

    if (!topic && !query) {
      return NextResponse.json(
        { success: false, error: 'Either "topic" or "query" is required' },
        { status: 400 }
      );
    }

    let results;

    switch (mode) {
      case 'deep-dive':
        // Deep dive with context
        results = await deepDiveOnTopic(topic || query, context, maxResults);
        break;

      case 'additional-sources':
        // Find additional sources excluding provided URLs
        results = await findAdditionalSources(topic || query, excludeUrls || [], maxResults);
        break;

      case 'search':
      default:
        // Standard web search
        results = await searchWeb({
          query: query || topic,
          maxResults,
          includeContent: true,
          provider,
        });
        break;
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
        count: results.length,
        mode,
        query: query || topic,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Provide helpful error messages
    if (errorMessage.includes('API_KEY')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Web search API not configured',
          details: 'Please set one of: TAVILY_API_KEY, SERPER_API_KEY, or GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_ENGINE_ID',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    if (!(await isAdminAuthenticated(request))) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const topic = request.nextUrl.searchParams.get('topic');
    const query = request.nextUrl.searchParams.get('query');
    const maxResults = parseInt(request.nextUrl.searchParams.get('maxResults') || '10');
    const provider = request.nextUrl.searchParams.get('provider') as 'tavily' | 'serper' | 'google' | null;

    if (!topic && !query) {
      return NextResponse.json(
        { success: false, error: 'Either "topic" or "query" query parameter is required' },
        { status: 400 }
      );
    }

    const results = await searchWeb({
      query: query || topic || '',
      maxResults,
      includeContent: true,
      provider: provider || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        results,
        count: results.length,
        query: query || topic,
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

