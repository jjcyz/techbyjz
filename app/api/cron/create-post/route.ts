/*
 * Cron job endpoint for scheduled post creation
 */

import { NextRequest } from 'next/server';
import { fetchAllResearchSources, formatResearchForPrompt } from '@/lib/research-sources';
import {
  fetchCategories,
  fetchTags,
  suggestCategoriesAndTags,
  type Category,
  type Tag,
} from '@/lib/categories-tags';
import { importPost } from '@/lib/import-post';
import { ApiErrors, successResponse } from '@/lib/api-response';

/**
 * Generates blog post content using AI with research and synthesis
 * Replicates n8n workflow: research → synthesize → create unique insights
 */
export async function generatePostContent(
  topic?: string,
  customSystemPrompt?: string,
  customUserPrompt?: string,
  model?: string,
  temperature?: number,
  maxTokens?: number,
  researchStrategy?: string,
  researchDepth?: string,
  providedResearchArticles?: Array<{ title: string; url: string; content: string; source: string; publishedAt?: string; score?: number; relevance?: number }>,
  providedResearchSummary?: string,
  researchAnalysis?: { gaps: string[]; uniquePerspectives: string[]; unexploredConnections: string[]; contrarianViewpoints: string[]; originalAngles: string[]; synthesisStrategy: string; keyInsights: string[] }
): Promise<{
  markdown: string;
  title: string;
  excerpt: string;
  categoryIds?: string[];
  tagIds?: string[];
}> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('No OpenAI API key found. Set OPENAI_API_KEY');
  }

  // Step 1: Use provided research if available, otherwise fetch new research
  let researchArticles;
  let researchSummary: string;

  if (providedResearchArticles && providedResearchSummary) {
    // Use provided research (e.g., from web search)
    researchArticles = providedResearchArticles;
    researchSummary = providedResearchSummary;
  } else if (researchStrategy && researchDepth) {
    // Use new research engine if strategy/depth provided
    const { executeResearch } = await import('@/lib/research/research-engine');
    const researchResult = await executeResearch({
      strategy: researchStrategy as 'general' | 'topic-specific' | 'discovery' | 'deep-dive',
      depth: researchDepth as 'shallow' | 'medium' | 'deep',
      topic: topic || undefined,
      maxArticles: researchDepth === 'deep' ? 50 : 30,
    });
    researchArticles = researchResult.articles;
    researchSummary = researchResult.researchSummary;
  } else {
    // Legacy: use old research system
    researchArticles = await fetchAllResearchSources(topic);
    researchSummary = formatResearchForPrompt(researchArticles);
  }

  // Step 1.5: Fetch existing categories and tags for AI suggestions (cached)
  const [existingCategories, existingTags] = await Promise.all([
    fetchCategories(),
    fetchTags(),
  ]);

  // Enhanced system prompt for research-based content (use custom if provided)
  const defaultSystemPrompt = `You are an expert tech blogger who writes insightful, well-researched articles that people actually want to read. You:
1. Synthesize information from multiple credible sources
2. Make connections between seemingly unrelated points
3. Create unique perspectives and insights
4. Write in an engaging, conversational, and thought-provoking style
5. Structure content with clear headings, lists, and examples

Your articles are known for:
- Deep analysis and synthesis
- Unique insights that readers won't find elsewhere
- Connecting dots across different domains
- Actionable takeaways
- **Human, readable writing** - conversational tone, natural flow, personality
- Writing that feels authentic and genuine, not robotic or AI-generated`;

  const systemPrompt = customSystemPrompt || defaultSystemPrompt;

  // Import analysis formatter if we have analysis
  let analysisSection = '';
  if (researchAnalysis) {
    const { formatAnalysisForSynthesis } = await import('@/lib/research/analyze-research');
    analysisSection = formatAnalysisForSynthesis(researchAnalysis, topic);
  }

  // Research and synthesis prompt - enhanced with analysis if available
  const researchPrompt = topic
    ? `Research the topic: "${topic}".

${researchSummary}

${analysisSection ? `${analysisSection}\n\n` : ''}${analysisSection ? 'Based on the analysis above, create content that:' : 'Based on the real-time research above, extract:'}
${analysisSection ? '' : '1. 5-7 key points from these sources\n2. 3-5 interesting connections or patterns\n3. 2-3 unique insights or perspectives that most people miss\n4. Counter-intuitive findings or contrarian viewpoints\n\nThen synthesize this research into a comprehensive blog post.'}
${analysisSection ? `1. Fills the identified gaps
2. Explores the unique perspectives and original angles
3. Makes the unexplored connections
4. Presents contrarian viewpoints thoughtfully
5. Creates truly original content that hasn't been written before

**CRITICAL**: This must be content that catches attention and offers something NEW. Don't just summarize what's already been written - create something unique based on the gaps and angles identified above.` : ''}`
    : `Research current tech trends and news.

${researchSummary}

${analysisSection ? `${analysisSection}\n\n` : ''}${analysisSection ? 'Based on the analysis above, create content that:' : 'Based on the real-time research above, extract:'}
${analysisSection ? '' : '1. 5-7 key points from these sources\n2. 3-5 interesting connections or patterns\n3. 2-3 unique insights or perspectives that most people miss\n4. Counter-intuitive findings or contrarian viewpoints\n\nThen synthesize this research into a comprehensive blog post.'}
${analysisSection ? `1. Fills the identified gaps
2. Explores the unique perspectives and original angles
3. Makes the unexplored connections
4. Presents contrarian viewpoints thoughtfully
5. Creates truly original content that hasn't been written before

