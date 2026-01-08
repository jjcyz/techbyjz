/**
 * Research Architecture Types
 *
 * Multi-stage research system supporting:
 * - General trend discovery
 * - Topic-specific deep dives
 * - Multi-level research pipelines
 */

export type ResearchStrategy =
  | 'general'           // General trend discovery (current behavior)
  | 'topic-specific'    // Deep dive into a specific topic
  | 'discovery'         // Discover interesting topics from sources
  | 'deep-dive';        // Multi-stage: discover → identify → deep dive

export type ResearchDepth =
  | 'shallow'   // Quick research (current behavior)
  | 'medium'    // Moderate depth with more sources
  | 'deep';     // Comprehensive research with multiple passes

export interface ResearchConfig {
  strategy: ResearchStrategy;
  depth: ResearchDepth;
  topic?: string;                    // Optional: specific topic to research
  maxArticles?: number;               // Max articles per source
  minRelevanceScore?: number;         // Minimum relevance score
  sources?: string[];                 // Specific sources to use (default: all)
  focusAreas?: string[];             // Areas to focus on (e.g., ['AI', 'Security'])
  enableTopicDiscovery?: boolean;     // Whether to discover topics from sources
  maxTopicsToDiscover?: number;       // Max topics to discover (default: 5)
  enableWebSearch?: boolean;          // Whether to use web search (default: true for deep dives)
  webSearchProvider?: 'tavily' | 'serper' | 'google'; // Preferred web search provider
}

export interface DiscoveredTopic {
  topic: string;
  relevanceScore: number;
  articleCount: number;
  keyArticles: ResearchArticle[];
  summary: string;
}

export interface ResearchArticle {
  title: string;
  url: string;
  content: string;
  source: string;
  publishedAt?: string;
  score?: number;
  relevance?: number;
  topics?: string[];                  // Topics this article relates to
}

export interface ResearchResult {
  articles: ResearchArticle[];
  discoveredTopics?: DiscoveredTopic[];
  primaryTopic?: string;
  researchSummary: string;
  metadata: {
    totalArticles: number;
    sourcesUsed: string[];
    researchDepth: ResearchDepth;
    strategy: ResearchStrategy;
    timestamp: string;
  };
}

