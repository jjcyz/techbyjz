/**
 * Research Sources Configuration
 *
 * Easy-to-manage configuration for enabling/disabling sources
 * and adjusting their priorities.
 *
 * To add a new RSS feed:
 * 1. Add it to SOURCE_REGISTRY.rss in research-sources.ts
 * 2. Set enabled: true/false and priority (higher = fetched first)
 */

import { SOURCE_REGISTRY } from './research-sources';

/**
 * Quick configuration helpers
 * Note: These modify the SOURCE_REGISTRY object directly
 */
export const SourceConfig = {
  /**
   * Enable/disable a specific RSS feed
   */
  toggleRSSFeed(feedKey: keyof typeof SOURCE_REGISTRY.rss, enabled: boolean) {
    const feed = SOURCE_REGISTRY.rss[feedKey];
    if (feed) {
      (feed as { enabled: boolean }).enabled = enabled;
    }
  },

  /**
   * Enable/disable HackerNews
   */
  toggleHackerNews(enabled: boolean) {
    (SOURCE_REGISTRY.hackernews as { enabled: boolean }).enabled = enabled;
  },

  /**
   * Get current configuration status
   */
  getStatus() {
    return {
      hackernews: SOURCE_REGISTRY.hackernews.enabled,
      rssFeeds: Object.entries(SOURCE_REGISTRY.rss).map(([key, config]) => ({
        key,
        name: config.name,
        enabled: config.enabled,
        priority: config.priority,
      })),
    };
  },
};

/**
 * Recommended source configurations for different use cases
 */
export const SourcePresets = {
  /**
   * Maximum sources - all enabled RSS feeds + HackerNews
   */
  maximum: () => {
    SourceConfig.toggleHackerNews(true);
    Object.keys(SOURCE_REGISTRY.rss).forEach((key) => {
      SourceConfig.toggleRSSFeed(key as keyof typeof SOURCE_REGISTRY.rss, true);
    });
  },

  /**
   * Balanced - top RSS feeds + HackerNews (recommended)
   */
  balanced: () => {
    SourceConfig.toggleHackerNews(true);

    // Enable top-tier RSS feeds
    SourceConfig.toggleRSSFeed('techcrunch', true);
    SourceConfig.toggleRSSFeed('theverge', true);
    SourceConfig.toggleRSSFeed('arstechnica', true);
    SourceConfig.toggleRSSFeed('wired', true);
    SourceConfig.toggleRSSFeed('techmeme', true);
    SourceConfig.toggleRSSFeed('bloomberg', true);
    SourceConfig.toggleRSSFeed('engadget', true);

    // Disable lower priority feeds
    SourceConfig.toggleRSSFeed('zdnet', false);
  },

  /**
   * Minimal - fastest, core sources only
   */
  minimal: () => {
    SourceConfig.toggleHackerNews(true);

    // Only top 3 RSS feeds
    SourceConfig.toggleRSSFeed('techcrunch', true);
    SourceConfig.toggleRSSFeed('theverge', true);
    SourceConfig.toggleRSSFeed('arstechnica', true);

    // Disable all others
    Object.keys(SOURCE_REGISTRY.rss).forEach((key) => {
      if (!['techcrunch', 'theverge', 'arstechnica'].includes(key)) {
        SourceConfig.toggleRSSFeed(key as keyof typeof SOURCE_REGISTRY.rss, false);
      }
    });
  },
};
