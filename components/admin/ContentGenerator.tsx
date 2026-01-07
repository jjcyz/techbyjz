'use client';

import { useState } from 'react';

interface GenerationResult {
  success: boolean;
  data?: {
    post: unknown;
    wordCount: number;
    published: boolean;
  };
  message?: string;
  error?: string;
  details?: string;
}

export default function ContentGenerator() {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);
    setLogs([]);

    addLog('Starting content generation...');
    if (topic) {
      addLog(`Topic: ${topic}`);
    }

    try {
      addLog('Fetching research sources...');
      addLog('Generating content with AI...');

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

      if (data.success) {
        addLog('✅ Content generated successfully!');
        if (data.data?.wordCount) {
          addLog(`Word Count: ${data.data.wordCount}`);
        }
      } else {
        addLog(`❌ Error: ${data.error}`);
        if (data.details) {
          addLog(`Details: ${data.details}`);
        }
      }

      setResult(data);
    } catch (error) {
      addLog(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate content',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
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

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Content'}
          </button>
        </div>
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

