/**
 * Web Search Module for Research
 *
 * Provides internet search capabilities to complement RSS feed research.
 * Supports multiple search providers:
 * - Tavily API (recommended for research)
 * - Serper API (Google search results)
 * - Google Custom Search API (fallback)
 *
 * Usage:
 * - Deep dive into topics found in RSS articles
 * - Find additional sources beyond RSS feeds
 * - Get real-time information on specific topics
 */


export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  source: string;
  publishedAt?: string;
  relevance?: number;
  score?: number;
}

export interface WebSearchConfig {
  query: string;
  maxResults?: number;
  includeContent?: boolean; // Whether to fetch full content from URLs
  provider?: 'tavily' | 'serper' | 'google';
}

/**
 * Search the web for a specific topic
 */
export async function searchWeb(config: WebSearchConfig): Promise<WebSearchResult[]> {
  const { query, maxResults = 10, provider } = config;

  // Determine which provider to use
  const searchProvider = provider || determineBestProvider();

  try {
    switch (searchProvider) {
      case 'tavily':
        return await searchWithTavily(query, maxResults, config.includeContent);
      case 'serper':
        return await searchWithSerper(query, maxResults, config.includeContent);
      case 'google':
        return await searchWithGoogle(query, maxResults, config.includeContent);
      default:
        throw new Error(`Unknown search provider: ${searchProvider}`);
    }
  } catch (error) {
    console.error(`Error with ${searchProvider} search:`, error);
    // Fallback to another provider if available
    if (searchProvider !== 'google') {
      try {
        return await searchWithGoogle(query, maxResults, config.includeContent);
      } catch (fallbackError) {
        console.error('Fallback search also failed:', fallbackError);
        throw error; // Throw original error
      }
    }
    throw error;
  }
}

/**
 * Determine the best available search provider based on API keys
 */
function determineBestProvider(): 'tavily' | 'serper' | 'google' {
  if (process.env.TAVILY_API_KEY) {
    return 'tavily';
  }
  if (process.env.SERPER_API_KEY) {
    return 'serper';
  }
  if (process.env.GOOGLE_SEARCH_API_KEY && process.env.GOOGLE_SEARCH_ENGINE_ID) {
    return 'google';
  }
  throw new Error(
    'No search API configured. Set one of: TAVILY_API_KEY, SERPER_API_KEY, or GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_ENGINE_ID'
  );
}

/**
 * Search using Tavily API (optimized for research)
 * Docs: https://docs.tavily.com/
 */
async function searchWithTavily(
  query: string,
  maxResults: number,
  includeContent?: boolean
): Promise<WebSearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY not configured');
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'advanced',
      include_answer: true,
      include_images: false,
      include_raw_content: includeContent || false,
      max_results: maxResults,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tavily API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as {
    results?: Array<{
      title?: string;
      url?: string;
      content?: string;
      raw_content?: string;
      score?: number;
      published_date?: string;
    }>;
  };

  return (data.results || []).map((result, index: number) => ({
    title: result.title || 'Untitled',
    url: result.url || '',
    content: result.content || result.raw_content || '',
    source: 'Web Search (Tavily)',
    relevance: calculateRelevanceScore(result.score, index),
    publishedAt: result.published_date,
  }));
}

/**
 * Search using Serper API (Google search results)
 * Docs: https://serper.dev/
 */
async function searchWithSerper(
  query: string,
  maxResults: number,
  _includeContent?: boolean
): Promise<WebSearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error('SERPER_API_KEY not configured');
  }

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      num: maxResults,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Serper API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as {
    organic?: Array<{
      title?: string;
      link?: string;
      snippet?: string;
      date?: string;
    }>;
  };

  const results: WebSearchResult[] = [];

  // Process organic results
  if (data.organic) {
    results.push(
      ...data.organic.map((result, index: number) => ({
        title: result.title || 'Untitled',
        url: result.link || '',
        content: result.snippet || '',
        source: 'Web Search (Serper)',
        relevance: calculateRelevanceScore(undefined, index),
        publishedAt: result.date,
      }))
    );
  }

  // Note: Serper doesn't provide full content in the API response
  // The snippet is included in the results above

  return results;
}

/**
 * Search using Google Custom Search API
 * Docs: https://developers.google.com/custom-search/v1/overview
 */
async function searchWithGoogle(
  query: string,
  maxResults: number,
  _includeContent?: boolean
): Promise<WebSearchResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !engineId) {
    throw new Error('GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID must be configured');
  }

  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('cx', engineId);
  url.searchParams.set('q', query);
  url.searchParams.set('num', Math.min(maxResults, 10).toString()); // Google limits to 10 per request

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Custom Search API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as {
    items?: Array<{
      title?: string;
      link?: string;
      snippet?: string;
      pagemap?: {
        metatags?: Array<Record<string, string>>;
      };
    }>;
  };

  return (data.items || []).map((item, index: number) => ({
    title: item.title || 'Untitled',
    url: item.link || '',
    content: item.snippet || '',
    source: 'Web Search (Google)',
    relevance: calculateRelevanceScore(undefined, index),
    publishedAt: item.pagemap?.metatags?.[0]?.['article:published_time'] ||
                 item.pagemap?.metatags?.[0]?.['og:updated_time'],
  }));
}

/**
 * Calculate relevance score for search results
 */
function calculateRelevanceScore(providerScore?: number, index?: number): number {
  // If provider gives a score, use it (normalized to 0-100)
  if (providerScore !== undefined) {
    return Math.min(providerScore * 100, 100);
  }

  // Otherwise, use position-based scoring (higher = better)
  if (index !== undefined) {
    return Math.max(100 - index * 5, 0);
  }

  return 50; // Default score
}

/**
 * Extract interesting topics from an article and search for more information
 */
export async function deepDiveOnTopic(
  topic: string,
  context?: string,
  maxResults: number = 10
): Promise<WebSearchResult[]> {
  // Enhance query with context if provided
  let query = topic;
  if (context) {
    query = `${topic} ${context}`;
  }

  return searchWeb({
    query,
    maxResults,
    includeContent: true, // Get full content for deep dives
  });
}

/**
 * Search for additional sources on a topic mentioned in an article
 */
export async function findAdditionalSources(
  topic: string,
  excludeUrls: string[] = [],
  maxResults: number = 10
): Promise<WebSearchResult[]> {
  const results = await searchWeb({
    query: topic,
    maxResults: maxResults + excludeUrls.length, // Get extra to account for filtering
    includeContent: false,
  });

  // Filter out URLs we already have
  return results
    .filter((result) => !excludeUrls.some((url) => result.url.includes(url)))
    .slice(0, maxResults);
}

/**
 * Format web search results for AI prompt
 */
export function formatWebSearchForPrompt(results: WebSearchResult[]): string {
  if (results.length === 0) {
    return 'No additional web sources found.';
  }

  let formatted = `## Additional Web Research\n\n`;
  formatted += `Found ${results.length} additional sources from web search:\n\n`;

  results.forEach((result, index) => {
    formatted += `${index + 1}. **${result.title}**\n`;
    formatted += `   - URL: ${result.url}\n`;
    formatted += `   - Source: ${result.source}\n`;
    if (result.relevance) {
      formatted += `   - Relevance: ${result.relevance.toFixed(1)}\n`;
    }
    if (result.publishedAt) {
      formatted += `   - Published: ${new Date(result.publishedAt).toLocaleDateString()}\n`;
    }
    formatted += `   - Summary: ${result.content.substring(0, 200)}${result.content.length > 200 ? '...' : ''}\n\n`;
  });

  return formatted;
}

