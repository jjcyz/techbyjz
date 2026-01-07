'use client';

import { useEffect, useState } from 'react';
import { getSanityStudioUrl } from '@/lib/sanity-studio-url';

interface Draft {
  _id: string;
  title: string;
  excerpt?: string;
  _createdAt: string;
  slug?: {
    current: string;
  };
  categories?: Array<{ title: string; slug?: { current: string } }>;
  tags?: Array<{ title: string; slug?: { current: string } }>;
}

export default function DraftManager() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchDrafts();
  }, []);

  async function fetchDrafts() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/drafts');
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch drafts');
      }

      setDrafts(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(postId: string, action: 'publish' | 'delete') {
    if (!confirm(`Are you sure you want to ${action} this draft?`)) {
      return;
    }

    try {
      setActionLoading(postId);
      const response = await fetch('/api/admin/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, action }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Failed to ${action} draft`);
      }

      // Refresh the list
      await fetchDrafts();
    } catch (err) {
      alert(err instanceof Error ? err.message : `Failed to ${action} draft`);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading drafts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
        <button
          onClick={fetchDrafts}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Draft Posts</h2>
        <button
          onClick={fetchDrafts}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Refresh
        </button>
      </div>

      {drafts.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500">No draft posts found.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categories
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drafts.map((draft) => (
                <tr key={draft._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {draft.title || 'Untitled'}
                    </div>
                    {draft.excerpt && (
                      <div className="text-sm text-gray-500 mt-1">
                        {draft.excerpt.substring(0, 100)}
                        {draft.excerpt.length > 100 ? '...' : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {draft._createdAt
                      ? new Date(draft._createdAt).toLocaleDateString()
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {draft.categories && draft.categories.length > 0
                      ? draft.categories.map((cat) => cat.title).join(', ')
                      : 'None'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <a
                        href={getSanityStudioUrl(draft._id, 'post')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </a>
                      <button
                        onClick={() => handleAction(draft._id, 'publish')}
                        disabled={actionLoading === draft._id}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      >
                        {actionLoading === draft._id ? 'Publishing...' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleAction(draft._id, 'delete')}
                        disabled={actionLoading === draft._id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {actionLoading === draft._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

