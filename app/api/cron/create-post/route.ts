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
export async function generatePostContent(topic?: string): Promise<{
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

  // Step 1: Fetch real-time research from HackerNews and RSS feeds
  const researchArticles = await fetchAllResearchSources(topic);
  const researchSummary = formatResearchForPrompt(researchArticles);

  // Step 1.5: Fetch existing categories and tags for AI suggestions (cached)
  const [existingCategories, existingTags] = await Promise.all([
    fetchCategories(),
    fetchTags(),
  ]);

  // Enhanced system prompt for research-based content
  const systemPrompt = `You are an expert tech blogger who writes insightful, well-researched articles that people actually want to read. You:
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

  // Research and synthesis prompt - now includes real research data
  const researchPrompt = topic
    ? `Research the topic: "${topic}".

${researchSummary}

Based on the real-time research above, extract:
1. 5-7 key points from these sources
2. 3-5 interesting connections or patterns
3. 2-3 unique insights or perspectives that most people miss
4. Counter-intuitive findings or contrarian viewpoints

Then synthesize this research into a comprehensive blog post.`
    : `Research current tech trends and news.

${researchSummary}

Based on the real-time research above, extract:
1. 5-7 key points from these sources
2. 3-5 interesting connections or patterns
3. 2-3 unique insights or perspectives that most people miss
4. Counter-intuitive findings or contrarian viewpoints

Then synthesize this research into a comprehensive blog post.`;

  const userPrompt = `${researchPrompt}

Create a blog post that:
1. Synthesizes the research into a coherent narrative
2. Highlights the most interesting connections
3. Develops unique insights further
4. Tells a compelling story

**CRITICAL: Write like a human, not a robot.**
- Use conversational language and natural flow - write as if you're explaining to a friend
- Vary sentence length and structure for rhythm and readability
- Use contractions when appropriate (it's, don't, we're, you're)
- Avoid overly formal or academic language - keep it accessible
- Make it feel authentic and genuine, like a real person wrote it

Format as markdown with:
- A clear, engaging title (as H1)
- An excerpt/summary paragraph (2-3 sentences)
- Well-structured sections with headings (H2, H3)
- Bullet points and examples where appropriate
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- Links where relevant (use [text](url) format)
- Code blocks if discussing technical concepts

Make it insightful, unique, and valuable. Length should be substantial (1500-3000 words equivalent).`;

  // Option 1: Use OpenAI
  if (process.env.OPENAI_API_KEY) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
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

    // Extract title and excerpt
    const titleMatch = aiContent.match(/^#\s+(.+?)$/m);
    const title = titleMatch ? titleMatch[1].trim() : (topic || 'AI Generated Post');

    // Extract excerpt (first paragraph after title, or first 2-3 sentences)
    const contentAfterTitle = aiContent.replace(/^#\s+.+?\n\n?/m, '');
    const excerptMatch = contentAfterTitle.match(/^(.+?)(?:\n\n|$)/m);
    const excerpt = excerptMatch
      ? excerptMatch[1].trim().substring(0, 200) + (excerptMatch[1].length > 200 ? '...' : '')
      : 'A new post generated by AI.';

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
      markdown: aiContent,
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
    // Verify cron secret
    const secret = request.nextUrl.searchParams.get('secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (expectedSecret && secret !== expectedSecret) {
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