**CRITICAL**: This must be content that catches attention and offers something NEW. Don't just summarize what's already been written - create something unique based on the gaps and angles identified above.` : ''}`;

  // Default user prompt (use custom if provided, replacing {researchSummary} placeholder)
  const defaultUserPrompt = `${researchPrompt}

Create a blog post that:
1. Synthesizes the research into a coherent narrative
2. Fills gaps and explores unique angles identified in the analysis
3. Highlights the most interesting connections (especially unexplored ones)
4. Develops unique insights further
5. Presents contrarian viewpoints thoughtfully
6. Tells a compelling story that catches attention
7. Offers something NEW that hasn't been written before

**CRITICAL: Write like a human, not a robot.**
- Use conversational language and natural flow - write as if you're explaining to a friend
- Vary sentence length and structure for rhythm and readability
- Use contractions when appropriate (it's, don't, we're, you're)
- Avoid overly formal or academic language - keep it accessible
- Make it feel authentic and genuine, like a real person wrote it

Format as Markdown (which will be converted to Portable Text for the editor). Use:
- A clear, engaging title as the first H1 heading (# Title)
- An excerpt/summary paragraph (2-3 sentences) after the title
- Well-structured sections with headings:
  - H1 (#) for main title
  - H2 (##) for major sections
  - H3 (###) for subsections
  - H4 (####) for sub-subsections if needed
- Bullet lists (- item) or numbered lists (1. item) where appropriate
- **Bold text** (double asterisks) for emphasis
- *Italic text* (single asterisk) for subtle emphasis
- Links using [text](url) format
- Inline code using backticks for code snippets
- Code blocks using triple backticks with language: three backticks, language name, code, three backticks
- Blockquotes using > for quotes or callouts

The content will be automatically converted from Markdown to Portable Text format. Make it insightful, unique, and valuable. Length should be substantial (1500-3000 words equivalent).`;

  // Replace {researchSummary} placeholder in custom prompt, or use default
  const userPrompt = customUserPrompt
    ? customUserPrompt.replace('{researchSummary}', researchPrompt)
    : defaultUserPrompt;

  // Option 1: Use OpenAI
  if (process.env.OPENAI_API_KEY) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens ?? 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const aiContent = data.choices[0].message.content;

    if (!aiContent) {
      throw new Error('AI did not return any content.');
    }

    // Extract title and excerpt, then remove them from the markdown content
    const titleMatch = aiContent.match(/^#\s+(.+?)$/m);
    const title = titleMatch ? titleMatch[1].trim() : (topic || 'AI Generated Post');

    // Extract excerpt (first paragraph after title, or first 2-3 sentences)
    let contentForBody = aiContent.replace(/^#\s+.+?\n\n?/m, ''); // Remove H1 title
    const excerptMatch = contentForBody.match(/^(.+?)(?:\n\n|$)/m);
    const excerpt = excerptMatch
      ? excerptMatch[1].trim().substring(0, 200) + (excerptMatch[1].length > 200 ? '...' : '')
      : 'A new post generated by AI.';

    // Remove the excerpt paragraph from the body content (it's stored separately)
    if (excerptMatch) {
      // Remove the first paragraph that was used as excerpt
      contentForBody = contentForBody.replace(/^.+?(?:\n\n|$)/m, '').trim();
    }

    // Step 3: Use AI to suggest categories and tags based on the generated content
    let categoryIds: string[] = [];
    let tagIds: string[] = [];

    if (existingCategories.length > 0 || existingTags.length > 0) {
      try {
        const result = await suggestCategoriesAndTags(
          title,
          excerpt,
          aiContent,
          existingCategories,
          existingTags
        );
        categoryIds = result.categoryIds;
        tagIds = result.tagIds;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error assigning categories/tags:', error);
        }
        // Continue without tags - post will still be created
      }
    }

    // Fallback: Ensure at least one category if none assigned
    if (categoryIds.length === 0 && existingCategories.length > 0) {
      // Assign first available category as fallback
      categoryIds = [existingCategories[0]._id];
    }

    return {
      markdown: contentForBody, // Use cleaned content without title and excerpt
      title,
      excerpt,
      categoryIds,
      tagIds,
    };
  }

  // Fallback: Return error if no AI service configured
  throw new Error('No AI service configured. Set OPENAI_API_KEY in environment variables.');
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (fail-closed: no secret = deny access)
    const secret = request.nextUrl.searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET;

    // Fail-safe: if CRON_SECRET not configured, deny all access
    if (!expectedSecret) {
      console.error('CRON_SECRET not configured - cron access denied');
      return ApiErrors.internalError('Cron endpoint not configured');
    }

    if (secret !== expectedSecret) {
      return ApiErrors.unauthorized();
    }

    // Get optional topic parameter
    const topic = request.nextUrl.searchParams.get('topic') || undefined;

    // Generate post content with research and synthesis
    const { markdown, title, excerpt, categoryIds, tagIds } = await generatePostContent(topic);

    // Import post directly using shared function (no HTTP overhead)
    const result = await importPost({
      markdown,
      title,
      excerpt,
      categoryIds,
      tagIds,
    });

    return successResponse(result.post, result.message);
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in cron job:', error);
    }
    return ApiErrors.internalError(
      'Failed to create post',
      process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.message
        : undefined
    );
  }
}

// Also support POST for external cron services
export async function POST(request: NextRequest) {
  return GET(request);
}
