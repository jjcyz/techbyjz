# Research Architecture

A flexible, multi-stage research system that supports different research strategies for content generation.

## Research Strategies

### 1. General (`general`)
- **Use case**: General trend discovery, recap posts
- **Behavior**: Fetches articles from all sources, ranks by relevance
- **Best for**: Quick posts about current trends

### 2. Topic-Specific (`topic-specific`)
- **Use case**: Deep dive into a specific topic
- **Behavior**: Focuses on a single topic, expands with related terms for deep research
- **Best for**: Comprehensive articles on specific subjects
- **Requires**: `topic` parameter

### 3. Discovery (`discovery`)
- **Use case**: Find interesting topics from sources
- **Behavior**: Analyzes articles to discover trending topics
- **Best for**: Finding what to write about
- **Returns**: List of discovered topics with relevance scores

### 4. Deep Dive (`deep-dive`)
- **Use case**: Multi-stage research pipeline
- **Behavior**:
  1. Discovers interesting topics
  2. Selects top topic (or uses provided topic)
  3. Performs deep research on that topic
- **Best for**: Comprehensive, well-researched articles

## Research Depth Levels

- **Shallow**: Quick research (current behavior)
- **Medium**: Moderate depth with more sources
- **Deep**: Comprehensive research with multiple passes and expanded terms

## Usage Examples

### Quick General Research
```typescript
import { quickResearch } from '@/lib/research/research-engine';

const result = await quickResearch('artificial intelligence');
```

### Topic-Specific Deep Dive
```typescript
import { deepResearch } from '@/lib/research/research-engine';

const result = await deepResearch('quantum computing');
```

### Discover Topics
```typescript
import { discoverTopics } from '@/lib/research/research-engine';

const result = await discoverTopics(5); // Find top 5 topics
```

### Custom Research Configuration
```typescript
import { executeResearch } from '@/lib/research/research-engine';

const result = await executeResearch({
  strategy: 'deep-dive',
  depth: 'deep',
  topic: 'AI safety',
  maxArticles: 50,
  focusAreas: ['ethics', 'regulation'],
});
```

## API Endpoint

### POST `/api/admin/research`

Request body:
```json
{
  "strategy": "topic-specific",
  "depth": "deep",
  "topic": "quantum computing",
  "maxArticles": 50,
  "focusAreas": ["hardware", "algorithms"]
}
```

Response:
```json
{
  "success": true,
  "data": {
    "articles": [...],
    "primaryTopic": "quantum computing",
    "researchSummary": "...",
    "metadata": {
      "totalArticles": 50,
      "sourcesUsed": ["HackerNews", "TechCrunch"],
      "researchDepth": "deep",
      "strategy": "topic-specific"
    }
  }
}
```

## Architecture Benefits

1. **Flexible**: Multiple strategies for different use cases
2. **Extensible**: Easy to add new strategies or data sources
3. **Configurable**: Fine-tune research depth and focus
4. **Discoverable**: Can find interesting topics automatically
5. **Composable**: Strategies can be combined (e.g., discovery → deep dive)

## Future Enhancements

- AI-powered topic discovery (currently uses keyword matching)
- Custom data source plugins
- Research result caching
- Research history and tracking
- Multi-language support
- Sentiment analysis
- Trend prediction

