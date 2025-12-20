/**
 * Real-time Research Sources Module
 *
 * Fetches actual data from:
 * - HackerNews API (free, no auth required)
 * - RSS Feeds (TechCrunch, The Verge, Ars Technica)
 */

import Parser from 'rss-parser';

export interface ResearchArticle {
  title: string;
  url: string;
  content: string;
  source: string;
  publishedAt?: string;
  score?: number; // For HackerNews
  relevance?: number; // Calculated relevance to topic
}

// RSS Feed URLs for major tech news sources
const RSS_FEEDS = [
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch' },
  { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge' },
  { url: 'https://feeds.arstechnica.com/arstechnica/index', name: 'Ars Technica' },
];

/**
 * Fetch top stories from HackerNews API
 * Filters by topic if provided, otherwise returns top stories
 */
async function fetchHackerNews(topic?: string): Promise<ResearchArticle[]> {
  try {
    // Get top story IDs
    const topStoriesResponse = await fetch(
      'https://hacker-news.firebaseio.com/v0/topstories.json',
      { cache: 'no-store' } // Always fetch fresh data for real-time research
    );

    if (!topStoriesResponse.ok) {
      console.error('Failed to fetch HackerNews top stories');
      return [];
    }

    const storyIds: number[] = await topStoriesResponse.json();

    // Fetch details for top 30 stories (we'll filter/rank later)
    const stories = await Promise.all(
      storyIds.slice(0, 30).map(async (id) => {
        try {
          const storyResponse = await fetch(
            `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
            { cache: 'no-store' }
          );
          if (!storyResponse.ok) return null;
          return await storyResponse.json();
        } catch (error) {
          console.error(`Error fetching HackerNews story ${id}:`, error);
          return null;
        }
      })
    );

    // Filter out nulls and non-story items (comments, jobs, etc.)
    const validStories = stories.filter(
      (story) => story && story.type === 'story' && story.title && story.url
    );

    // Filter by topic if provided
    let relevantStories = validStories;
    if (topic) {
      const topicLower = topic.toLowerCase();
      relevantStories = validStories.filter(
        (story) =>
          story.title?.toLowerCase().includes(topicLower) ||
          story.text?.toLowerCase().includes(topicLower)
      );
    }

    // Sort by score (highest first) and take top 15
    return relevantStories
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 15)
      .map((story) => ({
        title: story.title,
        url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
        content: story.text || story.title,
        source: 'HackerNews',
        publishedAt: story.time ? new Date(story.time * 1000).toISOString() : undefined,
        score: story.score,
      }));
  } catch (error) {
    console.error('Error fetching HackerNews:', error);
    return [];
  }
}

/**
 * Fetch articles from RSS feeds
 * Supports TechCrunch, The Verge, Ars Technica, and more
 */
async function fetchRSSFeeds(topic?: string): Promise<ResearchArticle[]> {
  const parser = new Parser({
    timeout: 10000, // 10 second timeout per feed
    customFields: {
      item: ['content:encoded', 'media:content'],
    },
  });

  const allArticles: ResearchArticle[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);

      let items = parsed.items || [];

      // Filter by topic if provided
      if (topic) {
        const topicLower = topic.toLowerCase();
        items = items.filter(
          (item) =>
            item.title?.toLowerCase().includes(topicLower) ||
            item.contentSnippet?.toLowerCase().includes(topicLower) ||
            item.content?.toLowerCase().includes(topicLower)
        );
      }

      // Take most recent 10 items per feed
      const feedArticles = items.slice(0, 10).map((item) => ({
        title: item.title || 'Untitled',
        url: item.link || '',
        content: item.contentSnippet || item.content || item.title || '',
        source: feed.name,
        publishedAt: item.pubDate || item.isoDate,
      }));

      allArticles.push(...feedArticles);
    } catch (error) {
      console.error(`Error fetching RSS feed ${feed.name} (${feed.url}):`, error);
      // Continue with other feeds even if one fails
    }
  }

  return allArticles;
}

/**
 * Fetch all research sources for a given topic
 * Combines HackerNews and RSS feeds
 */
export async function fetchAllResearchSources(
  topic?: string
): Promise<ResearchArticle[]> {
  try {
    const [hackerNewsArticles, rssArticles] = await Promise.all([
      fetchHackerNews(topic),
      fetchRSSFeeds(topic),
    ]);

    // Combine and deduplicate by URL
    const allArticles = [...hackerNewsArticles, ...rssArticles];
    const uniqueArticles = Array.from(
      new Map(allArticles.map((article) => [article.url, article])).values()
    );

    // Sort by relevance: prioritize recent articles and high-scoring HackerNews posts
    uniqueArticles.sort((a, b) => {
      // HackerNews articles with high scores get priority
      if (a.score && !b.score) return -1;
      if (!a.score && b.score) return 1;
      if (a.score && b.score) return b.score - a.score;

      // Then by recency
      if (a.publishedAt && b.publishedAt) {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }

      return 0;
    });

    // Return top 30 most relevant articles
    return uniqueArticles.slice(0, 30);
  } catch (error) {
    console.error('Error fetching research sources:', error);
    return [];
  }
}

/**
 * Format research articles for AI prompt
 * Creates a structured summary of the research
 */
export function formatResearchForPrompt(articles: ResearchArticle[]): string {
  if (articles.length === 0) {
    return 'No recent articles found from research sources.';
  }

  const articlesBySource = articles.reduce((acc, article) => {
    if (!acc[article.source]) {
      acc[article.source] = [];
    }
    acc[article.source].push(article);
    return acc;
  }, {} as Record<string, ResearchArticle[]>);

  let formatted = `## Research from Real-Time Sources\n\n`;
  formatted += `Found ${articles.length} relevant articles from the following sources:\n\n`;

  for (const [source, sourceArticles] of Object.entries(articlesBySource)) {
    formatted += `### ${source} (${sourceArticles.length} articles)\n\n`;
    sourceArticles.slice(0, 10).forEach((article, index) => {
      formatted += `${index + 1}. **${article.title}**\n`;
      formatted += `   - URL: ${article.url}\n`;
      if (article.publishedAt) {
        formatted += `   - Published: ${new Date(article.publishedAt).toLocaleDateString()}\n`;
      }
      if (article.score) {
        formatted += `   - HackerNews Score: ${article.score}\n`;
      }
      formatted += `   - Summary: ${article.content.substring(0, 200)}${article.content.length > 200 ? '...' : ''}\n\n`;
    });
  }

  return formatted;
}

