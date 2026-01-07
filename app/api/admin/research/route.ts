/**
 * Enhanced Research API Endpoint
 * Supports multiple research strategies and configurations
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { executeResearch } from '@/lib/research/research-engine';
import type { ResearchConfig } from '@/lib/research/types';

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
    const config: ResearchConfig = {
      strategy: body.strategy || 'general',
      depth: body.depth || 'medium',
      topic: body.topic,
      maxArticles: body.maxArticles,
      minRelevanceScore: body.minRelevanceScore,
      sources: body.sources,
      focusAreas: body.focusAreas,
      enableTopicDiscovery: body.enableTopicDiscovery,
      maxTopicsToDiscover: body.maxTopicsToDiscover || 5,
    };

    // Execute research
    const result = await executeResearch(config);

    return NextResponse.json({
      success: true,
      data: result,
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
    const strategy = (request.nextUrl.searchParams.get('strategy') || 'general') as ResearchConfig['strategy'];
    const depth = (request.nextUrl.searchParams.get('depth') || 'medium') as ResearchConfig['depth'];

    const config: ResearchConfig = {
      strategy,
      depth,
      topic,
    };

    const result = await executeResearch(config);

    return NextResponse.json({
      success: true,
      data: result,
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

