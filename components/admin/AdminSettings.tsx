'use client';

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Content Generation Settings</h2>
        <p className="text-sm text-gray-600 mb-6">
          Content generation settings are configured via environment variables.
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <div className="text-sm text-blue-800">
              <strong>Environment Variables:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li><code className="bg-blue-100 px-1 rounded">OPENAI_API_KEY</code> - Required for content generation</li>
                <li><code className="bg-blue-100 px-1 rounded">SANITY_API_TOKEN</code> - Required for creating posts</li>
                <li><code className="bg-blue-100 px-1 rounded">ADMIN_PASSWORD</code> - Admin interface password</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
        <div className="space-y-2">
          <a
            href="/studio"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-blue-600 hover:text-blue-800"
          >
            → Open Sanity Studio
          </a>
        </div>
      </div>
    </div>
  );
}

