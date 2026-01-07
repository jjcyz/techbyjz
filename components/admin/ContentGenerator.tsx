'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ResearchArticle {
  title: string;
  url: string;
  content: string;
  source: string;
  publishedAt?: string;
  score?: number;
}

interface ResearchSources {
  articles: ResearchArticle[];
  sources: Record<string, ResearchArticle[]>;
  totalCount: number;
}

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

type WorkflowStep = 'idle' | 'research' | 'synthesis' | 'generation' | 'categorization' | 'import' | 'complete';

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

  // Section refs for scrolling
  const dataSourcesRef = useRef<HTMLDivElement>(null);
  const configurationRef = useRef<HTMLDivElement>(null);
  const logsRef = useRef<HTMLDivElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const fetchGeneralSources = useCallback(async () => {
    try {
      setLoadingSources(true);
      const response = await fetch('/api/admin/research-sources');
      const data = await response.json();
      if (data.success && data.data) {
        setResearchSources(data.data);
      } else {
        setResearchSources(null);
      }
    } catch {
      setResearchSources(null);
    } finally {
      setLoadingSources(false);
    }
  }, []);

  // Load sources on initial mount
  useEffect(() => {
    fetchGeneralSources();
  }, [fetchGeneralSources]);

  // Fetch research sources when topic changes (preview)
  useEffect(() => {
    const fetchPreview = async () => {
      if (topic && !isGenerating) {
        try {
          setLoadingSources(true);
          const response = await fetch(`/api/admin/research-sources?topic=${encodeURIComponent(topic)}`);
          const data = await response.json();
          if (data.success && data.data) {
            setResearchSources(data.data);
          } else {
            setResearchSources(null);
          }
        } catch {
          setResearchSources(null);
        } finally {
          setLoadingSources(false);
        }
      } else if (!topic && !isGenerating) {
        // Fetch general sources when no topic
        fetchGeneralSources();
      }
    };

    const timeoutId = setTimeout(fetchPreview, 500);
    return () => clearTimeout(timeoutId);
  }, [topic, isGenerating, fetchGeneralSources]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
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
      // Step 1: Research
      addLog('🔍 Fetching research sources...');
      setWorkflowStep('research');

      // Fetch research sources first
      setLoadingSources(true);
      const researchResponse = await fetch(`/api/admin/research-sources?topic=${encodeURIComponent(topic || '')}`);
      const researchData = await researchResponse.json();

      if (researchData.success && researchData.data) {
        setResearchSources(researchData.data);
        addLog(`✅ Found ${researchData.data.totalCount} articles from ${Object.keys(researchData.data.sources).length} sources`);
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
          topic: topic || undefined,
          systemPrompt: customSystemPrompt || undefined,
          userPrompt: customUserPrompt || undefined,
          model: model || undefined,
          temperature: temperature || undefined,
          maxTokens: maxTokens || undefined,
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
      description: 'Gather articles from multiple sources',
      details: [
        'Fetch top stories from HackerNews',
        'Retrieve articles from RSS feeds (TechCrunch, The Verge, Ars Technica)',
        'Filter and rank articles by relevance',
        'Extract key information from sources'
      ]
    },
    {
      id: 'synthesis',
      label: 'Synthesize',
      icon: '🧠',
      description: 'Analyze and connect insights',
      details: [
        'Identify key points from research',
        'Find connections between different sources',
        'Extract unique insights and patterns',
        'Prepare synthesis for content generation'
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
        targetElement = dataSourcesRef.current;
        break;
      case 'synthesis':
        // Synthesis doesn't have a specific section, scroll to data sources
        targetElement = dataSourcesRef.current;
        break;
      case 'generation':
        // Generation happens in the background, scroll to configuration
        targetElement = configurationRef.current;
        break;
      case 'categorization':
        // Categorization happens automatically, scroll to result or logs
        targetElement = resultRef.current;
        break;
      case 'import':
        // Import completes the process, scroll to result
        targetElement = resultRef.current;
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
      {/* Configuration Section */}
      <div ref={configurationRef} className="bg-white shadow rounded-lg p-6 scroll-mt-4">
        <h2 className="text-xl font-semibold mb-4">Generate New Content</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700">
              Topic (optional)
            </label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., artificial intelligence, web development"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
              disabled={isGenerating}
            />
            <p className="mt-1 text-sm text-gray-500">
              Leave empty to generate content about current tech trends
            </p>
          </div>

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
            disabled={isGenerating}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Content'}
          </button>
        </div>
      </div>

      {/* Visual Workflow - Always Visible */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Content Generation Workflow</h3>
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
                  <button
                    onClick={() => scrollToSection(step.id)}
                    className="mt-3 text-center cursor-pointer group-hover:text-blue-600 transition-colors"
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

      {/* Data Sources Section */}
      <div ref={dataSourcesRef} id="data-sources" className="bg-white shadow rounded-lg p-6 scroll-mt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            Data Sources
            {researchSources && researchSources.totalCount > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({researchSources.totalCount} articles)
              </span>
            )}
          </h3>
          <button
            onClick={fetchGeneralSources}
            disabled={loadingSources || isGenerating}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingSources ? 'Loading...' : '🔄 Refresh Sources'}
          </button>
        </div>

        {loadingSources && (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
            <p>Loading research sources...</p>
          </div>
        )}

        {!loadingSources && researchSources && researchSources.totalCount > 0 && (
          <div className="space-y-4">
            {Object.entries(researchSources.sources).map(([source, articles]) => (
              <div key={source} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{source}</h4>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {articles.length} {articles.length === 1 ? 'article' : 'articles'}
                  </span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {articles.slice(0, 5).map((article, idx) => (
                    <div key={idx} className="text-sm">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {article.title}
                      </a>
                      {article.score && (
                        <span className="ml-2 text-xs text-gray-500">(Score: {article.score})</span>
                      )}
                      {article.publishedAt && (
                        <span className="ml-2 text-xs text-gray-500">
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                  {articles.length > 5 && (
                    <p className="text-xs text-gray-500">+ {articles.length - 5} more articles</p>
                  )}
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
