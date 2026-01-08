'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ResearchArticle {
  title: string;
  url: string;
  content: string;
  source: string;
  publishedAt?: string;
  score?: number;
  relevance?: number;
  topics?: string[];
}

interface DiscoveredTopic {
  topic: string;
  relevanceScore: number;
  articleCount: number;
  keyArticles: ResearchArticle[];
  summary: string;
}

interface ResearchSources {
  articles: ResearchArticle[];
  sources: Record<string, ResearchArticle[]>;
  totalCount: number;
  discoveredTopics?: DiscoveredTopic[];
  primaryTopic?: string;
  researchSummary?: string;
  metadata?: {
    totalArticles: number;
    sourcesUsed: string[];
    researchDepth: string;
    strategy: string;
  };
}

type ResearchStrategy = 'general' | 'topic-specific' | 'discovery' | 'deep-dive';
type ResearchDepth = 'shallow' | 'medium' | 'deep';

interface GenerationResult {
  success: boolean;
  data?: {
    post: unknown;
    wordCount: number;
    published: boolean;
    researchSources?: ResearchSources;
  };
  message?: string;
  error?: string;
  details?: string;
}

type WorkflowStep = 'idle' | 'research' | 'analysis' | 'synthesis' | 'generation' | 'categorization' | 'import' | 'complete';

