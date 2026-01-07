/**
 * Research Engine - Main entry point for research operations
 *
 * Orchestrates different research strategies based on configuration
 */

import type { ResearchConfig, ResearchResult } from './types';
import {
  generalResearchStrategy,
  topicSpecificStrategy,
  discoveryStrategy,
  deepDiveStrategy,
} from './strategies';

/**
 * Execute research based on configuration
 */
export async function executeResearch(
  config: ResearchConfig
): Promise<ResearchResult> {
  // Set defaults
  const finalConfig: ResearchConfig = {
    depth: 'medium',
    maxArticles: 30,
    ...config,
  };

  // Route to appropriate strategy
  switch (finalConfig.strategy) {
    case 'general':
      return generalResearchStrategy(finalConfig);

    case 'topic-specific':
      return topicSpecificStrategy(finalConfig);

    case 'discovery':
      return discoveryStrategy(finalConfig);

    case 'deep-dive':
      return deepDiveStrategy(finalConfig);

    default:
      throw new Error(`Unknown research strategy: ${finalConfig.strategy}`);
  }
}

/**
 * Quick research helper - general strategy with defaults
 */
export async function quickResearch(topic?: string): Promise<ResearchResult> {
  return executeResearch({
    strategy: 'general',
    depth: 'shallow',
    topic,
  });
}

/**
 * Deep dive helper - topic-specific deep research
 */
export async function deepResearch(topic: string): Promise<ResearchResult> {
  return executeResearch({
    strategy: 'topic-specific',
    depth: 'deep',
    topic,
    maxArticles: 50,
  });
}

/**
 * Discover topics helper - find interesting topics from sources
 */
export async function discoverTopics(maxTopics: number = 5): Promise<ResearchResult> {
  return executeResearch({
    strategy: 'discovery',
    depth: 'medium',
    maxTopicsToDiscover: maxTopics,
  });
}

