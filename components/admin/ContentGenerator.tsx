'use client';

import { useState, useEffect, useCallback } from 'react';

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

  const workflowSteps: Array<{ id: WorkflowStep; label: string; icon: string }> = [
    { id: 'research', label: 'Research', icon: '🔍' },
    { id: 'synthesis', label: 'Synthesize', icon: '🧠' },
    { id: 'generation', label: 'Generate', icon: '✨' },
    { id: 'categorization', label: 'Categorize', icon: '🏷️' },
    { id: 'import', label: 'Import', icon: '💾' },
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

  return (
    <div className="space-y-6 min-h-[600px]">
      {/* Configuration Section */}
      <div className="bg-white shadow rounded-lg p-6">
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
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showAdvanced ? '▼' : '▶'} Advanced Options
            </button>
            {showAdvanced && (
              <div className="mt-3 space-y-3 p-4 bg-gray-50 rounded-md">
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

      {/* Visual Workflow */}
      {isGenerating && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Generation Workflow</h3>
          <div className="flex items-center justify-between">
            {workflowSteps.map((step, index) => {
              const status = getStepStatus(step.id);
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all ${
                        status === 'active'
                          ? 'bg-blue-500 text-white scale-110 shadow-lg'
                          : status === 'complete'
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {status === 'complete' ? '✓' : step.icon}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium ${
                        status === 'active' ? 'text-blue-600' : status === 'complete' ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < workflowSteps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 transition-all ${
                        status === 'complete' ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Data Sources Section */}
      <div className="bg-white shadow rounded-lg p-6">
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
        <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm">
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
        <div className={`bg-white shadow rounded-lg p-6 ${result.success ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
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