export default function ContentGenerator() {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>('idle');
  const [researchSources, setResearchSources] = useState<ResearchSources | null>(null);
  const [loadingSources, setLoadingSources] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [model, setModel] = useState('gpt-4o-mini');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4000);
  const [hoveredStep, setHoveredStep] = useState<WorkflowStep | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [customSystemPrompt, setCustomSystemPrompt] = useState('');
  const [customUserPrompt, setCustomUserPrompt] = useState('');
  const [researchStrategy, setResearchStrategy] = useState<ResearchStrategy>('general');
  const [researchDepth, setResearchDepth] = useState<ResearchDepth>('medium');
  const [discoveringTopics, setDiscoveringTopics] = useState(false);
  const [selectedDiscoveredTopic, setSelectedDiscoveredTopic] = useState<string | null>(null);
  const [webSearchResults, setWebSearchResults] = useState<ResearchArticle[] | null>(null); // Used in handleWebSearch
  const [webSearching, setWebSearching] = useState(false);
  const [webSearchQuery, setWebSearchQuery] = useState('');
  const [researchAnalysis, setResearchAnalysis] = useState<{
    gaps: string[];
    uniquePerspectives: string[];
    unexploredConnections: string[];
    contrarianViewpoints: string[];
    originalAngles: string[];
    synthesisStrategy: string;
    keyInsights: string[];
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Default prompts (for reference/editing)
  const defaultSystemPrompt = `You are an expert tech blogger who writes insightful, well-researched articles that people actually want to read. You:
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

  const defaultUserPromptTemplate = `{researchSummary}

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

Format as Markdown (which will be converted to Portable Text for the editor). Use:
- A clear, engaging title as the first H1 heading (# Title)
- An excerpt/summary paragraph (2-3 sentences) after the title
- Well-structured sections with headings:
  - H1 (#) for main title
  - H2 (##) for major sections
  - H3 (###) for subsections
  - H4 (####) for sub-subsections if needed
- Bullet lists (- item) or numbered lists (1. item) where appropriate
- **Bold text** (double asterisks) for emphasis
- *Italic text* (single asterisk) for subtle emphasis
- Links using [text](url) format
- Inline code using backticks for code snippets
- Code blocks using triple backticks with language: three backticks, language name, code, three backticks
- Blockquotes using > for quotes or callouts

The content will be automatically converted from Markdown to Portable Text format. Make it insightful, unique, and valuable. Length should be substantial (1500-3000 words equivalent).`;

  // Section refs for scrolling - one for each workflow step
  const researchRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const synthesisRef = useRef<HTMLDivElement>(null);
  const generationRef = useRef<HTMLDivElement>(null);
  const categorizationRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLDivElement>(null);
  const logsRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const fetchResearchSources = useCallback(async (strategy?: ResearchStrategy, depth?: ResearchDepth, topic?: string) => {
    try {
      setLoadingSources(true);
      const response = await fetch('/api/admin/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategy: strategy || researchStrategy,
          depth: depth || researchDepth,
          topic: topic || undefined,
        }),
      });
      const data = await response.json();
      if (data.success && data.data) {
        // Transform the new research result format to match existing interface
        const articles = data.data.articles || [];
        const sources = articles.reduce((acc: Record<string, ResearchArticle[]>, article: ResearchArticle) => {
          if (!acc[article.source]) {
            acc[article.source] = [];
          }
          acc[article.source].push(article);
          return acc;
        }, {});

        setResearchSources({
          articles,
          sources,
          totalCount: articles.length,
          discoveredTopics: data.data.discoveredTopics,
          primaryTopic: data.data.primaryTopic,
          researchSummary: data.data.researchSummary,
          metadata: data.data.metadata,
        });
      } else {
        setResearchSources(null);
      }
    } catch {
      setResearchSources(null);
    } finally {
      setLoadingSources(false);
    }
  }, [researchStrategy, researchDepth]);

  const handleDiscoverTopics = async () => {
    setDiscoveringTopics(true);
    try {
      const response = await fetch('/api/admin/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategy: 'discovery',
          depth: 'medium',
          maxTopicsToDiscover: 5,
        }),
      });
      const data = await response.json();
      if (data.success && data.data) {
        const articles = data.data.articles || [];
        const sources = articles.reduce((acc: Record<string, ResearchArticle[]>, article: ResearchArticle) => {
          if (!acc[article.source]) {
            acc[article.source] = [];
          }
          acc[article.source].push(article);
          return acc;
        }, {});

        setResearchSources({
          articles,
          sources,
          totalCount: articles.length,
          discoveredTopics: data.data.discoveredTopics,
          researchSummary: data.data.researchSummary,
          metadata: data.data.metadata,
        });
      }
    } catch (error) {
      console.error('Error discovering topics:', error);
    } finally {
      setDiscoveringTopics(false);
    }
  };

  // Load sources on initial mount
  useEffect(() => {
    fetchResearchSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch research sources when topic or strategy changes (preview)
  useEffect(() => {
    if (isGenerating) return;

    const timeoutId = setTimeout(() => {
      if (topic && researchStrategy === 'topic-specific') {
        fetchResearchSources(researchStrategy, researchDepth, topic);
      } else if (researchStrategy === 'general') {
        fetchResearchSources(researchStrategy, researchDepth, topic || undefined);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, researchStrategy, researchDepth, isGenerating]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Web search function - also fetches filtered RSS feeds
  const handleWebSearch = useCallback(async (query: string, mode: 'search' | 'deep-dive' = 'deep-dive') => {
    if (!query.trim()) return;

    setWebSearching(true);
    setWebSearchQuery(query);
    addLog(`🌐 Searching web for: "${query}"...`);

    try {
      // Fetch both web search AND filtered RSS feeds for this topic
      const [webSearchResponse, rssResponse] = await Promise.all([
        fetch('/api/admin/web-research', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic: query,
            mode,
            maxResults: 10,
          }),
        }),
        // Also fetch RSS feeds filtered by this topic
        fetch('/api/admin/research', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            strategy: 'topic-specific',
            depth: 'medium',
            topic: query,
            maxArticles: 20,
          }),
        }),
      ]);

      const webData = await webSearchResponse.json();
      const rssData = await rssResponse.json();

      // Combine web search results and RSS feed results
      const webResults = webData.success && webData.data?.results ? webData.data.results : [];
      const rssArticles = rssData.success && rssData.data?.articles ? rssData.data.articles : [];

      if (webResults.length > 0) {
        addLog(`✅ Found ${webResults.length} web sources for "${query}"`);
      }
      if (rssArticles.length > 0) {
        addLog(`✅ Found ${rssArticles.length} RSS articles for "${query}"`);
      }

      // Combine all articles
      const allArticles = [...rssArticles, ...webResults];

      if (allArticles.length > 0) {
        setWebSearchResults(webResults);

        // Group by source
        const sources = allArticles.reduce((acc: Record<string, ResearchArticle[]>, article: ResearchArticle) => {
          if (!acc[article.source]) {
            acc[article.source] = [];
          }
          acc[article.source].push(article);
          return acc;
        }, {});

        setResearchSources({
          articles: allArticles,
          sources,
          totalCount: allArticles.length,
          primaryTopic: query,
          researchSummary: rssData.data?.researchSummary || `Research results for: ${query}`,
          metadata: {
            totalArticles: allArticles.length,
            sourcesUsed: Object.keys(sources),
            researchDepth: 'medium',
            strategy: 'topic-specific',
          },
        });
      } else {
        addLog(`⚠️ No results found for "${query}"`);
        setWebSearchResults(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`❌ Web search error: ${errorMessage}`);
      setWebSearchResults(null);
    } finally {
      setWebSearching(false);
    }
  }, []);

  // Analyze function - analyzes research sources to find gaps and unique angles
  const handleAnalyze = async () => {
    if (!researchSources || researchSources.totalCount === 0) {
      addLog('⚠️ No research sources available. Please search for articles first.');
      return;
    }

    setAnalyzing(true);
    setResearchAnalysis(null);
    addLog('🔍 Analyzing research sources to find gaps and unique angles...');

    try {
      const finalTopic = researchSources.primaryTopic || topic || selectedDiscoveredTopic || undefined;

      const response = await fetch('/api/admin/analyze-research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articles: researchSources.articles,
          topic: finalTopic,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setResearchAnalysis(data.data);
        addLog(`✅ Analysis complete! Found ${data.data.gaps.length} gaps, ${data.data.uniquePerspectives.length} unique perspectives`);
        addLog(`📌 Identified ${data.data.originalAngles.length} original angles`);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }
    } catch (error) {
      addLog(`❌ Analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // Synthesize function - uses current research sources and analysis
  const handleSynthesize = async () => {
    if (!researchSources || researchSources.totalCount === 0) {
      addLog('⚠️ No research sources available. Please search for articles first.');
      return;
    }

    setIsGenerating(true);
    setResult(null);
    setLogs([]);
    setWorkflowStep('analysis');

    addLog('🔍 Analyzing and synthesizing research from current sources...');
    if (researchSources.primaryTopic) {
      addLog(`Topic: ${researchSources.primaryTopic}`);
    }

    try {
      const finalTopic = researchSources.primaryTopic || topic || selectedDiscoveredTopic || undefined;

      // Step 1: Analyze (if not already done)
      let analysis = researchAnalysis;
      if (!analysis) {
        addLog('🔍 Analyzing research sources to find gaps and unique angles...');
        setWorkflowStep('analysis');

        const analysisResponse = await fetch('/api/admin/analyze-research', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            articles: researchSources.articles,
            topic: finalTopic,
          }),
        });

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          if (analysisData.success && analysisData.data) {
            analysis = analysisData.data;
            setResearchAnalysis(analysis);
            if (analysis) {
              addLog(`✅ Analysis complete! Found ${analysis.gaps.length} gaps, ${analysis.uniquePerspectives.length} unique perspectives`);
              addLog(`📌 Identified ${analysis.originalAngles.length} original angles`);
            }
          }
        }
      } else if (analysis) {
        addLog(`📊 Using existing analysis: ${analysis.gaps.length} gaps, ${analysis.uniquePerspectives.length} perspectives`);
      }

      // Step 2: Synthesis
      addLog('🧠 Synthesizing research with unique angles...');
      setWorkflowStep('synthesis');
      await new Promise(resolve => setTimeout(resolve, 500)); // Visual delay

      // Step 3: Generation (using current research sources + analysis)
      addLog('✨ Generating original content with AI...');
      setWorkflowStep('generation');

      const response = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: finalTopic,
          systemPrompt: customSystemPrompt || undefined,
          userPrompt: customUserPrompt || undefined,
          model: model || undefined,
          temperature: temperature || undefined,
          maxTokens: maxTokens || undefined,
          researchStrategy: researchSources.metadata?.strategy || 'general',
          researchDepth: researchSources.metadata?.researchDepth || 'medium',
          // Pass current research sources to avoid re-fetching
          researchArticles: researchSources.articles,
          researchSummary: researchSources.researchSummary || formatResearchSummary(researchSources.articles),
          researchAnalysis: analysis || undefined,
        }),
      });

      if (!response.ok) {
        addLog(`❌ HTTP Error: ${response.status} ${response.statusText}`);
        const text = await response.text();
        addLog(`Response: ${text.substring(0, 500)}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GenerationResult = await response.json();

      // Step 3: Categorization
      if (data.success) {
        addLog('🏷️ Assigning categories and tags...');
        setWorkflowStep('categorization');
        await new Promise(resolve => setTimeout(resolve, 300));

        // Step 4: Import
        addLog('💾 Importing post...');
        setWorkflowStep('import');
        await new Promise(resolve => setTimeout(resolve, 300));

        addLog('✅ Content generated successfully!');
        if (data.data?.wordCount) {
          addLog(`Word Count: ${data.data.wordCount}`);
        }

        setWorkflowStep('complete');
      } else {
        addLog(`❌ Error: ${data.error}`);
        if (data.details) {
          addLog(`Details: ${data.details}`);
        }
        setWorkflowStep('idle');
      }

      setResult(data);
    } catch (error) {
      addLog(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to synthesize content',
      });
      setWorkflowStep('idle');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to format research summary
  const formatResearchSummary = (articles: ResearchArticle[]): string => {
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
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);
    setLogs([]);
    setWorkflowStep('research');
    // Don't clear researchSources here - keep them visible during generation

    addLog('Starting content generation...');
    if (topic) {
      addLog(`Topic: ${topic}`);
    }

    try {
      // Determine final topic to use (once at the start)
      const finalTopic = topic || selectedDiscoveredTopic || undefined;

      // Validate: topic-specific strategy requires a topic
      const effectiveStrategy = (researchStrategy === 'topic-specific' && !finalTopic)
        ? 'general'
        : researchStrategy;

      if (researchStrategy === 'topic-specific' && !finalTopic) {
        addLog('⚠️ Topic-specific strategy requires a topic. Switching to general strategy.');
      }

      // Step 1: Research
      addLog(`🔍 Researching using ${effectiveStrategy} strategy (${researchDepth} depth)...`);
      setWorkflowStep('research');
      setLoadingSources(true);

      const researchResponse = await fetch('/api/admin/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategy: effectiveStrategy,
          depth: researchDepth,
          topic: finalTopic,
          maxArticles: researchDepth === 'deep' ? 50 : 30,
        }),
      });

      const researchData = await researchResponse.json();

      if (researchData.success && researchData.data) {
        const articles = researchData.data.articles || [];
        const sources = articles.reduce((acc: Record<string, ResearchArticle[]>, article: ResearchArticle) => {
          if (!acc[article.source]) {
            acc[article.source] = [];
          }
          acc[article.source].push(article);
          return acc;
        }, {});

        setResearchSources({
          articles,
          sources,
          totalCount: articles.length,
          discoveredTopics: researchData.data.discoveredTopics,
          primaryTopic: researchData.data.primaryTopic,
          researchSummary: researchData.data.researchSummary,
          metadata: researchData.data.metadata,
        });

        addLog(`✅ Found ${articles.length} articles from ${Object.keys(sources).length} sources`);
        if (researchData.data.discoveredTopics && researchData.data.discoveredTopics.length > 0) {
          addLog(`📌 Discovered ${researchData.data.discoveredTopics.length} interesting topics`);
        }
      } else {
        addLog(`⚠️ No research sources found`);
        setResearchSources(null);
      }
      setLoadingSources(false);

      // Step 2: Synthesis
      addLog('🧠 Synthesizing research...');
      setWorkflowStep('synthesis');
      await new Promise(resolve => setTimeout(resolve, 500)); // Visual delay

      // Step 3: Generation
      addLog('✨ Generating content with AI...');
      setWorkflowStep('generation');

      const response = await fetch('/api/admin/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: finalTopic,
          systemPrompt: customSystemPrompt || undefined,
          userPrompt: customUserPrompt || undefined,
          model: model || undefined,
          temperature: temperature || undefined,
          maxTokens: maxTokens || undefined,
          researchStrategy: effectiveStrategy,
          researchDepth: researchDepth,
        }),
      });

      if (!response.ok) {
        addLog(`❌ HTTP Error: ${response.status} ${response.statusText}`);
        const text = await response.text();
        addLog(`Response: ${text.substring(0, 500)}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GenerationResult = await response.json();

      // Step 4: Categorization
      if (data.success) {
        addLog('🏷️ Assigning categories and tags...');
        setWorkflowStep('categorization');
        await new Promise(resolve => setTimeout(resolve, 300));

        // Step 5: Import
        addLog('💾 Importing post...');
        setWorkflowStep('import');
        await new Promise(resolve => setTimeout(resolve, 300));

        addLog('✅ Content generated successfully!');
        if (data.data?.wordCount) {
          addLog(`Word Count: ${data.data.wordCount}`);
        }

        // Update research sources if provided
        if (data.data?.researchSources) {
          setResearchSources(data.data.researchSources);
        }

        setWorkflowStep('complete');
      } else {
        addLog(`❌ Error: ${data.error}`);
        if (data.details) {
          addLog(`Details: ${data.details}`);
        }
        setWorkflowStep('idle');
      }

      setResult(data);
    } catch (error) {
      addLog(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate content',
      });
      setWorkflowStep('idle');
    } finally {
      setIsGenerating(false);
    }
  };

  const workflowSteps: Array<{
    id: WorkflowStep;
    label: string;
    icon: string;
    description: string;
    details: string[];
  }> = [
    {
      id: 'research',
      label: 'Research',
      icon: '🔍',
      description: 'Gather articles from RSS feeds and web search',
      details: [
        'Fetch top stories from HackerNews',
        'Retrieve articles from RSS feeds (TechCrunch, The Verge, Ars Technica)',
        'Filter and rank articles by relevance',
        'Extract key information from sources'
      ]
    },
    {
      id: 'analysis',
      label: 'Analyze',
      icon: '🔍',
      description: 'Find gaps and unique angles',
      details: [
        'Identify missing gaps in coverage',
        'Discover unique perspectives',
        'Find unexplored connections',
        'Identify contrarian viewpoints',
        'Determine original angles for content'
      ]
    },
    {
      id: 'synthesis',
      label: 'Synthesize',
      icon: '🧠',
      description: 'Create original content',
      details: [
        'Use analysis to fill gaps',
        'Explore unique perspectives',
        'Make unexplored connections',
        'Create never-before-written content',
        'Generate attention-grabbing insights'
      ]
    },
    {
      id: 'generation',
      label: 'Generate',
      icon: '✨',
      description: 'Create content with AI',
      details: [
        'Use OpenAI to generate blog post',
        'Apply research synthesis to prompt',
        'Create engaging, human-like content',
        'Format as markdown with proper structure'
      ]
    },
    {
      id: 'categorization',
      label: 'Categorize',
      icon: '🏷️',
      description: 'Assign categories and tags',
      details: [
        'Analyze generated content',
        'Suggest relevant categories',
        'Assign appropriate tags',
        'Match with existing taxonomy'
      ]
    },
    {
      id: 'import',
      label: 'Import',
      icon: '💾',
      description: 'Save to content management system',
      details: [
        'Convert markdown to Portable Text',
        'Create draft post in Sanity',
        'Assign categories and tags',
        'Save metadata (title, excerpt, slug)'
      ]
    },
  ];

  const getStepStatus = (step: WorkflowStep): 'pending' | 'active' | 'complete' => {
    if (workflowStep === 'idle') return 'pending';
    if (workflowStep === 'complete') return 'complete';
    const stepIndex = workflowSteps.findIndex(s => s.id === step);
    const currentIndex = workflowSteps.findIndex(s => s.id === workflowStep);
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const scrollToSection = (stepId: WorkflowStep) => {
    let targetElement: HTMLDivElement | null = null;

    switch (stepId) {
      case 'research':
        targetElement = researchRef.current;
        break;
      case 'analysis':
        targetElement = analysisRef.current;
        break;
      case 'synthesis':
        targetElement = synthesisRef.current;
        break;
      case 'generation':
        targetElement = generationRef.current;
        break;
      case 'categorization':
        targetElement = categorizationRef.current;
        break;
      case 'import':
        targetElement = importRef.current;
        break;
      default:
        return;
    }

    if (targetElement) {
      // Scroll with offset for better visibility
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - 80; // 80px offset for header

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Add a highlight effect
      targetElement.classList.add('ring-4', 'ring-blue-300', 'ring-offset-2', 'transition-all');
      setTimeout(() => {
        targetElement?.classList.remove('ring-4', 'ring-blue-300', 'ring-offset-2');
      }, 2000);
    }
  };

  return (
    <div className="space-y-6 min-h-[600px]">
      {/* Research Section */}
      <div ref={researchRef} id="research-section" className="bg-white shadow rounded-lg p-6 scroll-mt-4">
        <h3 className="text-lg font-semibold mb-4">🔍 Research</h3>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-md font-medium">
              Data Sources
              {researchSources && researchSources.totalCount > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({researchSources.totalCount} articles)
                </span>
              )}
            </h4>
            {researchSources?.metadata && (
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                <span>Strategy: {researchSources.metadata.strategy}</span>
                <span>•</span>
                <span>Depth: {researchSources.metadata.researchDepth}</span>
                {researchSources.primaryTopic && (
                  <>
                    <span>•</span>
                    <span>Topic: {researchSources.primaryTopic}</span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchResearchSources()}
              disabled={loadingSources || isGenerating}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingSources ? 'Loading...' : '🔄 Refresh Sources'}
            </button>
            {/* Web Search Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={webSearchQuery}
                onChange={(e) => setWebSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && webSearchQuery.trim()) {
                    handleWebSearch(webSearchQuery);
                  }
                }}
                placeholder="Search web for topic..."
                disabled={webSearching || isGenerating}
                className="text-sm px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={() => handleWebSearch(webSearchQuery)}
                disabled={webSearching || isGenerating || !webSearchQuery.trim()}
                className="text-sm text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 border border-green-300 rounded-md hover:bg-green-50"
                title="Search the web for additional sources on this topic"
              >
                {webSearching ? '⏳' : '🌐 Web Search'}
              </button>
            </div>
          </div>
        </div>

        {loadingSources && (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
            <p>Loading research sources...</p>
          </div>
        )}

        {!loadingSources && researchSources && researchSources.totalCount > 0 && (
          <div className="space-y-4">
            {/* Analyze & Synthesize Buttons - appears above research sources */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-900">
                  Ready to analyze and synthesize {researchSources.totalCount} articles
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  {researchAnalysis
                    ? `Analysis complete: ${researchAnalysis.gaps.length} gaps, ${researchAnalysis.uniquePerspectives.length} unique perspectives found`
                    : 'Analyze sources to find gaps and unique angles, then synthesize into original content'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing || isGenerating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Analyze research sources to find gaps and unique angles"
                >
                  {analyzing ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      🔍 Analyze
                    </>
                  )}
                </button>
                <button
                  onClick={handleSynthesize}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Analyze (if needed) and synthesize into original content"
                >
                  {isGenerating ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Synthesizing...
                    </>
                  ) : (
                    <>
                      🧠 Analyze & Synthesize
                    </>
                  )}
                </button>
              </div>
            </div>

            {Object.entries(researchSources.sources).map(([source, articles]) => (
              <div key={source} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{source}</h4>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {articles.length} {articles.length === 1 ? 'article' : 'articles'}
                  </span>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {articles.map((article, idx) => (
                    <div key={idx} className="text-sm group pb-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-start justify-between gap-2">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline flex-1"
                        >
                          {article.title}
                        </a>
                        {/* Deep dive button - extract topic from title */}
                        {!article.source.includes('Web Search') && (
                          <button
                            onClick={() => {
                              // Extract a potential topic from the title (first few words)
                              const potentialTopic = article.title.split(' ').slice(0, 4).join(' ');
                              handleWebSearch(potentialTopic, 'deep-dive');
                            }}
                            disabled={webSearching || isGenerating}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-green-600 hover:text-green-800 px-2 py-0.5 border border-green-300 rounded hover:bg-green-50 disabled:opacity-50 shrink-0"
                            title="Deep dive: search web for more info on this topic"
                          >
                            🔍
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {article.score && (
                          <span className="text-xs text-gray-500">HN Score: {article.score}</span>
                        )}
                        {article.relevance !== undefined && (
                          <span className="text-xs text-blue-600">Relevance: {article.relevance.toFixed(1)}</span>
                        )}
                        {article.publishedAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(article.publishedAt).toLocaleDateString()}
                          </span>
                        )}
                        {article.source.includes('Web Search') && (
                          <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Web</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingSources && (!researchSources || researchSources.totalCount === 0) && (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No research sources loaded yet.</p>
            <p className="text-sm">Sources will appear here when you generate content or click &quot;Refresh Sources&quot;.</p>
            <p className="text-xs mt-2 text-gray-400">
              Available sources: HackerNews, TechCrunch, The Verge, Ars Technica
            </p>
            <p className="text-xs mt-1 text-green-600">
              💡 Use web search above to find additional sources beyond RSS feeds
            </p>
          </div>
        )}
      </div>

      {/* Analysis Section */}
      <div ref={analysisRef} id="analysis-section" className="bg-white shadow rounded-lg p-6 scroll-mt-4">
        <h3 className="text-lg font-semibold mb-4">🔍 Analysis</h3>
        {analyzing && (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
            <p>Analyzing research sources...</p>
          </div>
        )}
        {!analyzing && researchAnalysis && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg max-h-[600px] overflow-y-auto">
            <h4 className="text-sm font-semibold text-blue-900 mb-3">📊 Analysis Results</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {researchAnalysis.gaps.length > 0 && (
                <div>
                  <p className="font-medium text-blue-800 mb-1">🔍 Gaps ({researchAnalysis.gaps.length}):</p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1">
                    {researchAnalysis.gaps.map((gap, idx) => (
                      <li key={idx}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}
              {researchAnalysis.uniquePerspectives.length > 0 && (
                <div>
                  <p className="font-medium text-blue-800 mb-1">💡 Unique Perspectives ({researchAnalysis.uniquePerspectives.length}):</p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1">
                    {researchAnalysis.uniquePerspectives.map((perspective, idx) => (
                      <li key={idx}>{perspective}</li>
                    ))}
                  </ul>
                </div>
              )}
              {researchAnalysis.unexploredConnections.length > 0 && (
                <div>
                  <p className="font-medium text-blue-800 mb-1">🔗 Unexplored Connections ({researchAnalysis.unexploredConnections.length}):</p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1">
                    {researchAnalysis.unexploredConnections.map((connection, idx) => (
                      <li key={idx}>{connection}</li>
                    ))}
                  </ul>
                </div>
              )}
              {researchAnalysis.contrarianViewpoints.length > 0 && (
                <div>
                  <p className="font-medium text-blue-800 mb-1">⚡ Contrarian Viewpoints ({researchAnalysis.contrarianViewpoints.length}):</p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1">
                    {researchAnalysis.contrarianViewpoints.map((viewpoint, idx) => (
                      <li key={idx}>{viewpoint}</li>
                    ))}
                  </ul>
                </div>
              )}
              {researchAnalysis.originalAngles.length > 0 && (
                <div>
                  <p className="font-medium text-blue-800 mb-1">🎯 Original Angles ({researchAnalysis.originalAngles.length}):</p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1">
                    {researchAnalysis.originalAngles.map((angle, idx) => (
                      <li key={idx}>{angle}</li>
                    ))}
                  </ul>
                </div>
              )}
              {researchAnalysis.keyInsights.length > 0 && (
                <div>
                  <p className="font-medium text-blue-800 mb-1">🧠 Key Insights ({researchAnalysis.keyInsights.length}):</p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1">
                    {researchAnalysis.keyInsights.map((insight, idx) => (
                      <li key={idx}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
              {researchAnalysis.synthesisStrategy && (
                <div className="md:col-span-2">
                  <p className="font-medium text-blue-800 mb-1">📋 Synthesis Strategy:</p>
                  <p className="text-blue-700">{researchAnalysis.synthesisStrategy}</p>
                </div>
              )}
            </div>
          </div>
        )}
        {!analyzing && !researchAnalysis && (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No analysis results yet.</p>
            <p className="text-sm">Click &quot;🔍 Analyze&quot; above to analyze your research sources.</p>
          </div>
        )}
      </div>

      {/* Synthesis Section */}
      <div ref={synthesisRef} id="synthesis-section" className="bg-white shadow rounded-lg p-6 scroll-mt-4">
        <h3 className="text-lg font-semibold mb-4">🧠 Synthesis</h3>
        {workflowStep === 'synthesis' && (
          <div className="text-center py-8 text-blue-500">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
            <p>Synthesizing research into original content...</p>
          </div>
        )}
        {workflowStep !== 'synthesis' && researchAnalysis && (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">Ready to synthesize.</p>
            <p className="text-sm">Analysis complete. Click &quot;🧠 Analyze & Synthesize&quot; to generate content.</p>
          </div>
        )}
        {workflowStep !== 'synthesis' && !researchAnalysis && (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">Synthesis pending.</p>
            <p className="text-sm">Complete analysis first, then synthesis will begin.</p>
          </div>
        )}
      </div>

      {/* Generation Section */}
      <div ref={generationRef} id="generation-section" className="bg-white shadow rounded-lg p-6 scroll-mt-4">
        <h3 className="text-xl font-semibold mb-4">✨ Generate</h3>

        <div className="space-y-4">
          {/* Research Strategy Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="researchStrategy" className="block text-sm font-medium text-gray-700 mb-2">
                Research Strategy
              </label>
              <select
                id="researchStrategy"
                value={researchStrategy}
                onChange={(e) => {
                  setResearchStrategy(e.target.value as ResearchStrategy);
                  if (e.target.value === 'discovery' || e.target.value === 'deep-dive') {
                    setTopic(''); // Clear topic for discovery strategies
                  }
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                disabled={isGenerating}
              >
                <option value="general">General - Trend Discovery</option>
                <option value="topic-specific">Topic-Specific - Deep Dive</option>
                <option value="discovery">Discovery - Find Topics</option>
                <option value="deep-dive">Deep Dive - Multi-Stage</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {researchStrategy === 'general' && 'Quick research on current trends'}
                {researchStrategy === 'topic-specific' && 'Deep research on a specific topic'}
                {researchStrategy === 'discovery' && 'Discover interesting topics from sources'}
                {researchStrategy === 'deep-dive' && 'Discover topics then deep dive into the best one'}
              </p>
            </div>

            <div>
              <label htmlFor="researchDepth" className="block text-sm font-medium text-gray-700 mb-2">
                Research Depth
              </label>
              <select
                id="researchDepth"
                value={researchDepth}
                onChange={(e) => setResearchDepth(e.target.value as ResearchDepth)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                disabled={isGenerating}
              >
                <option value="shallow">Shallow - Quick (15-20 articles)</option>
                <option value="medium">Medium - Moderate (30-40 articles)</option>
                <option value="deep">Deep - Comprehensive (50+ articles)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {researchDepth === 'shallow' && 'Fast research, fewer sources'}
                {researchDepth === 'medium' && 'Balanced research, more sources'}
                {researchDepth === 'deep' && 'Comprehensive research with web search + expanded terms'}
              </p>
            </div>
          </div>

          {/* Topic Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
                {researchStrategy === 'topic-specific' || researchStrategy === 'deep-dive'
                  ? 'Topic (required)'
                  : 'Topic (optional)'}
              </label>
              {(researchStrategy === 'discovery' || researchStrategy === 'deep-dive') && (
                <button
                  type="button"
                  onClick={handleDiscoverTopics}
                  disabled={discoveringTopics || isGenerating}
                  className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  {discoveringTopics ? 'Discovering...' : '🔍 Discover Topics'}
                </button>
              )}
            </div>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                researchStrategy === 'discovery' || researchStrategy === 'deep-dive'
                  ? 'Click "Discover Topics" to find interesting topics'
                  : 'e.g., artificial intelligence, web development'
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              disabled={isGenerating || researchStrategy === 'discovery'}
            />
            <p className="mt-1 text-sm text-gray-500">
              {researchStrategy === 'general' && 'Leave empty to generate content about current tech trends'}
              {researchStrategy === 'topic-specific' && 'Enter a specific topic for deep research'}
              {researchStrategy === 'discovery' && 'Click "Discover Topics" to find interesting topics from sources'}
              {researchStrategy === 'deep-dive' && 'Optional: specify a topic, or let the system discover one'}
            </p>
          </div>

          {/* Discovered Topics Display */}
          {researchSources?.discoveredTopics && researchSources.discoveredTopics.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-3">
                Discovered Topics ({researchSources.discoveredTopics.length})
              </h3>
              <div className="space-y-2">
                {researchSources.discoveredTopics.map((discoveredTopic, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedDiscoveredTopic(discoveredTopic.topic);
                      setTopic(discoveredTopic.topic);
                      setResearchStrategy('topic-specific');
                    }}
                    className={`w-full text-left p-3 rounded-md border transition-all ${
                      selectedDiscoveredTopic === discoveredTopic.topic
                        ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-300'
                        : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                    disabled={isGenerating}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{discoveredTopic.topic}</div>
                        <div className="text-xs text-gray-600 mt-1">{discoveredTopic.summary}</div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span>📊 {discoveredTopic.articleCount} articles</span>
                          <span>⭐ Relevance: {discoveredTopic.relevanceScore}</span>
                        </div>
                      </div>
                      {selectedDiscoveredTopic === discoveredTopic.topic && (
                        <span className="text-blue-600 ml-2">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-blue-700 mt-3">
                💡 Click a topic to use it for content generation
              </p>
            </div>
          )}

          {/* Advanced Options */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showAdvanced ? '▼' : '▶'} Advanced Options
            </button>
            {showAdvanced && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-md">
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                    AI Model
                  </label>
                  <select
                    id="model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    disabled={isGenerating}
                  >
                    <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cost-effective)</option>
                    <option value="gpt-4o">GPT-4o (Higher Quality)</option>
                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="temperature" className="block text-sm font-medium text-gray-700">
                      Temperature: {temperature}
                    </label>
                    <input
                      type="range"
                      id="temperature"
                      min="0"
                      max="1"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full"
                      disabled={isGenerating}
                    />
                    <p className="text-xs text-gray-500 mt-1">Lower = more focused, Higher = more creative</p>
                  </div>
                  <div>
                    <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700">
                      Max Tokens: {maxTokens}
                    </label>
                    <input
                      type="range"
                      id="maxTokens"
                      min="1000"
                      max="8000"
                      step="500"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                      className="w-full"
                      disabled={isGenerating}
                    />
                    <p className="text-xs text-gray-500 mt-1">Maximum length of generated content</p>
                  </div>
                </div>
              </div>
            )}

            {/* Prompt Editor */}
            <div>
              <button
                type="button"
                onClick={() => setShowPromptEditor(!showPromptEditor)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showPromptEditor ? '▼' : '▶'} Customize Prompts
              </button>
              {showPromptEditor && (
                <div className="mt-3 space-y-4 p-4 bg-gray-50 rounded-md">
                  <div>
                    <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                      System Prompt
                    </label>
                    <textarea
                      id="systemPrompt"
                      value={customSystemPrompt}
                      onChange={(e) => setCustomSystemPrompt(e.target.value)}
                      placeholder={defaultSystemPrompt}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border font-mono text-xs"
                      rows={8}
                      disabled={isGenerating}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Define the AI&apos;s role and writing style. Leave empty to use default.
                    </p>
                  </div>
                  <div>
                    <label htmlFor="userPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                      User Prompt (Content Instructions)
                    </label>
                    <textarea
                      id="userPrompt"
                      value={customUserPrompt}
                      onChange={(e) => setCustomUserPrompt(e.target.value)}
                      placeholder={defaultUserPromptTemplate}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border font-mono text-xs"
                      rows={10}
                      disabled={isGenerating}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Instructions for content generation. Use {'{researchSummary}'} placeholder for research data. Leave empty to use default.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomSystemPrompt('');
                        setCustomUserPrompt('');
                      }}
                      className="text-xs text-gray-600 hover:text-gray-800 underline"
                      disabled={isGenerating}
                    >
                      Reset to Defaults
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Tip: Use {'{researchSummary}'} placeholder in the user prompt to include research data automatically.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || (researchStrategy === 'topic-specific' && !topic && !selectedDiscoveredTopic)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Content'}
          </button>
          {researchStrategy === 'topic-specific' && !topic && !selectedDiscoveredTopic && (
            <p className="text-sm text-red-600 mt-1">
              ⚠️ Topic-specific strategy requires a topic. Please enter a topic or select a discovered topic.
            </p>
          )}
        </div>
      </div>

      {/* Visual Workflow - Always Visible */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Workflow</h3>
          {isGenerating && (
            <span className="text-sm text-blue-600 font-medium animate-pulse">
              In Progress...
            </span>
          )}
        </div>

        {/* Horizontal Flow Diagram */}
        <div className="mb-8">
          <div className="flex items-start justify-between relative">
            {/* Connection Lines */}
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 -z-10">
              <div
                className={`h-full bg-gradient-to-r transition-all duration-500 ${
                  workflowStep === 'complete'
                    ? 'bg-green-500 w-full'
                    : workflowStep !== 'idle'
                    ? 'bg-blue-500'
                    : 'bg-transparent'
                }`}
                style={{
                  width: workflowStep === 'idle'
                    ? '0%'
                    : workflowStep === 'complete'
                    ? '100%'
                    : `${((workflowSteps.findIndex(s => s.id === workflowStep) + 1) / workflowSteps.length) * 100}%`
                }}
              />
            </div>

            {workflowSteps.map((step, index) => {
              // Add analyze button for analysis step when research sources are available
              const showAnalyzeButton = step.id === 'analysis' && researchSources && researchSources.totalCount > 0 && !analyzing && !isGenerating;
              // Add synthesize button for synthesis step when research sources are available
              const showSynthesizeButton = step.id === 'synthesis' && researchSources && researchSources.totalCount > 0 && !isGenerating;
              const status = getStepStatus(step.id);
              const isHovered = hoveredStep === step.id;

              return (
                <div
                  key={step.id}
                  className="flex flex-col items-center flex-1 relative group"
                  onMouseEnter={() => setHoveredStep(step.id)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  {/* Step Circle - Clickable */}
                  <div className="relative z-10">
                    <button
                      onClick={() => scrollToSection(step.id)}
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-300 shadow-md cursor-pointer ${
                        status === 'active'
                          ? 'bg-blue-500 text-white scale-110 shadow-lg ring-4 ring-blue-200'
                          : status === 'complete'
                          ? 'bg-green-500 text-white scale-105 hover:scale-110'
                          : 'bg-gray-200 text-gray-500 hover:bg-gray-300 hover:scale-105'
                      } ${isHovered ? 'ring-4 ring-blue-300' : ''}`}
                      title={`Click to view ${step.label.toLowerCase()} section`}
                    >
                      {status === 'complete' ? (
                        <span className="text-2xl">✓</span>
                      ) : (
                        <span>{step.icon}</span>
                      )}
                    </button>

                    {/* Active Pulse Animation */}
                    {status === 'active' && (
                      <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" />
                    )}

                    {/* Hover Tooltip */}
                    {isHovered && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-72 bg-gray-900 text-white text-xs rounded-lg shadow-2xl p-4 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="font-semibold mb-2 text-sm flex items-center gap-2">
                          <span>{step.icon}</span>
                          <span>{step.label}</span>
                        </div>
                        <div className="text-gray-300 mb-3 text-xs leading-relaxed">{step.description}</div>
                        <div className="border-t border-gray-700 pt-3 mt-3">
                          <div className="text-gray-400 text-xs mb-2 font-medium">What happens:</div>
                          <ul className="space-y-1.5">
                            {step.details.slice(0, 3).map((detail, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-blue-400 mt-0.5 shrink-0">▸</span>
                                <span className="text-gray-300 leading-relaxed">{detail}</span>
                              </li>
                            ))}
                            {step.details.length > 3 && (
                              <li className="text-gray-500 text-xs pl-4">
                                + {step.details.length - 3} more steps
                              </li>
                            )}
                          </ul>
                        </div>
                        <div className="text-blue-300 text-xs mt-3 pt-3 border-t border-gray-700 flex items-center gap-1">
                          <span>Click to view section</span>
                          <span>→</span>
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                          <div className="w-2 h-2 bg-gray-900 transform rotate-45"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="mt-3 text-center">
                    <button
                      onClick={() => scrollToSection(step.id)}
                      className="cursor-pointer group-hover:text-blue-600 transition-colors"
                    >
                      <div
                        className={`font-semibold text-sm mb-1 ${
                          status === 'active'
                            ? 'text-blue-600'
                            : status === 'complete'
                            ? 'text-green-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {step.label}
                      </div>
                      <div className="text-xs text-gray-500 max-w-[120px]">
                        {step.description}
                      </div>
                    </button>
                    {/* Analyze Button - appears when research sources are available */}
                    {showAnalyzeButton && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAnalyze();
                        }}
                        className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`Analyze ${researchSources.totalCount} articles to find gaps and unique angles`}
                      >
                        🔍 Analyze Now
                      </button>
                    )}
                    {/* Synthesize Button - appears when research sources are available */}
                    {showSynthesizeButton && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSynthesize();
                        }}
                        className="mt-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`Analyze and synthesize ${researchSources.totalCount} articles from current research`}
                      >
                        🧠 Synthesize Now
                      </button>
                    )}
                  </div>

                  {/* Step Number */}
                  <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    status === 'active' || status === 'complete'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Bar */}
        {workflowStep !== 'idle' && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-500">
                {workflowStep === 'complete'
                  ? '100%'
                  : `${Math.round(((workflowSteps.findIndex(s => s.id === workflowStep) + 1) / workflowSteps.length) * 100)}%`
                }
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  workflowStep === 'complete' ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{
                  width: workflowStep === 'complete'
                    ? '100%'
                    : `${((workflowSteps.findIndex(s => s.id === workflowStep) + 1) / workflowSteps.length) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Research Section */}
      <div ref={researchRef} id="research-section" className="bg-white shadow rounded-lg p-6 scroll-mt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">
              Data Sources
              {researchSources && researchSources.totalCount > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({researchSources.totalCount} articles)
                </span>
              )}
            </h3>
            {researchSources?.metadata && (
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                <span>Strategy: {researchSources.metadata.strategy}</span>
                <span>•</span>
                <span>Depth: {researchSources.metadata.researchDepth}</span>
                {researchSources.primaryTopic && (
                  <>
                    <span>•</span>
                    <span>Topic: {researchSources.primaryTopic}</span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchResearchSources()}
              disabled={loadingSources || isGenerating}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingSources ? 'Loading...' : '🔄 Refresh Sources'}
            </button>
            {/* Web Search Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={webSearchQuery}
                onChange={(e) => setWebSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && webSearchQuery.trim()) {
                    handleWebSearch(webSearchQuery);
                  }
                }}
                placeholder="Search web for topic..."
                disabled={webSearching || isGenerating}
                className="text-sm px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={() => handleWebSearch(webSearchQuery)}
                disabled={webSearching || isGenerating || !webSearchQuery.trim()}
                className="text-sm text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed px-2 py-1 border border-green-300 rounded-md hover:bg-green-50"
                title="Search the web for additional sources on this topic"
              >
                {webSearching ? '⏳' : '🌐 Web Search'}
              </button>
            </div>
          </div>
        </div>

        {loadingSources && (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
            <p>Loading research sources...</p>
          </div>
        )}

        {!loadingSources && researchSources && researchSources.totalCount > 0 && (
          <div className="space-y-4">
            {/* Analyze & Synthesize Buttons - appears above research sources */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-900">
                  Ready to analyze and synthesize {researchSources.totalCount} articles
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  {researchAnalysis
                    ? `Analysis complete: ${researchAnalysis.gaps.length} gaps, ${researchAnalysis.uniquePerspectives.length} unique perspectives found`
                    : 'Analyze sources to find gaps and unique angles, then synthesize into original content'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing || isGenerating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Analyze research sources to find gaps and unique angles"
                >
                  {analyzing ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      🔍 Analyze
                    </>
                  )}
                </button>
                <button
                  onClick={handleSynthesize}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md shadow-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  title="Analyze (if needed) and synthesize into original content"
                >
                  {isGenerating ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Synthesizing...
                    </>
                  ) : (
                    <>
                      🧠 Analyze & Synthesize
                    </>
                  )}
                </button>
              </div>
            </div>

            {Object.entries(researchSources.sources).map(([source, articles]) => (
              <div key={source} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{source}</h4>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {articles.length} {articles.length === 1 ? 'article' : 'articles'}
                  </span>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {articles.map((article, idx) => (
                    <div key={idx} className="text-sm group pb-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-start justify-between gap-2">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline flex-1"
                        >
                          {article.title}
                        </a>
                        {/* Deep dive button - extract topic from title */}
                        {!article.source.includes('Web Search') && (
                          <button
                            onClick={() => {
                              // Extract a potential topic from the title (first few words)
                              const potentialTopic = article.title.split(' ').slice(0, 4).join(' ');
                              handleWebSearch(potentialTopic, 'deep-dive');
                            }}
                            disabled={webSearching || isGenerating}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-green-600 hover:text-green-800 px-2 py-0.5 border border-green-300 rounded hover:bg-green-50 disabled:opacity-50 shrink-0"
                            title="Deep dive: search web for more info on this topic"
                          >
                            🔍
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {article.score && (
                          <span className="text-xs text-gray-500">HN Score: {article.score}</span>
                        )}
                        {article.relevance !== undefined && (
                          <span className="text-xs text-blue-600">Relevance: {article.relevance.toFixed(1)}</span>
                        )}
                        {article.publishedAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(article.publishedAt).toLocaleDateString()}
                          </span>
                        )}
                        {article.source.includes('Web Search') && (
                          <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">Web</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingSources && (!researchSources || researchSources.totalCount === 0) && (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No research sources loaded yet.</p>
            <p className="text-sm">Sources will appear here when you generate content or click &quot;Refresh Sources&quot;.</p>
            <p className="text-xs mt-2 text-gray-400">
              Available sources: HackerNews, TechCrunch, The Verge, Ars Technica
            </p>
            <p className="text-xs mt-1 text-green-600">
              💡 Use web search above to find additional sources beyond RSS feeds
            </p>
          </div>
        )}
      </div>

      {/* Analysis Section */}
      <div ref={analysisRef} id="analysis-section" className="bg-white shadow rounded-lg p-6 scroll-mt-4">
        <h3 className="text-lg font-semibold mb-4">🔍 Analysis</h3>
        {analyzing && (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
            <p>Analyzing research sources...</p>
          </div>
        )}
        {!analyzing && researchAnalysis && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg max-h-[600px] overflow-y-auto">
            <h4 className="text-sm font-semibold text-blue-900 mb-3">📊 Analysis Results</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {researchAnalysis.gaps.length > 0 && (
                <div>
                  <p className="font-medium text-blue-800 mb-1">🔍 Gaps ({researchAnalysis.gaps.length}):</p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1">
                    {researchAnalysis.gaps.map((gap, idx) => (
                      <li key={idx}>{gap}</li>
                    ))}
                  </ul>
                </div>
              )}
              {researchAnalysis.uniquePerspectives.length > 0 && (
                <div>
                  <p className="font-medium text-blue-800 mb-1">💡 Unique Perspectives ({researchAnalysis.uniquePerspectives.length}):</p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1">
                    {researchAnalysis.uniquePerspectives.map((perspective, idx) => (
                      <li key={idx}>{perspective}</li>
                    ))}
                  </ul>
                </div>
              )}
              {researchAnalysis.unexploredConnections.length > 0 && (
                <div>
                  <p className="font-medium text-blue-800 mb-1">🔗 Unexplored Connections ({researchAnalysis.unexploredConnections.length}):</p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1">
                    {researchAnalysis.unexploredConnections.map((connection, idx) => (
                      <li key={idx}>{connection}</li>
                    ))}
                  </ul>
                </div>
              )}
              {researchAnalysis.contrarianViewpoints.length > 0 && (
                <div>
                  <p className="font-medium text-blue-800 mb-1">⚡ Contrarian Viewpoints ({researchAnalysis.contrarianViewpoints.length}):</p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1">
                    {researchAnalysis.contrarianViewpoints.map((viewpoint, idx) => (
                      <li key={idx}>{viewpoint}</li>
                    ))}
                  </ul>
                </div>
              )}
              {researchAnalysis.originalAngles.length > 0 && (
                <div>
                  <p className="font-medium text-blue-800 mb-1">🎯 Original Angles ({researchAnalysis.originalAngles.length}):</p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1">
                    {researchAnalysis.originalAngles.map((angle, idx) => (
                      <li key={idx}>{angle}</li>
                    ))}
                  </ul>
                </div>
              )}
              {researchAnalysis.keyInsights.length > 0 && (
                <div>
                  <p className="font-medium text-blue-800 mb-1">🧠 Key Insights ({researchAnalysis.keyInsights.length}):</p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1">
                    {researchAnalysis.keyInsights.map((insight, idx) => (
                      <li key={idx}>{insight}</li>
                    ))}
                  </ul>
                </div>
              )}
              {researchAnalysis.synthesisStrategy && (
                <div className="md:col-span-2">
                  <p className="font-medium text-blue-800 mb-1">📋 Synthesis Strategy:</p>
                  <p className="text-blue-700">{researchAnalysis.synthesisStrategy}</p>
                </div>
              )}
            </div>
          </div>
        )}
        {!analyzing && !researchAnalysis && (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">No analysis results yet.</p>
            <p className="text-sm">Click &quot;🔍 Analyze&quot; above to analyze your research sources.</p>
          </div>
        )}
      </div>

      {/* Synthesis Section */}
      <div ref={synthesisRef} id="synthesis-section" className="bg-white shadow rounded-lg p-6 scroll-mt-4">
        <h3 className="text-lg font-semibold mb-4">🧠 Synthesis</h3>
        {workflowStep === 'synthesis' && (
          <div className="text-center py-8 text-blue-500">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
            <p>Synthesizing research into original content...</p>
          </div>
        )}
        {workflowStep !== 'synthesis' && researchAnalysis && (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">Ready to synthesize.</p>
            <p className="text-sm">Analysis complete. Click &quot;🧠 Analyze & Synthesize&quot; to generate content.</p>
          </div>
        )}
        {workflowStep !== 'synthesis' && !researchAnalysis && (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-2">Synthesis pending.</p>
            <p className="text-sm">Complete analysis first, then synthesis will begin.</p>
          </div>
        )}
      </div>

      {/* Generation Section */}
      <div ref={generationRef} id="generation-section" className="bg-white shadow rounded-lg p-6 scroll-mt-4">
        <h3 className="text-lg font-semibold mb-4">✨ Generation</h3>
        {workflowStep === 'generation' && (
          <div className="text-center py-8 text-purple-500">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mb-2"></div>
            <p>Generating content with AI...</p>
          </div>
        )}
        {workflowStep !== 'generation' && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Content generation will appear here during the workflow.</p>
          </div>
        )}
      </div>

      {/* Categorization Section */}
      <div ref={categorizationRef} id="categorization-section" className="bg-white shadow rounded-lg p-6 scroll-mt-4">
        <h3 className="text-lg font-semibold mb-4">🏷️ Categorization</h3>
        {workflowStep === 'categorization' && (
          <div className="text-center py-8 text-green-500">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full mb-2"></div>
            <p>Assigning categories and tags...</p>
          </div>
        )}
        {workflowStep !== 'categorization' && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Categories and tags will be assigned automatically.</p>
          </div>
        )}
      </div>

      {/* Import Section */}
      <div ref={importRef} id="import-section" className="bg-white shadow rounded-lg p-6 scroll-mt-4">
        <h3 className="text-lg font-semibold mb-4">💾 Import</h3>
        {workflowStep === 'import' && (
          <div className="text-center py-8 text-indigo-500">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full mb-2"></div>
            <p>Importing post to Sanity...</p>
          </div>
        )}
        {workflowStep !== 'import' && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Post will be imported to Sanity Studio as a draft.</p>
          </div>
        )}
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div ref={logsRef} className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm scroll-mt-4">
          <div className="mb-2 text-gray-400">Generation Logs:</div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div ref={resultRef} className={`bg-white shadow rounded-lg p-6 scroll-mt-4 ${result.success ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
            {result.success ? '✅ Success' : '❌ Error'}
          </h3>

          {result.success && result.data && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">{result.message}</p>
              </div>

              {result.data.wordCount && (
                <div className="bg-gray-50 rounded p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Word Count</div>
                      <div className="text-2xl font-bold">{result.data.wordCount}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <a
                  href="/studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View in Sanity Studio →
                </a>
              </div>
            </div>
          )}

          {!result.success && (
            <div className="text-red-700">
              <p>{result.error}</p>
              {result.details && (
                <pre className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto">
                  {result.details}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
