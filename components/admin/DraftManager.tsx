'use client';

import React, { useEffect, useState } from 'react';
import RichTextEditor from '@/components/posts/RichTextEditor';
import InlineEditableField from './InlineEditableField';
import type { Category, Tag } from '@/types/post';
import type { PortableTextContent } from '@/components/posts/RichTextEditor/types';

interface Draft {
  _id: string;
  title: string;
  excerpt?: string;
  _createdAt: string;
  slug?: {
    current: string;
  };
  categories?: Array<{ _id: string; title: string; slug?: { current: string } }>;
  tags?: Array<{ _id: string; title: string; slug?: { current: string } }>;
}

interface PostDetail extends Draft {
  content?: PortableTextContent[];
}

export default function DraftManager() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<PostDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [savingField, setSavingField] = useState<string | null>(null);

  useEffect(() => {
    fetchDrafts();
    fetchCategoriesAndTags();
  }, []);

  async function fetchCategoriesAndTags() {
    try {
      const [catsRes, tagsRes] = await Promise.all([
        fetch('/api/admin/categories'),
        fetch('/api/admin/tags'),
      ]);

      const catsData = await catsRes.json();
      const tagsData = await tagsRes.json();

      if (catsData.success) setCategories(catsData.data || []);
      if (tagsData.success) setTags(tagsData.data || []);
    } catch {
      // Silently fail - categories/tags will just be empty arrays
    }
  }

  async function handleExpand(postId: string) {
    if (expandedPostId === postId) {
      // Collapse if already expanded
      setExpandedPostId(null);
      setExpandedPost(null);
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/admin/posts/${postId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch post');
      }

      setExpandedPost(data.data);
      setExpandedPostId(postId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post for editing');
    }
  }

  async function handleSaveField(postId: string, field: string, value: string | string[]) {
    setSavingField(`${postId}-${field}`);
    try {
      const updateData: Record<string, unknown> = { [field]: value };
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save');
      }

      // Update local state
      await fetchDrafts();
      if (expandedPostId === postId && expandedPost) {
        const updatedPost = { ...expandedPost, [field]: value };
        setExpandedPost(updatedPost);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingField(null);
    }
  }

  async function handleSaveCategoriesTags(postId: string, categoryIds: string[], tagIds: string[]) {
    setSavingField(`${postId}-categories-tags`);
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryIds,
          tagIds,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save');
      }

      // Update local state
      await fetchDrafts();
      if (expandedPostId === postId && expandedPost) {
        const updatedCategories = categories.filter((cat) => categoryIds.includes(cat._id));
        const updatedTags = tags.filter((tag) => tagIds.includes(tag._id));
        setExpandedPost({
          ...expandedPost,
          categories: updatedCategories,
          tags: updatedTags,
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingField(null);
    }
  }

  async function handleCreateCategory(title: string): Promise<Category> {
    const response = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to create category');
    }

    // Refresh categories list
    await fetchCategoriesAndTags();

    return data.data;
  }

  async function handleCreateTag(title: string): Promise<Tag> {
    const response = await fetch('/api/admin/tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to create tag');
    }

    // Refresh tags list
    await fetchCategoriesAndTags();

    return data.data;
  }

  async function handleCategoriesChange(
    postId: string,
    newCategories: Category[],
    currentTags: Tag[]
  ) {
    setSavingField(`${postId}-categories`);
    try {
      const categoryIds = newCategories.map((cat) => cat._id);
      const tagIds = currentTags.map((tag) => tag._id);
      await handleSaveCategoriesTags(postId, categoryIds, tagIds);

      // Update local state
      await fetchDrafts();
      if (expandedPostId === postId && expandedPost) {
        setExpandedPost({
          ...expandedPost,
          categories: newCategories,
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save categories');
    } finally {
      setSavingField(null);
    }
  }

  async function handleTagsChange(
    postId: string,
    newTags: Tag[],
    currentCategories: Category[]
  ) {
    setSavingField(`${postId}-tags`);
    try {
      const tagIds = newTags.map((tag) => tag._id);
      const categoryIds = currentCategories.map((cat) => cat._id);
      await handleSaveCategoriesTags(postId, categoryIds, tagIds);

      // Update local state
      await fetchDrafts();
      if (expandedPostId === postId && expandedPost) {
        setExpandedPost({
          ...expandedPost,
          tags: newTags,
        });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save tags');
    } finally {
      setSavingField(null);
    }
  }

  async function handleSaveContent(postId: string, content: PortableTextContent[]) {
    setSavingField(`${postId}-content`);
    try {
      const response = await fetch(`/api/admin/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save content');
      }

      // Update local state
      if (expandedPostId === postId && expandedPost) {
        setExpandedPost({ ...expandedPost, content });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save content');
    } finally {
      setSavingField(null);
    }
  }

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
        <div className="bg-white shadow rounded-lg" style={{ overflow: 'visible', position: 'relative' }}>
          <div className="overflow-x-auto" style={{ overflowY: 'visible' }}>
            <table className="min-w-full divide-y divide-gray-200" style={{ overflow: 'visible' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title & Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200" style={{ overflow: 'visible' }}>
                {drafts.map((draft) => {
                  const isExpanded = expandedPostId === draft._id;
                  const postData = isExpanded && expandedPost ? expandedPost : draft;
                  const isSaving = savingField?.startsWith(draft._id);

                  return (
                    <React.Fragment key={draft._id}>
                      <tr className={isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                        <td className="px-6 py-4 relative" style={{ overflow: 'visible' }}>
                        <div className="space-y-3">
                          <div className="text-sm font-medium">
                            <InlineEditableField
                              value={postData.title || ''}
                              onSave={(value) => handleSaveField(draft._id, 'title', value)}
                              placeholder="Untitled"
                              className="font-medium text-gray-900"
                            />
                          </div>
                          <div className="text-sm">
                            <InlineEditableField
                              value={postData.excerpt || ''}
                              onSave={(value) => handleSaveField(draft._id, 'excerpt', value)}
                              placeholder="Add excerpt..."
                              multiline
                              className="text-gray-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-600 whitespace-nowrap">
                                Categories
                              </label>
                              <InlineEditableField
                                value=""
                                onSave={async () => {}}
                                tags={postData.categories || []}
                                availableTags={categories}
                                onTagsChange={(newCategories) =>
                                  handleCategoriesChange(
                                    draft._id,
                                    newCategories,
                                    postData.tags || []
                                  )
                                }
                                onCreateTag={handleCreateCategory}
                                placeholder="Add categories..."
                                className="flex-1"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-600 whitespace-nowrap">
                                Tags
                              </label>
                              <InlineEditableField
                                value=""
                                onSave={async () => {}}
                                tags={postData.tags || []}
                                availableTags={tags}
                                onTagsChange={(newTags) =>
                                  handleTagsChange(
                                    draft._id,
                                    newTags,
                                    postData.categories || []
                                  )
                                }
                                onCreateTag={handleCreateTag}
                                placeholder="Add tags..."
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {draft._createdAt
                          ? new Date(draft._createdAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleExpand(draft._id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {isExpanded ? 'Collapse' : 'Expand'}
                          </button>
                          <button
                            onClick={() => handleAction(draft._id, 'publish')}
                            disabled={actionLoading === draft._id || isSaving}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {actionLoading === draft._id ? 'Publishing...' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleAction(draft._id, 'delete')}
                            disabled={actionLoading === draft._id || isSaving}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {actionLoading === draft._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && expandedPost && (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h3 className="text-lg font-semibold text-gray-900">
                                Edit Content
                              </h3>
                              {isSaving && (
                                <span className="text-sm text-gray-500">Saving...</span>
                              )}
                            </div>
                            <RichTextEditor
                              initialContent={expandedPost.content || []}
                              onSave={(content) => handleSaveContent(draft._id, content)}
                              onCancel={() => handleExpand(draft._id)}
                              isSaving={savingField === `${draft._id}-content`}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

