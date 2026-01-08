/**
 * Research Analysis Module
 *
 * Analyzes research sources to identify:
 * - Missing gaps in coverage
 * - Unique perspectives and angles
 * - Unexplored connections
 * - Contrarian viewpoints
 * - Opportunities for original content
 */

import type { ResearchArticle } from './types';

export interface ResearchAnalysis {
  gaps: string[];
  uniquePerspectives: string[];
  unexploredConnections: string[];
  contrarianViewpoints: string[];
  originalAngles: string[];
  synthesisStrategy: string;
  keyInsights: string[];
}

/**
 * Analyze research sources to find gaps and unique angles
 */
export async function analyzeResearch(
  articles: ResearchArticle[],
  topic?: string,
  customPrompt?: string
): Promise<ResearchAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('No OpenAI API key found. Set OPENAI_API_KEY');
  }

  // Format articles for analysis
  const articlesSummary = formatArticlesForAnalysis(articles);

  const defaultAnalysisPrompt = `You are an expert content strategist and researcher. Your job is to analyze research sources and identify opportunities for creating truly unique, attention-grabbing content that hasn't been written before.

${topic ? `Topic: "${topic}"` : 'General tech trends'}

## Research Sources Analyzed:
${articlesSummary}

## Your Task:
Analyze these sources deeply and identify:

1. **GAPS**: What important aspects, questions, or angles are NOT covered by these sources?
   - What questions remain unanswered?
   - What perspectives are missing?
   - What implications aren't explored?

2. **UNIQUE PERSPECTIVES**: What fresh angles or viewpoints could make this content stand out?
   - What connections haven't been made?
   - What would surprise readers?
   - What counter-intuitive insights exist?

3. **UNEXPLORED CONNECTIONS**: What relationships between ideas, trends, or domains aren't being discussed?
   - Cross-domain connections
   - Historical parallels
   - Future implications

4. **CONTRARIAN VIEWPOINTS**: What popular narratives could be challenged?
   - What assumptions are being made?
   - What alternative explanations exist?
   - What are people missing?

5. **ORIGINAL ANGLES**: Specific angles that would create never-before-written content:
   - Unique framing
   - Unexpected comparisons
   - Novel insights

6. **SYNTHESIS STRATEGY**: How should we approach synthesizing this into content?
   - What narrative structure?
   - What key themes to emphasize?
   - What unique hook?

7. **KEY INSIGHTS**: The 3-5 most important insights that should drive the content

Respond in JSON format:
{
  "gaps": ["gap1", "gap2", ...],
  "uniquePerspectives": ["perspective1", "perspective2", ...],
  "unexploredConnections": ["connection1", "connection2", ...],
  "contrarianViewpoints": ["viewpoint1", "viewpoint2", ...],
  "originalAngles": ["angle1", "angle2", ...],
  "synthesisStrategy": "strategy description",
  "keyInsights": ["insight1", "insight2", ...]
}`;

  const analysisPrompt = customPrompt
    ? customPrompt.replace(/{articlesSummary}/g, articlesSummary).replace(/{topic}/g, topic ? `Topic: "${topic}"` : 'General tech trends')
    : defaultAnalysisPrompt;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert content strategist who identifies unique angles and gaps in research. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: analysisPrompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No analysis content returned from AI');
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const analysis: ResearchAnalysis = JSON.parse(jsonMatch[0]);

    // Validate and ensure all fields exist
    return {
      gaps: analysis.gaps || [],
      uniquePerspectives: analysis.uniquePerspectives || [],
      unexploredConnections: analysis.unexploredConnections || [],
      contrarianViewpoints: analysis.contrarianViewpoints || [],
      originalAngles: analysis.originalAngles || [],
      synthesisStrategy: analysis.synthesisStrategy || 'Synthesize research into coherent narrative',
      keyInsights: analysis.keyInsights || [],
    };
  } catch (error) {
    console.error('Error analyzing research:', error);
    // Return fallback analysis
    return {
      gaps: ['Need to identify gaps in coverage'],
      uniquePerspectives: ['Need to find unique angles'],
      unexploredConnections: ['Need to explore connections'],
      contrarianViewpoints: ['Need to identify contrarian views'],
      originalAngles: ['Need to find original angles'],
      synthesisStrategy: 'Synthesize research into coherent narrative',
      keyInsights: ['Key insights to be identified'],
    };
  }
}

/**
 * Format articles for analysis prompt
 */
function formatArticlesForAnalysis(articles: ResearchArticle[]): string {
  if (articles.length === 0) {
    return 'No articles provided.';
  }

  // Group by source
  const articlesBySource = articles.reduce((acc, article) => {
    if (!acc[article.source]) {
      acc[article.source] = [];
    }
    acc[article.source].push(article);
    return acc;
  }, {} as Record<string, ResearchArticle[]>);

  let formatted = `Total: ${articles.length} articles from ${Object.keys(articlesBySource).length} sources\n\n`;

  for (const [source, sourceArticles] of Object.entries(articlesBySource)) {
    formatted += `### ${source} (${sourceArticles.length} articles)\n\n`;
    sourceArticles.slice(0, 10).forEach((article, idx) => {
      formatted += `${idx + 1}. **${article.title}**\n`;
      formatted += `   - ${article.url}\n`;
      formatted += `   - Summary: ${article.content.substring(0, 300)}${article.content.length > 300 ? '...' : ''}\n\n`;
    });
  }

  return formatted;
}

/**
 * Format analysis for synthesis prompt
 */
export function formatAnalysisForSynthesis(analysis: ResearchAnalysis, topic?: string): string {
  let prompt = `## Research Analysis Results\n\n`;

  if (topic) {
    prompt += `**Topic:** ${topic}\n\n`;
  }

  if (analysis.gaps.length > 0) {
    prompt += `### 🔍 Gaps Identified:\n`;
    analysis.gaps.forEach((gap, idx) => {
      prompt += `${idx + 1}. ${gap}\n`;
    });
    prompt += `\n`;
  }

  if (analysis.uniquePerspectives.length > 0) {
    prompt += `### 💡 Unique Perspectives:\n`;
    analysis.uniquePerspectives.forEach((perspective, idx) => {
      prompt += `${idx + 1}. ${perspective}\n`;
    });
    prompt += `\n`;
  }

  if (analysis.unexploredConnections.length > 0) {
    prompt += `### 🔗 Unexplored Connections:\n`;
    analysis.unexploredConnections.forEach((connection, idx) => {
      prompt += `${idx + 1}. ${connection}\n`;
    });
    prompt += `\n`;
  }

  if (analysis.contrarianViewpoints.length > 0) {
    prompt += `### ⚡ Contrarian Viewpoints:\n`;
    analysis.contrarianViewpoints.forEach((viewpoint, idx) => {
      prompt += `${idx + 1}. ${viewpoint}\n`;
    });
    prompt += `\n`;
  }

  if (analysis.originalAngles.length > 0) {
    prompt += `### 🎯 Original Angles:\n`;
    analysis.originalAngles.forEach((angle, idx) => {
      prompt += `${idx + 1}. ${angle}\n`;
    });
    prompt += `\n`;
  }

  if (analysis.keyInsights.length > 0) {
    prompt += `### 🧠 Key Insights:\n`;
    analysis.keyInsights.forEach((insight, idx) => {
      prompt += `${idx + 1}. ${insight}\n`;
    });
    prompt += `\n`;
  }

  if (analysis.synthesisStrategy) {
    prompt += `### 📋 Synthesis Strategy:\n${analysis.synthesisStrategy}\n\n`;
  }

  return prompt;
}

