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
import { executeResearch } from '@/lib/research/research-engine';

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
      systemPrompt,
      userPrompt,
      model,
      temperature,
      maxTokens,
      researchStrategy,
      researchDepth,
      researchArticles: providedResearchArticles,
      researchSummary: providedResearchSummary,
      researchAnalysis,
    } = body;

    // Log generation start
    logGenerationStart(topic);

    // Use provided research if available, otherwise fetch new research
    let researchResult;
    let researchArticles;

    if (providedResearchArticles && providedResearchSummary) {
      // Use provided research (e.g., from web search)
      researchArticles = providedResearchArticles;
      researchResult = {
        articles: providedResearchArticles,
        researchSummary: providedResearchSummary,
        discoveredTopics: undefined,
        primaryTopic: topic,
        metadata: {
          totalArticles: providedResearchArticles.length,
          sourcesUsed: [...new Set(providedResearchArticles.map((a: { source: string }) => a.source))],
          researchDepth: researchDepth || 'medium',
          strategy: researchStrategy || 'general',
          timestamp: new Date().toISOString(),
        },
      };
    } else {
      // Fetch research sources using new research engine
      researchResult = await executeResearch({
        strategy: researchStrategy || 'general',
        depth: researchDepth || 'medium',
        topic: topic || undefined,
        maxArticles: researchDepth === 'deep' ? 50 : 30,
      });
      researchArticles = researchResult.articles;
    }

    // Generate post content with custom prompts if provided
    const { markdown, title, excerpt, categoryIds, tagIds } = await generatePostContent(
      topic,
      systemPrompt,
      userPrompt,
      model,
      temperature,
      maxTokens,
      researchStrategy,
      researchDepth,
      providedResearchArticles,
      providedResearchSummary,
      researchAnalysis
    );

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

    // Group research articles by source
    const sources = researchArticles.reduce((acc, article) => {
      if (!acc[article.source]) {
        acc[article.source] = [];
      }
      acc[article.source].push(article);
      return acc;
    }, {} as Record<string, typeof researchArticles>);

    return NextResponse.json({
      success: true,
      data: {
        post: result.post,
        wordCount,
        published: false, // importPost creates drafts that need to be published manually
        researchSources: {
          articles: researchArticles,
          sources,
          totalCount: researchArticles.length,
          discoveredTopics: researchResult.discoveredTopics,
          primaryTopic: researchResult.primaryTopic,
          researchSummary: researchResult.researchSummary,
          metadata: researchResult.metadata,
        },
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

