/**
 * Real-time Research Sources Module
 *
 * Fetches articles from:
 * - HackerNews API (free, no auth required)
 * - RSS Feeds (TechCrunch, The Verge, Ars Technica, Wired, Engadget, Techmeme, ZDNet)
 */

import Parser from 'rss-parser';

export interface ResearchArticle {
  title: string;
  url: string;
  content: string;
  source: string;
  publishedAt?: string;
  score?: number;
  relevance?: number;
}

interface RSSFeedConfig {
  url: string;
  name: string;
  enabled: boolean;
  priority: number;
}

/**
 * Source Registry - Configure RSS feeds and API sources
 */
export const SOURCE_REGISTRY = {
  rss: {
    techcrunch: {
      url: 'https://techcrunch.com/feed/',
      name: 'TechCrunch',
      enabled: true,
      priority: 10,
    },
    theverge: {
      url: 'https://www.theverge.com/rss/index.xml',
      name: 'The Verge',
      enabled: true,
      priority: 10,
    },
    arstechnica: {
      url: 'https://feeds.arstechnica.com/arstechnica/index',
      name: 'Ars Technica',
      enabled: true,
      priority: 9,
    },
    wired: {
      url: 'https://www.wired.com/feed/rss',
      name: 'Wired',
      enabled: true,
      priority: 9,
    },
    techmeme: {
      url: 'https://www.techmeme.com/feed.xml',
      name: 'Techmeme',
      enabled: true,
      priority: 9,
    },
    engadget: {
      url: 'https://www.engadget.com/rss.xml',
      name: 'Engadget',
      enabled: true,
      priority: 8,
    },
    zdnet: {
      url: 'https://www.zdnet.com/news/rss.xml',
      name: 'ZDNet',
      enabled: true,
      priority: 7,
    },
    bloomberg: {
      url: 'https://feeds.bloomberg.com/technology/news.rss',
      name: 'Bloomberg Technology',
      enabled: true,
      priority: 9,
    },
  },
  hackernews: {
    enabled: true,
    priority: 10,
  },
} as const;

/**
 * Get enabled RSS feeds sorted by priority
 */
function getEnabledRSSFeeds(): Array<RSSFeedConfig & { key: string }> {
  return Object.entries(SOURCE_REGISTRY.rss)
    .filter(([, config]) => config.enabled)
    .sort(([, a], [, b]) => b.priority - a.priority)
    .map(([key, config]) => ({ key, ...config }));
}

/**
 * Fetch top stories from HackerNews API
 */
async function fetchHackerNews(topic?: string, maxArticles: number = 15): Promise<ResearchArticle[]> {
  if (!SOURCE_REGISTRY.hackernews.enabled) {
    return [];
  }

  try {
    const topStoriesResponse = await fetch(
      'https://hacker-news.firebaseio.com/v0/topstories.json',
      { cache: 'no-store' }
    );

    if (!topStoriesResponse.ok) {
      console.error('Failed to fetch HackerNews top stories');
      return [];
    }

    const storyIds: number[] = await topStoriesResponse.json();

    // Fetch details for top stories
    const stories = await Promise.all(
      storyIds.slice(0, Math.max(maxArticles * 2, 30)).map(async (id) => {
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

    // Filter valid stories
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

    // Sort by score and return top articles
    return relevantStories
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, maxArticles)
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
 */
async function fetchRSSFeeds(topic?: string, maxArticlesPerFeed: number = 10): Promise<ResearchArticle[]> {
  const parser = new Parser({
    timeout: 10000,
    customFields: {
      item: ['content:encoded', 'media:content'],
    },
  });

  const feeds = getEnabledRSSFeeds();

  // Fetch feeds in parallel
  const feedPromises = feeds.map(async (feed) => {
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

      // Return articles from this feed
      return items.slice(0, maxArticlesPerFeed).map((item) => ({
        title: item.title || 'Untitled',
        url: item.link || '',
        content: item.contentSnippet || item.content || item.title || '',
        source: feed.name,
        publishedAt: item.pubDate || item.isoDate,
      }));
    } catch (error) {
      console.error(`Error fetching RSS feed ${feed.name} (${feed.url}):`, error);
      return [];
    }
  });

  const results = await Promise.all(feedPromises);
  return results.flat();
}

/**
 * Fetch all research sources for a given topic
 */
export async function fetchAllResearchSources(
  topic?: string,
  maxArticles?: number
): Promise<ResearchArticle[]> {
  try {
    const defaultMaxArticles = maxArticles || 30;

    // Fetch from enabled sources in parallel
    const [hackerNewsArticles, rssArticles] = await Promise.all([
      SOURCE_REGISTRY.hackernews.enabled
        ? fetchHackerNews(topic, Math.floor(defaultMaxArticles * 0.3))
        : Promise.resolve([]),
      fetchRSSFeeds(topic, 10),
    ]);

    // Combine and deduplicate by URL
    const allArticles = [...hackerNewsArticles, ...rssArticles];
    const uniqueArticles = Array.from(
      new Map(allArticles.map((article) => [article.url, article])).values()
    );

    // Sort by relevance: prioritize high-scoring posts, then recency
    uniqueArticles.sort((a, b) => {
      // Articles with scores get priority
      if (a.score && !b.score) return -1;
      if (!a.score && b.score) return 1;
      if (a.score && b.score) return b.score - a.score;

      // Then by recency
      if (a.publishedAt && b.publishedAt) {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }

      return 0;
    });

    return uniqueArticles.slice(0, defaultMaxArticles);
  } catch (error) {
    console.error('Error fetching research sources:', error);
    return [];
  }
}

/**
 * Format research articles for AI prompt
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
        formatted += `   - Score: ${article.score}\n`;
      }
      formatted += `   - Summary: ${article.content.substring(0, 200)}${article.content.length > 200 ? '...' : ''}\n\n`;
    });
  }

  return formatted;
}

/**
 * Get list of enabled sources
 */
export function getEnabledSources(): string[] {
  const sources: string[] = [];

  if (SOURCE_REGISTRY.hackernews.enabled) {
    sources.push('HackerNews');
  }

  getEnabledRSSFeeds().forEach((feed) => {
    sources.push(feed.name);
  });

  return sources;
}
