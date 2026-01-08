/**
 * Research Strategy Implementations
 *
 * Different research strategies for different use cases
 */

import type { ResearchConfig, ResearchResult, DiscoveredTopic } from './types';
import type { ResearchArticle } from '@/lib/research-sources';
import { fetchAllResearchSources } from '@/lib/research-sources';
import { searchWeb, deepDiveOnTopic, findAdditionalSources, formatWebSearchForPrompt } from './web-search';

/**
 * General research strategy - current behavior
 * Fetches articles and ranks them, good for general posts
 */
export async function generalResearchStrategy(
  config: ResearchConfig
): Promise<ResearchResult> {
  const articles = await fetchAllResearchSources(config.topic);

  return {
    articles,
    researchSummary: formatResearchSummary(articles, config),
    metadata: {
      totalArticles: articles.length,
      sourcesUsed: [...new Set(articles.map(a => a.source))],
      researchDepth: config.depth,
      strategy: 'general',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Topic-specific deep dive strategy
 * Focuses on a specific topic with deeper research
 * Now includes web search for deep dives
 */
export async function topicSpecificStrategy(
  config: ResearchConfig
): Promise<ResearchResult> {
  // If no topic provided, fall back to general strategy
  if (!config.topic) {
    return generalResearchStrategy(config);
  }

  // Fetch initial articles from RSS feeds
  let articles = await fetchAllResearchSources(config.topic);
  const rssUrls = articles.map(a => a.url);

  // For deep research, add web search to complement RSS feeds
  if (config.depth === 'deep' || config.enableWebSearch) {
    try {
      // Search the web for additional sources
      const webResults = await deepDiveOnTopic(
        config.topic,
        undefined,
        config.maxArticles ? Math.floor(config.maxArticles * 0.4) : 10
      );

      // Convert web search results to ResearchArticle format
      const webArticles: ResearchArticle[] = webResults.map(result => ({
        title: result.title,
        url: result.url,
        content: result.content,
        source: result.source,
        publishedAt: result.publishedAt,
        relevance: result.relevance,
        score: result.score,
      }));

      // Combine RSS and web search results
      articles = [...articles, ...webArticles];
    } catch (error) {
      // If web search fails, continue with RSS-only results
      console.warn('Web search failed, continuing with RSS feeds only:', error);
    }
  }

  // For deep research, also expand topic with related terms
  if (config.depth === 'deep') {
    // Expand topic with related terms
    const expandedTopics = expandTopic(config.topic);
    const additionalArticles = await Promise.all(
      expandedTopics.map(t => fetchAllResearchSources(t))
    );
    articles = [...articles, ...additionalArticles.flat()];

    // Deduplicate and re-rank
    articles = deduplicateArticles(articles);
    articles = rankArticlesByRelevance(articles, config.topic);
  }

  // Limit based on config
  if (config.maxArticles) {
    articles = articles.slice(0, config.maxArticles);
  }

  return {
    articles,
    primaryTopic: config.topic,
    researchSummary: formatDeepDiveSummary(articles, config.topic),
    metadata: {
      totalArticles: articles.length,
      sourcesUsed: [...new Set(articles.map(a => a.source))],
      researchDepth: config.depth,
      strategy: 'topic-specific',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Discovery strategy - finds interesting topics from sources
 */
export async function discoveryStrategy(
  config: ResearchConfig
): Promise<ResearchResult> {
  // Fetch general articles
  const articles = await fetchAllResearchSources();

  // Discover topics from articles
  const discoveredTopics = await discoverTopicsFromArticles(
    articles,
    config.maxTopicsToDiscover || 5
  );

  return {
    articles,
    discoveredTopics,
    researchSummary: formatDiscoverySummary(articles, discoveredTopics),
    metadata: {
      totalArticles: articles.length,
      sourcesUsed: [...new Set(articles.map(a => a.source))],
      researchDepth: config.depth,
      strategy: 'discovery',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Deep dive strategy - multi-stage: discover → identify → deep dive
 */
export async function deepDiveStrategy(
  config: ResearchConfig
): Promise<ResearchResult> {
  // Stage 1: Discovery - find interesting topics
  const discoveryResult = await discoveryStrategy({
    ...config,
    strategy: 'discovery',
  });

  if (!discoveryResult.discoveredTopics || discoveryResult.discoveredTopics.length === 0) {
    throw new Error('No topics discovered for deep dive');
  }

  // Stage 2: Select top topic (or use provided topic)
  const selectedTopic = config.topic || discoveryResult.discoveredTopics[0].topic;

  // Stage 3: Deep dive into selected topic
  const deepDiveResult = await topicSpecificStrategy({
    ...config,
    strategy: 'topic-specific',
    topic: selectedTopic,
    depth: 'deep',
  });

  return {
    ...deepDiveResult,
    discoveredTopics: discoveryResult.discoveredTopics,
    researchSummary: formatDeepDiveSummary(
      deepDiveResult.articles,
      selectedTopic,
      discoveryResult.discoveredTopics
    ),
    metadata: {
      ...deepDiveResult.metadata,
      strategy: 'deep-dive',
    },
  };
}

// Helper functions

function expandTopic(topic: string): string[] {
  // Simple expansion - can be enhanced with AI or knowledge base
  const expansions: Record<string, string[]> = {
    'ai': ['artificial intelligence', 'machine learning', 'deep learning', 'neural networks'],
    'security': ['cybersecurity', 'privacy', 'encryption', 'data protection'],
    'web': ['web development', 'frontend', 'backend', 'full stack'],
  };

  const topicLower = topic.toLowerCase();
  for (const [key, values] of Object.entries(expansions)) {
    if (topicLower.includes(key)) {
      return values;
    }
  }

  return [];
}

function deduplicateArticles(articles: ResearchArticle[]): ResearchArticle[] {
  return Array.from(
    new Map(articles.map(article => [article.url, article])).values()
  );
}

function rankArticlesByRelevance(
  articles: ResearchArticle[],
  topic: string
): ResearchArticle[] {
  const topicLower = topic.toLowerCase();

  return articles
    .map(article => ({
      ...article,
      relevance: calculateRelevance(article, topicLower),
    }))
    .sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
}

function calculateRelevance(article: ResearchArticle, topic: string): number {
  let score = 0;
  const titleLower = article.title.toLowerCase();
  const contentLower = article.content.toLowerCase();

  // Title matches are more important
  if (titleLower.includes(topic)) score += 10;
  if (contentLower.includes(topic)) score += 5;

  // Boost HackerNews scores
  if (article.score) score += Math.min(article.score / 10, 5);

  // Recency boost
  if (article.publishedAt) {
    const daysSincePublished =
      (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublished < 7) score += 3;
    else if (daysSincePublished < 30) score += 1;
  }

  return score;
}

async function discoverTopicsFromArticles(
  articles: ResearchArticle[],
  maxTopics: number
): Promise<DiscoveredTopic[]> {
  // Use AI to discover topics from articles
  // For now, simple keyword extraction - can be enhanced with AI
  const topicMap = new Map<string, { articles: ResearchArticle[]; count: number }>();

  // Simple topic extraction based on common tech keywords
  const techKeywords = [
    'AI', 'artificial intelligence', 'machine learning',
    'security', 'cybersecurity', 'privacy',
    'web', 'frontend', 'backend',
    'cloud', 'AWS', 'Azure', 'GCP',
    'blockchain', 'crypto', 'bitcoin',
    'mobile', 'iOS', 'Android',
  ];

  for (const article of articles) {
    const text = `${article.title} ${article.content}`.toLowerCase();
    for (const keyword of techKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        if (!topicMap.has(keyword)) {
          topicMap.set(keyword, { articles: [], count: 0 });
        }
        const entry = topicMap.get(keyword)!;
        entry.articles.push(article);
        entry.count++;
      }
    }
  }

  // Convert to DiscoveredTopic format
  return Array.from(topicMap.entries())
    .map(([topic, data]) => ({
      topic,
      relevanceScore: data.count,
      articleCount: data.count,
      keyArticles: data.articles.slice(0, 5),
      summary: `Found ${data.count} articles related to ${topic}`,
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxTopics);
}

function formatResearchSummary(articles: ResearchArticle[], config: ResearchConfig): string {
  const articlesBySource = articles.reduce((acc, article) => {
    if (!acc[article.source]) acc[article.source] = [];
    acc[article.source].push(article);
    return acc;
  }, {} as Record<string, ResearchArticle[]>);

  let summary = `## Research Summary\n\n`;
  summary += `Found ${articles.length} articles from ${Object.keys(articlesBySource).length} sources.\n\n`;

  for (const [source, sourceArticles] of Object.entries(articlesBySource)) {
    summary += `### ${source} (${sourceArticles.length} articles)\n\n`;
    sourceArticles.slice(0, 5).forEach((article, idx) => {
      summary += `${idx + 1}. **${article.title}**\n`;
      summary += `   - ${article.url}\n`;
      if (article.score) summary += `   - Score: ${article.score}\n`;
      summary += `   - ${article.content.substring(0, 150)}...\n\n`;
    });
  }

  return summary;
}

function formatDeepDiveSummary(
  articles: ResearchArticle[],
  topic: string,
  discoveredTopics?: DiscoveredTopic[]
): string {
  let summary = `## Deep Dive Research: ${topic}\n\n`;
  summary += `Comprehensive research with ${articles.length} articles.\n\n`;

  // Separate RSS feeds and web search results
  const rssArticles = articles.filter(a => !a.source.includes('Web Search'));
  const webArticles = articles.filter(a => a.source.includes('Web Search'));

  // Group RSS articles by source
  const articlesBySource = rssArticles.reduce((acc, article) => {
    if (!acc[article.source]) acc[article.source] = [];
    acc[article.source].push(article);
    return acc;
  }, {} as Record<string, ResearchArticle[]>);

  // Add RSS feed sources
  for (const [source, sourceArticles] of Object.entries(articlesBySource)) {
    summary += `### ${source} (${sourceArticles.length} articles)\n\n`;
    sourceArticles.forEach((article, idx) => {
      summary += `${idx + 1}. **${article.title}**\n`;
      summary += `   - ${article.url}\n`;
      if (article.relevance) summary += `   - Relevance: ${article.relevance.toFixed(1)}\n`;
      summary += `   - ${article.content.substring(0, 200)}...\n\n`;
    });
  }

  // Add web search results if any
  if (webArticles.length > 0) {
    summary += `\n### Web Search Results (${webArticles.length} additional sources)\n\n`;
    webArticles.forEach((article, idx) => {
      summary += `${idx + 1}. **${article.title}**\n`;
      summary += `   - ${article.url}\n`;
      if (article.relevance) summary += `   - Relevance: ${article.relevance.toFixed(1)}\n`;
      summary += `   - ${article.content.substring(0, 200)}...\n\n`;
    });
  }

  if (discoveredTopics && discoveredTopics.length > 0) {
    summary += `\n## Related Topics Discovered\n\n`;
    discoveredTopics.forEach(topic => {
      summary += `- **${topic.topic}**: ${topic.articleCount} articles (relevance: ${topic.relevanceScore})\n`;
    });
  }

  return summary;
}

function formatDiscoverySummary(
  articles: ResearchArticle[],
  topics: DiscoveredTopic[]
): string {
  let summary = `## Topic Discovery Research\n\n`;
  summary += `Analyzed ${articles.length} articles and discovered ${topics.length} interesting topics:\n\n`;

  topics.forEach((topic, idx) => {
    summary += `${idx + 1}. **${topic.topic}**\n`;
    summary += `   - Relevance Score: ${topic.relevanceScore}\n`;
    summary += `   - Articles Found: ${topic.articleCount}\n`;
    summary += `   - Summary: ${topic.summary}\n\n`;
    summary += `   Key Articles:\n`;
    topic.keyArticles.forEach(article => {
      summary += `   - ${article.title} (${article.source})\n`;
    });
    summary += `\n`;
  });

  return summary;
}

