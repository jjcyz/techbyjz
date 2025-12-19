/*
 * Cron job endpoint for scheduled post creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchAllResearchSources, formatResearchForPrompt } from '@/lib/research-sources';
import {
  fetchCategories,
  fetchTags,
  suggestCategoriesAndTags,
} from '@/lib/categories-tags';

/**
 * Generates blog post content using AI with research and synthesis
 * Replicates n8n workflow: research → synthesize → create unique insights
 */
async function generatePostContent(topic?: string): Promise<{
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
  console.log(`Fetching real-time research for topic: ${topic || 'current tech trends'}`);
  const researchArticles = await fetchAllResearchSources(topic);
  const researchSummary = formatResearchForPrompt(researchArticles);
  console.log(`Found ${researchArticles.length} relevant articles from research sources`);

  // Step 1.5: Fetch existing categories and tags for AI suggestions
  console.log('Fetching existing categories and tags...');
  const [existingCategories, existingTags] = await Promise.all([
    fetchCategories(),
    fetchTags(),
  ]);
  console.log(`Found ${existingCategories.length} categories and ${existingTags.length} tags`);

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
        model: process.env.OPENAI_MODEL || 'gpt-4o mini',
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
    console.log('Analyzing content to suggest categories and tags...');
    const { categoryIds, tagIds } = await suggestCategoriesAndTags(
      title,
      excerpt,
      aiContent,
      existingCategories,
      existingTags
    );
    console.log(`Assigned ${categoryIds.length} categories and ${tagIds.length} tags`);

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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get optional topic parameter
    const topic = request.nextUrl.searchParams.get('topic') || undefined;

    // Generate post content with research and synthesis
    const { markdown, title, excerpt, categoryIds, tagIds } = await generatePostContent(topic);

    // Import via internal API call (reuses your existing logic)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
    const importResponse = await fetch(`${baseUrl}/api/import-markdown`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Include API key if set
        ...(process.env.API_KEY && { 'x-api-key': process.env.API_KEY }),
      },
      body: JSON.stringify({
        markdown,
        title,
        excerpt,
        categoryIds,
        tagIds,
      }),
    });

    if (!importResponse.ok) {
      const error = await importResponse.json();
      throw new Error(error.error || 'Failed to import post');
    }

    const result = await importResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Post created successfully',
      post: result.post,
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json(
      {
        error: 'Failed to create post',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also support POST for external cron services
export async function POST(request: NextRequest) {
  return GET(request);
}

